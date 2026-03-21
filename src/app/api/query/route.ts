import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, createServerClientForToken } from '@/lib/supabase'
import { getAuthenticatedUser, ensureUserProfile } from '@/lib/auth-server'
import { AIService } from '@/lib/ai-service'

function parseJsonSafely(value: unknown, fallback: any) {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  if (typeof value === 'object') return value
  return fallback
}

export async function POST(request: NextRequest) {
  try {
    const { query, documentIds, provider, history } = await request.json()

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const db = createServerClientForToken(token) || supabaseServer

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    await ensureUserProfile(user, db)

    const { data: queryRecord, error: createError } = await db
      .from('queries')
      .insert({
        user_id: user.id,
        query_text: query.trim(),
        document_ids: documentIds ? JSON.stringify(documentIds) : '[]',
        response: '',
        ai_provider: provider || 'unknown',
        ai_model: 'unknown'
      })
      .select()
      .single()

    if (createError || !queryRecord) {
      console.error('Failed to create query record:', createError)
      return NextResponse.json({ error: 'Failed to create query record' }, { status: 500 })
    }

    try {
      const aiService = AIService.getInstance()

      await aiService.loadProvidersFromDatabase(user.id)

      const allProviders = aiService.getProviders()
      let activeProvider = (provider
        ? allProviders.find(p => p.id === provider) || allProviders.find(p => p.name === provider)
        : aiService.getActiveProvider())

      if (!activeProvider) {
        // Priority: Groq (reliable & available) > Modal.direct (may be down)
        if (process.env.GROQ_API_KEY) {
          activeProvider = {
            id: 'docscan-free-groq',
            name: 'DocScan llama-3.1-8b from groq (free)',
            type: 'groq',
            baseUrl: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY,
            model: 'llama-3.1-8b-instant',
            maxTokens: 4096,
            temperature: 0.7,
            isActive: true,
            isConfigured: true
          } as any
        } else if (process.env.DOCSCAN_FREE_API_KEY) {
          activeProvider = {
            id: 'docscan-free-builtin',
            name: 'DocScan Glm-5 (free)',
            type: 'openai-compatible',
            baseUrl: process.env.DOCSCAN_FREE_BASE_URL || 'https://api.us-west-2.modal.direct/v1',
            apiKey: process.env.DOCSCAN_FREE_API_KEY,
            model: 'zai-org/GLM-5-FP8',
            maxTokens: 4096,
            temperature: 0.7,
            isActive: true,
            isConfigured: true
          } as any
        } else {
          return NextResponse.json({
            error: 'No AI provider configured. Please configure an AI provider in Settings.'
          }, { status: 400 })
        }
      }

      const providerConfig = activeProvider!

      let documentsQuery = db
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false })
        .limit(10)

      if (documentIds && documentIds.length > 0) {
        documentsQuery = documentsQuery.in('id', documentIds)
      }

      const { data: documents, error: docsError } = await documentsQuery

      if (docsError) {
        console.error('Error fetching documents:', docsError)
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
      }

      const context = (documents || []).map(doc => ({
        name: doc.name,
        content: doc.content || '',
        category: doc.category || '',
        metadata: parseJsonSafely(doc.metadata, {})
      }))

      const systemPrompt = `You are an expert document analysis assistant. Answer the user's question clearly and concisely based on the provided document context. If asked for summaries, key points, comparisons, or analysis — provide them helpfully. Always mention which document you're referencing. If the answer is not found in the documents, say so clearly.`

      const historyText = Array.isArray(history) && history.length > 0
        ? `\n\nConversation history (for context):\n${history.map((m: any) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`).join('\n')}\n`
        : ''

      const userPrompt = `
        Query: ${query}
