import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, createServerClientForToken } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'
import path from 'path'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: documentId } = await params

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const db = createServerClientForToken(token) || supabaseServer

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data: document, error: docError } = await db
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
    }

    let metadata: any = {}
    try {
      metadata = JSON.parse(document.metadata || '{}')
    } catch (e) {
      console.warn('Failed to parse document metadata:', e)
    }

    const storageRef =
      metadata.storageRef ||
      `users/${user.email.replace(/[^a-zA-Z0-9@.-]/g, '_')}/documents/${documentId}/${document.name}`

    const { data: fileBlob, error: downloadError } = await db.storage
      .from('documents')
      .download(storageRef)

    if (downloadError || !fileBlob) {
      console.error('File not found in Supabase storage:', downloadError)
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

    const fileBuffer = Buffer.from(await fileBlob.arrayBuffer())

    const fileExtension = path.extname(document.name).toLowerCase()
    let contentType = 'application/octet-stream'

    switch (fileExtension) {
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.doc':
        contentType = 'application/msword'
        break
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
      case '.txt':
        contentType = 'text/plain'
        break
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg'
        break
      case '.png':
        contentType = 'image/png'
        break
      case '.gif':
        contentType = 'image/gif'
        break
      case '.json':
        contentType = 'application/json'
        break
      case '.xml':
        contentType = 'application/xml'
        break
      case '.csv':
        contentType = 'text/csv'
        break
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${document.name}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
  }
}
