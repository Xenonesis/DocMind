import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, createServerClientForToken } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { documentIds } = await request.json()

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

    // Fetch documents to analyze
    let docsQuery = db
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED')

    if (documentIds && documentIds.length > 0) {
      docsQuery = docsQuery.in('id', documentIds)
    } else {
      docsQuery = docsQuery.limit(5)
    }

    const { data: documents, error: docsError } = await docsQuery

    if (docsError || !documents || documents.length === 0) {
      return NextResponse.json(
        {
          error: 'No completed documents found to analyze.',
        },
        { status: 400 }
      )
    }

    // Setup AI provider
    const aiService = AIService.getInstance()
    await aiService.loadProvidersFromDatabase(user.id)

    let activeProvider = aiService.getActiveProvider() as any

    if (!activeProvider) {
      if (process.env.GROQ_API_KEY) {
        activeProvider = {
          id: 'docscan-free-groq',
          name: 'DocScan llama-3.1-8b from groq (free)',
          type: 'groq',
          baseUrl: 'https://api.groq.com/openai/v1',
          apiKey: process.env.GROQ_API_KEY,
          model: 'llama-3.1-8b-instant',
          maxTokens: 2048,
          temperature: 0.3,
          isActive: true,
          isConfigured: true,
        }
      } else {
        return NextResponse.json(
          {
            error: 'No AI provider configured. Please configure an AI provider in Settings.',
          },
          { status: 400 }
        )
      }
    }

    const generatedAnalyses: any[] = []

    for (const doc of documents) {
      const content = (doc.content || '').slice(0, 3000)
      if (!content.trim()) continue

      const prompt = `Analyze the following document and extract structured insights. Return a JSON array with 2-4 items. Each item must have exactly these fields:
{
  "type": "INSIGHT" | "RISK" | "OPPORTUNITY" | "COMPLIANCE",
  "title": "Short descriptive title (max 10 words)",
  "description": "2-3 sentence explanation",
  "confidence": number between 60-98,
  "severity": "LOW" | "MEDIUM" | "HIGH"
}

Document name: ${doc.name}
Category: ${doc.category || 'General'}
Content:
${content}

Respond with ONLY a valid JSON array, no extra text.`

      try {
        const completion = await aiService.generateCompletion({
          provider: activeProvider,
          prompt,
          systemPrompt:
            'You are a document analysis expert. Extract clear, actionable insights from documents. Always respond with valid JSON only.',
          temperature: 0.3,
          maxTokens: 1024,
        })

        let items: any[] = []
        try {
          const rawText = completion.content.trim()
          const jsonMatch = rawText.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            items = JSON.parse(jsonMatch[0])
          }
        } catch {
          // If JSON parse fails, create a basic insight
          items = [
            {
              type: 'INSIGHT',
              title: `Analysis of ${doc.name}`,
              description: completion.content.slice(0, 200),
              confidence: 75,
              severity: 'LOW',
            },
          ]
        }

        for (const item of items) {
          if (!item.type || !item.title) continue
          const validTypes = ['INSIGHT', 'RISK', 'OPPORTUNITY', 'COMPLIANCE']
          if (!validTypes.includes(item.type)) item.type = 'INSIGHT'

          const { data: saved } = await db
            .from('analyses')
            .insert({
              user_id: user.id,
              document_id: doc.id,
              analysis_type: item.type,
              result: {
                title: item.title,
                description: item.description,
                confidence: item.confidence || 80,
                severity: item.severity || 'LOW',
                summary: item.description,
              },
              ai_provider: activeProvider.name,
              ai_model: activeProvider.model,
              tokens_used: completion.usage?.totalTokens || 0,
              processing_time_ms: 0,
            })
            .select()
            .single()

          if (saved) {
            generatedAnalyses.push({
              id: saved.id,
              type: item.type,
              title: item.title,
              description: item.description,
              confidence: item.confidence || 80,
              severity: item.severity || 'LOW',
              documents: [doc.name],
              document: { id: doc.id, name: doc.name, type: doc.type, category: doc.category },
              timestamp: saved.created_at,
              metadata: {},
            })
          }
        }
      } catch (err) {
        console.error(`Analysis failed for doc ${doc.id}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      count: generatedAnalyses.length,
      analyses: generatedAnalyses,
    })
  } catch (error) {
    console.error('Error generating analysis:', error)
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 })
  }
}