${historyText}
        Document Context:
        ${context.map((doc, index) => `
        Document ${index + 1}: ${doc.name}
        Category: ${doc.category}
        Content: ${doc.content.slice(0, 4000)}
        `).join('\n')}

        Please provide a comprehensive but concise answer. Respond in plain text (no JSON), referencing the documents by name where relevant.
      `

      // Try primary provider, fallback to Groq on upstream errors
      let completion
      try {
        completion = await aiService.generateCompletion({
          provider: providerConfig,
          prompt: userPrompt,
          systemPrompt,
          temperature: providerConfig.temperature || 0.3,
          maxTokens: providerConfig.maxTokens || 4096
        })
      } catch (primaryErr: any) {
        const isUpstreamErr = /upstream|timed out|network error/i.test(primaryErr?.message || '')
        if (isUpstreamErr && process.env.GROQ_API_KEY && providerConfig.id !== 'docscan-free-groq') {
          console.warn('Primary provider failed, falling back to Groq:', primaryErr.message)
          const groqFallback = {
            id: 'docscan-free-groq',
            name: 'DocScan llama-3.1-8b from groq (free)',
            type: 'groq' as const,
            baseUrl: 'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY!,
            model: 'llama-3.1-8b-instant',
            maxTokens: 4096,
            temperature: 0.7,
            isActive: true,
            isConfigured: true
          }
          completion = await aiService.generateCompletion({
            provider: groqFallback,
            prompt: userPrompt,
            systemPrompt,
            temperature: 0.3,
            maxTokens: 4096
          })
        } else {
          throw primaryErr
        }
      }

      let aiResponse: any
      const rawContent = completion.content
      try {
        aiResponse = JSON.parse(rawContent)
      } catch {
        aiResponse = {
          answer: rawContent,
          relevantDocuments: (documents || []).map(doc => doc.name)
        }
      }

      const { error: updateError } = await db
        .from('queries')
        .update({
          response: JSON.stringify(aiResponse),
          ai_provider: providerConfig.name,
          ai_model: providerConfig.model || 'unknown',
          tokens_used: completion.usage?.totalTokens || 0,
          processing_time_ms: Date.now() - new Date(queryRecord.created_at).getTime()
        })
        .eq('id', queryRecord.id)

      if (updateError) {
        console.error('Failed to update query record:', updateError)
      }

      return NextResponse.json({
        id: queryRecord.id,
        query: queryRecord.query_text,
        status: 'COMPLETED',
        response: aiResponse,
        timestamp: queryRecord.timestamp,
        provider: providerConfig.name,
        usage: completion.usage
      })

    } catch (aiError: any) {
      console.error('AI processing error:', aiError)

      const message = typeof aiError?.message === 'string' ? aiError.message : 'AI processing failed'
      const isConfigError = /api key not configured|no ai provider configured|unsupported provider/i.test(message)

      await db
        .from('queries')
        .update({
          response: JSON.stringify({ error: message }),
          ai_provider: 'error',
          ai_model: 'error'
        })
        .eq('id', queryRecord.id)

      return NextResponse.json({
        id: queryRecord.id,
        query: queryRecord.query_text,
        status: 'ERROR',
        error: message
      }, { status: isConfigError ? 400 : 500 })
    }

  } catch (error) {
    console.error('Query processing error:', error)
    return NextResponse.json({ error: 'Failed to process query' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const db = createServerClientForToken(token) || supabaseServer

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: queries, error } = await db
      .from('queries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching queries:', error)
      return NextResponse.json({ error: 'Failed to fetch queries' }, { status: 500 })
    }

    const formattedQueries = (queries || []).map(query => ({
      id: query.id,
      query: query.query_text,
      status: 'COMPLETED',
      response: parseJsonSafely(query.response, null),
      timestamp: query.timestamp,
      documentIds: parseJsonSafely(query.document_ids, []),
      provider: query.ai_provider,
      model: query.ai_model,
      tokensUsed: query.tokens_used,
      processingTime: query.processing_time_ms
    }))

    return NextResponse.json(formattedQueries)

  } catch (error) {
    console.error('Error fetching queries:', error)
    return NextResponse.json({ error: 'Failed to fetch queries' }, { status: 500 })
  }
}
