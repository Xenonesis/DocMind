import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/db'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { query, filters = {}, limit = 10, provider } = await request.json()
    
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Get all completed documents for searching
    let documents: any[] = await documentService.getWhere('status', '==', 'COMPLETED')
    
    // Apply additional filters
    if (filters.type) {
      documents = documents.filter(doc => doc.type.toLowerCase().includes(filters.type.toLowerCase()))
    }
    
    if (filters.category) {
      documents = documents.filter(doc => doc.category?.toLowerCase().includes(filters.category.toLowerCase()))
    }
    
    // Sort by creation date and limit for performance
    documents = documents
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50)

    if (documents.length === 0) {
      return NextResponse.json({
        results: [],
        query: query.trim(),
        total: 0,
        message: 'No documents available for search'
      })
    }

    try {
      const aiService = AIService.getInstance()
      // Ensure providers are loaded from database on server
      await aiService.loadProvidersFromDatabase()
      const activeProvider = aiService.getActiveProvider()

      if (!activeProvider) {
        return NextResponse.json({ 
          error: 'No AI provider configured. Please configure an AI provider in settings.' 
        }, { status: 400 })
      }
      
      // Prepare document contexts for semantic search
      const documentContexts = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        content: doc.content || '',
        category: doc.category || '',
        type: doc.type,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
        uploadDate: doc.uploadDate.toISOString()
      }))

      // Create semantic search prompt
      const searchPrompt = `You are performing semantic search on a collection of documents. 
Search Query: "${query}"

Available Documents:
${documentContexts.map((doc, index) => `
Document ID: ${doc.id}
Name: ${doc.name}
Type: ${doc.type}
Category: ${doc.category}
Content: ${doc.content}
Upload Date: ${doc.uploadDate}
`).join('\n---\n')}

Please analyze the search query and find the most relevant documents. 
Consider semantic meaning, context, and intent rather than just keyword matching.

Return your response as a JSON object with the following structure:
{
  "results": [
    {
      "documentId": "doc_id",
      "relevanceScore": 0.95,
      "reason": "Explanation of why this document is relevant",
      "keyMatches": ["key phrase 1", "key phrase 2"],
      "category": "document category"
    }
  ],
  "summary": "Brief summary of what was found",
  "totalRelevant": 3
}

Focus on documents that actually contain relevant information, not just superficial matches.
Provide relevance scores between 0 and 1, where 1 is perfectly relevant.`

      const messages = [
        {
          role: 'system' as const,
          content: 'You are an expert semantic search engine specialized in document analysis. You understand context, intent, and can find relevant information even when exact keywords are not present.'
        },
        {
          role: 'user' as const,
          content: searchPrompt
        }
      ]

      const completion = await aiService.generateCompletion({
        provider: activeProvider,
        prompt: searchPrompt,
        systemPrompt: 'You are an expert semantic search engine specialized in document analysis. You understand context, intent, and can find relevant information even when exact keywords are not present.',
        temperature: 0.1, // Low temperature for consistent results
        maxTokens: 2000
      })

      let searchResults
      try {
        searchResults = JSON.parse(completion.content)
      } catch (parseError) {
        // If AI response is not valid JSON, perform fallback search
        return NextResponse.json(fallbackKeywordSearch(query, documents, limit))
      }

      // Enhance results with full document details
      const enhancedResults = await Promise.all(
        searchResults.results.map(async (result: any) => {
          const document = documents.find(doc => doc.id === result.documentId)
          return {
            ...result,
            document: document ? {
              id: document.id,
              name: document.name,
              type: document.type,
              size: document.size,
              category: document.category,
              uploadDate: document.uploadDate,
              processedAt: document.processedAt
            } : null
          }
        })
      )

      // Filter out results without documents and sort by relevance
      const validResults = enhancedResults
        .filter(result => result.document)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)

      return NextResponse.json({
        results: validResults,
        query: query.trim(),
        total: validResults.length,
        summary: searchResults.summary,
        searchType: 'semantic',
        provider: activeProvider.name,
        usage: completion.usage
      })

    } catch (aiError) {
      console.error('AI semantic search error:', aiError)
      
      // Fallback to basic keyword search
      return NextResponse.json(fallbackKeywordSearch(query, documents, limit))
    }

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

async function fallbackKeywordSearch(query: string, documents: any[], limit: number) {
  const queryLower = query.toLowerCase()
  const queryTerms = queryLower.split(' ').filter(term => term.length > 2)
  
  const results = documents
    .map(doc => {
      let score = 0
      const keyMatches: string[] = []
      
      // Search in name
      const nameLower = doc.name.toLowerCase()
      queryTerms.forEach(term => {
        if (nameLower.includes(term)) {
          score += 0.3
          keyMatches.push(term)
        }
      })
      
      // Search in content
      const contentLower = (doc.content || '').toLowerCase()
      queryTerms.forEach(term => {
        if (contentLower.includes(term)) {
          score += 0.5
          keyMatches.push(term)
        }
      })
      
      // Search in category
      const categoryLower = (doc.category || '').toLowerCase()
      queryTerms.forEach(term => {
        if (categoryLower.includes(term)) {
          score += 0.4
          keyMatches.push(term)
        }
      })
      
      // Bonus for exact phrase matches
      if (contentLower.includes(queryLower) || nameLower.includes(queryLower)) {
        score += 0.7
        keyMatches.push(query)
      }
      
      return {
        documentId: doc.id,
        relevanceScore: Math.min(score, 1),
        reason: `Keyword match found in ${keyMatches.length > 0 ? keyMatches.join(', ') : 'document content'}`,
        keyMatches: [...new Set(keyMatches)],
        category: doc.category || 'Unknown',
        document: {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          category: doc.category,
          uploadDate: doc.uploadDate,
          processedAt: doc.processedAt
        }
      }
    })
    .filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)

  return {
    results,
    query,
    total: results.length,
    summary: `Found ${results.length} documents matching your search terms`,
    searchType: 'keyword'
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

    // Build filters
    const filters: any = {}
    if (type) filters.type = type
    if (category) filters.category = category

    // Perform search
    const searchBody = {
      query,
      filters,
      limit
    }

    // Forward to POST endpoint
    const response = await fetch(`${request.url}/../search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    })

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('GET search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}