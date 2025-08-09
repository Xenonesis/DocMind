import { NextRequest, NextResponse } from 'next/server'
import { queryService, documentService, QueryStatus } from '@/lib/db'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { query, documentIds, provider } = await request.json()
    
    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Create query record
    const queryRecordId = await queryService.create({
      query: query.trim(),
      status: QueryStatus.PROCESSING,
      documentIds: documentIds ? JSON.stringify(documentIds) : undefined,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    const queryRecord = await queryService.getById(queryRecordId)

    // Process the query using configured AI provider
    try {
      const aiService = AIService.getInstance()
      
      // Load providers from database for server-side usage
      await aiService.loadProvidersFromDatabase()
      
      const activeProvider = aiService.getActiveProvider()

      if (!activeProvider) {
        return NextResponse.json({ 
          error: 'No AI provider configured. Please configure a real AI provider in Settings.' 
        }, { status: 400 })
      }
      
      // Get relevant documents for context
      let documents: any[] = await documentService.getWhere('status', '==', 'COMPLETED')
      
      // Filter by specific document IDs if provided
      if (documentIds && documentIds.length > 0) {
        documents = documents.filter(doc => documentIds.includes(doc.id))
      }
      
      // Sort by creation date and limit to 10
      documents = documents
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)

      // Prepare context from documents
      const context = documents.map(doc => ({
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
          relevantDocuments: documents.map(doc => doc.name)
        }
      }

      // Update query record with results
      await queryService.update(queryRecord!.id, {
        status: QueryStatus.COMPLETED,
        response: JSON.stringify(aiResponse),
        results: aiResponse.relevantDocuments?.length || 0
      })

      return NextResponse.json({
        id: queryRecord!.id,
        query: queryRecord!.query,
        status: QueryStatus.COMPLETED,
        response: aiResponse,
        timestamp: queryRecord!.timestamp,
        provider: activeProvider.name,
        usage: completion.usage
      })

    } catch (aiError) {
      console.error('AI processing error:', aiError)
      
      // Update query record with error
      await queryService.update(queryRecord!.id, {
        status: QueryStatus.ERROR,
        response: JSON.stringify({ error: 'AI processing failed' })
      })

      return NextResponse.json({ 
        id: queryRecord!.id,
        query: queryRecord!.query,
        status: QueryStatus.ERROR,
        error: 'Failed to process query with AI' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Query processing error:', error)
    return NextResponse.json({ error: 'Failed to process query' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const queries: any[] = (await queryService.getAll()).slice(0, limit)

    // Firebase doesn't have built-in offset, so we'll slice the results
    const paginatedQueries = queries.slice(offset, offset + limit)

    const formattedQueries = paginatedQueries.map(query => ({
      id: query.id,
      query: query.query,
      status: query.status,
      response: query.response ? JSON.parse(query.response) : null,
      results: query.results,
      timestamp: query.timestamp,
      documentIds: query.documentIds ? JSON.parse(query.documentIds) : []
    }))

    return NextResponse.json(formattedQueries)

  } catch (error) {
    console.error('Error fetching queries:', error)
    return NextResponse.json({ error: 'Failed to fetch queries' }, { status: 500 })
  }
}