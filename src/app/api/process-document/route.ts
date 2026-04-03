export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerClientForToken, supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { processStoredDocumentWithNode } from '@/lib/document-processing'

export async function POST(request: NextRequest) {
  let documentId = ''
  let userId = ''
  let db: any = null

  try {
    const body = await request.json()
    documentId = body.documentId

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    userId = user.id

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    db = createServerClientForToken(token) || supabaseServer

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const result = await processStoredDocumentWithNode(documentId, user.id, db)
    return NextResponse.json({
      id: documentId,
      status: result.status,
      category: result.category,
      processedAt: result.processedAt,
      processor: 'node',
    })
  } catch (error) {
    console.error('Document processing error:', error)

    if (db && documentId && userId) {
      await db
        .from('documents')
        .update({ status: 'ERROR' })
        .eq('id', documentId)
        .eq('user_id', userId)
    }

    return NextResponse.json(
      {
        error: 'Document processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
