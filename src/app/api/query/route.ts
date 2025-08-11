import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser, ensureUserProfile } from '@/lib/auth-server'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { query, documentIds, provider } = await request.json()
    
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Ensure user profile exists
    await ensureUserProfile(user)

    // Create query record in database
    const { data: queryRecord, error: createError } = await supabaseServer
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

    // Process the query using configured AI provider
    try {
      const aiService = AIService.getInstance()
      
      // Load providers from database for server-side usage
      await aiService.loadProvidersFromDatabase(user.id)
      
      // Allow client to choose provider by id; fallback to active
      const allProviders = aiService.getProviders()
      const activeProvider = (provider
        ? allProviders.find(p => p.id === provider) || allProviders.find(p => p.name === provider)
        : aiService.getActiveProvider())

      if (!activeProvider) {
        return NextResponse.json({ 
          error: 'No AI provider configured. Please configure a real AI provider in Settings.' 
        }, { status: 400 })
      }
      
      // Get relevant documents for context
      let documentsQuery = supabaseServer
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false })
        .limit(10)

      // Filter by specific document IDs if provided
      if (documentIds && documentIds.length > 0) {
        documentsQuery = documentsQuery.in('id', documentIds)
      }

      const { data: documents, error: docsError } = await documentsQuery

      if (docsError) {
        console.error('Error fetching documents:', docsError)
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
      }

      // Prepare context from documents
      const context = (documents || []).map(doc => ({
        name: doc.name,
        content: doc.content || '',
        category: doc.category || '',
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {}
      }))

      // Create AI prompt
      const systemPrompt = `You are an expert document analysis assistant with deep knowledge of contracts, claims, policies, and compliance requirements. Analyze the following query and provide insights based on the provided document context.

      Provide your response in the following JSON format:
      {
        "answer": "Direct answer to the query",
        "insights": ["insight 1", "insight 2", ...],
        "patterns": ["pattern 1", "pattern 2", ...],
        "confidence": 85,
        "relevantDocuments": ["doc1.pdf", "doc2.pdf", ...]
      }`

      const userPrompt = `
        Query: ${query}

        Document Context:
        ${context.map((doc, index) => `
        Document ${index + 1}: ${doc.name}
        Category: ${doc.category}
        Content: ${doc.content}
        `).join('\n')}

        Please provide a comprehensive analysis of the query based on the document context.
      `

      const completion = await aiService.generateCompletion({
        provider: activeProvider,
        prompt: userPrompt,
        systemPrompt,
        temperature: activeProvider.temperature || 0.3,
        maxTokens: activeProvider.maxTokens || 1000
      })

      let aiResponse
      try {
        aiResponse = JSON.parse(completion.content)
      } catch (parseError) {
        // If AI response is not valid JSON, create a structured response
        aiResponse = {
          answer: completion.content,
          insights: [],
          patterns: [],
          confidence: 75,
          relevantDocuments: (documents || []).map(doc => doc.name)
        }
      }

      // Update query record with results
      const { error: updateError } = await supabaseServer
        .from('queries')
        .update({
          response: JSON.stringify(aiResponse),
          ai_provider: activeProvider.name,
          ai_model: activeProvider.model || 'unknown',
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
        provider: activeProvider.name,
        usage: completion.usage
      })

    } catch (aiError: any) {
      console.error('AI processing error:', aiError)

      const message = typeof aiError?.message === 'string' ? aiError.message : 'AI processing failed'
      const isConfigError = /api key not configured|no ai provider configured|unsupported provider/i.test(message)

      // Update query record with error
      await supabaseServer
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
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's queries
    const { data: queries, error } = await supabaseServer
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
      status: 'COMPLETED', // Assuming completed if stored
      response: query.response ? JSON.parse(query.response) : null,
      timestamp: query.timestamp,
      documentIds: query.document_ids ? JSON.parse(query.document_ids) : [],
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