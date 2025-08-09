import { NextRequest, NextResponse } from 'next/server'
import { documentService, analysisService, queryService } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Get all documents first - handle permission errors gracefully
    let documents: any[] = []
    try {
      documents = await documentService.getAll()
    } catch (dbError: any) {
      console.error('Database error fetching documents:', dbError)
      // Return empty array if permission denied or other database errors
      if (dbError.code === 'permission-denied' || dbError.code === '22007' || dbError.code === '22P05') {
        console.warn('Database access issue, returning empty documents array:', dbError.message)
        return NextResponse.json([]);
      }
      throw dbError;
    }

    // Apply filters
    if (status && status !== 'all') {
      documents = documents.filter(doc => doc.status === status)
    }
    
    if (type && type !== 'all') {
      documents = documents.filter(doc => doc.type.toLowerCase().includes(type.toLowerCase()))
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      documents = documents.filter(doc => 
        doc.name.toLowerCase().includes(searchLower) ||
        (doc.category && doc.category.toLowerCase().includes(searchLower))
      )
    }

    // Get related analyses and queries for each document
    const formattedDocuments = await Promise.all(
      documents.map(async (doc) => {
        let analyses: any[] = []
        let queries: any[] = []
        
        try {
          analyses = await analysisService.getWhere('documentId', '==', doc.id)
        } catch (e) {
          console.warn('Failed to fetch analyses for document', doc.id, e)
        }
        
        try {
          queries = await queryService.getWhere('documentIds', 'array-contains', doc.id)
        } catch (e) {
          console.warn('Failed to fetch queries for document', doc.id, e)
          // Fallback: get all queries and filter manually
          try {
            const allQueries: any[] = await queryService.getAll()
            queries = allQueries.filter(q => {
              try {
                const docIds = typeof q.documentIds === 'string' ? JSON.parse(q.documentIds) : q.documentIds
                return Array.isArray(docIds) && docIds.includes(doc.id)
              } catch {
                return false
              }
            })
          } catch (e2) {
            console.warn('Failed to fetch queries with fallback', e2)
          }
        }

        // Sort and limit analyses and queries
        const sortedAnalyses = analyses
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 3)
        
        const sortedQueries = queries
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 3)

        return {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          status: doc.status,
          uploadDate: doc.uploadDate,
          processedAt: doc.processedAt,
          category: doc.category,
          tags: Array.isArray((doc as any).tags)
            ? (doc as any).tags
            : (typeof (doc as any).tags === 'string'
              ? JSON.parse((doc as any).tags as unknown as string)
              : []),
          analysisCount: analyses.length,
          queryCount: queries.length,
          latestAnalyses: sortedAnalyses,
          latestQueries: sortedQueries
        }
      })
    )

    return NextResponse.json(formattedDocuments)

  } catch (error) {
    console.error('Error fetching documents:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint
    })
    return NextResponse.json({ 
      error: 'Failed to fetch documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}