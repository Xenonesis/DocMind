import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-service'
import { createServerClientForToken, supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { z } from 'zod'

const searchFilterSchema = z.object({
  type: z.string().max(64).optional(),
  category: z.string().max(64).optional(),
})

const searchBodySchema = z.object({
  query: z.string().min(1).max(4000),
  filters: searchFilterSchema.optional().default({}),
  limit: z.number().int().min(1).max(50).optional().default(10),
  provider: z.string().max(128).optional(),
})

function sanitizeFilterValue(value: string | undefined): string {
  if (!value) return ''
  return value.trim().replace(/[%_]/g, '')
}

async function callBasicSearch(request: NextRequest, body: Record<string, unknown>) {
  const response = await fetch(new URL('/api/search-basic', request.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('authorization') || ''
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  })

  const payload = await response.json()
  return NextResponse.json(payload, { status: response.status })
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const parsed = searchBodySchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid search payload' }, { status: 400 })
    }

    const { query, filters, limit, provider } = parsed.data

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
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

    let documentsQuery = db
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(50)

    const safeType = sanitizeFilterValue(filters.type)
    const safeCategory = sanitizeFilterValue(filters.category)

    if (safeType) {
      documentsQuery = documentsQuery.ilike('type', `%${safeType}%`)
    }

    if (safeCategory) {
      documentsQuery = documentsQuery.ilike('category', `%${safeCategory}%`)
    }

    const { data: documents, error: documentsError } = await documentsQuery

    if (documentsError) {
      console.error('Search documents fetch error:', documentsError)
      return NextResponse.json({ error: 'Failed to fetch searchable documents' }, { status: 500 })
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({
        results: [],
        query: query.trim(),
        total: 0,
        message: 'No documents available for search'
      })
    }

    try {
      const aiService = AIService.getInstance()
      await aiService.loadProvidersFromDatabase(user.id)

      const allProviders = aiService.getProviders()
      const activeProvider = provider
        ? allProviders.find((item) => item.id === provider || item.name === provider)
        : aiService.getActiveProvider()

      if (!activeProvider) {
        return callBasicSearch(request, { query, filters, limit })
      }

      const documentContexts = documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        content: doc.content || '',
        category: doc.category || '',
        type: doc.type,
        metadata: doc.metadata
          ? (typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata)
          : {},
        uploadDate: doc.upload_date
      }))

      const searchPrompt = `You are performing semantic search on a collection of documents.
Search Query: "${query}"

Available Documents:
${documentContexts.map((doc) => `
Document ID: ${doc.id}
Name: ${doc.name}
Type: ${doc.type}
Category: ${doc.category}
Content: ${String(doc.content).slice(0, 4000)}
Upload Date: ${doc.uploadDate}
`).join('\n---\n')}

Return JSON in this shape:
{
  "results": [
    {
      "documentId": "doc_id",
      "relevanceScore": 0.95,
      "reason": "Why it matches",
      "keyMatches": ["term"],
      "category": "document category"
    }
  ],
  "summary": "Short summary",
  "totalRelevant": 1
}`

      const completion = await aiService.generateCompletion({
        provider: activeProvider,
        prompt: searchPrompt,
        systemPrompt: 'You are an expert semantic search engine specialized in document analysis. Always return valid JSON.',
        temperature: 0.1,
        maxTokens: 2000
      })

      let searchResults: any
      try {
        searchResults = JSON.parse(completion.content)
      } catch {
        return callBasicSearch(request, { query, filters, limit })
      }

      const enhancedResults = searchResults.results
        .map((result: any) => {
          const document = documents.find((doc) => doc.id === result.documentId)
          if (!document) return null

          return {
            ...result,
            document: {
              id: document.id,
              name: document.name,
              type: document.type,
              size: document.size,
              category: document.category,
              uploadDate: document.upload_date,
              processedAt: document.processed_at
            }
          }
        })
        .filter(Boolean)
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)

      return NextResponse.json({
        results: enhancedResults,
        query: query.trim(),
        total: enhancedResults.length,
        summary: searchResults.summary,
        searchType: 'semantic',
        provider: activeProvider.name,
        usage: completion.usage
      })
    } catch (error) {
      console.error('AI semantic search error:', error)
      return callBasicSearch(request, { query, filters, limit })
    }
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    return callBasicSearch(request, {
      query,
      filters: {
        ...(type ? { type } : {}),
        ...(category ? { category } : {})
      },
      limit
    })
  } catch (error) {
    console.error('GET search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
