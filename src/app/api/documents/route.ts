import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get user's documents from Supabase (without the problematic joins for now)
    let { data: documents, error } = await supabaseServer
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    documents = documents || []

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

    // Get counts separately for each document
    const formattedDocuments = await Promise.all(
      documents.map(async (doc) => {
        // Get analysis count for this document
        const { count: analysisCount } = await supabaseServer
          .from('analyses')
          .select('*', { count: 'exact', head: true })
          .eq('document_id', doc.id)
          .eq('user_id', user.id)

        // Get query count for this document (queries that reference this document)
        const { data: queries } = await supabaseServer
          .from('queries')
          .select('document_ids')
          .eq('user_id', user.id)

        const queryCount = queries?.filter(query => {
          try {
            const docIds = JSON.parse(query.document_ids || '[]')
            return Array.isArray(docIds) && docIds.includes(doc.id)
          } catch {
            return false
          }
        }).length || 0

        return {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          status: doc.status,
          uploadDate: doc.upload_date,
          processedAt: doc.processed_at,
          category: doc.category,
          tags: doc.tags ? (typeof doc.tags === 'string' ? JSON.parse(doc.tags) : doc.tags) : [],
          analysisCount: analysisCount || 0,
          queryCount: queryCount || 0
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