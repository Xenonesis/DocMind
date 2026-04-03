import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, createServerClientForToken } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'
import path from 'path'
import mammoth from 'mammoth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let documentId = ''
  try {
    const awaitedParams = await params
    documentId = awaitedParams.id

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
    const ext = path.extname(document.name).toLowerCase()

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      const { data } = await db.storage.from('documents').createSignedUrl(storageRef, 3600)
      if (!data)
        return NextResponse.json({ error: 'Could not generate signed URL' }, { status: 500 })
      return NextResponse.json({
        content: data.signedUrl,
        contentType: 'image',
        metadata: { size: document.size },
      })
    }

    if (ext === '.pdf') {
      const { data } = await db.storage.from('documents').createSignedUrl(storageRef, 3600)
      if (!data)
        return NextResponse.json({ error: 'Could not generate signed URL' }, { status: 500 })
      return NextResponse.json({
        content: data.signedUrl,
        contentType: 'pdf',
        metadata: {},
      })
    }

    const { data: fileBlob, error: downloadError } = await db.storage
      .from('documents')
      .download(storageRef)

    if (downloadError || !fileBlob) {
      console.error('File not found in Supabase storage:', downloadError)
      return NextResponse.json(
        {
          error: 'File not found in storage',
          details: 'The document file could not be located in your private bucket',
          documentId: documentId,
        },
        { status: 404 }
      )
    }

    const fileBuffer = Buffer.from(await fileBlob.arrayBuffer())

    const fileExtension = path.extname(document.name).toLowerCase()

    let previewContent: any = {
      content: '',
      contentType: 'unsupported',
      metadata: {},
    }

    try {
      switch (fileExtension) {
        case '.txt':
          if (!fileBuffer) throw new Error('File buffer is null')
          const textContent = fileBuffer.toString('utf-8')
          previewContent = {
            content: textContent.substring(0, 10000),
            contentType: 'text',
            metadata: {
              characters: textContent.length,
              wordCount: textContent.split(/\s+/).filter((word) => word.length > 0).length,
            },
          }
          break

        case '.doc':
        case '.docx':
          if (!fileBuffer) throw new Error('File buffer is null')
          try {
            const result = await mammoth.extractRawText({ buffer: fileBuffer })
            previewContent = {
              content: result.value.substring(0, 10000),
              contentType: 'text',
              metadata: {
                characters: result.value.length,
                wordCount: result.value.split(/\s+/).filter((word) => word.length > 0).length,
              },
            }
          } catch (docError) {
            console.error('Document parsing error:', docError)
            previewContent = {
              content: 'Unable to preview this document format',
              contentType: 'unsupported',
            }
          }
          break

        case '.json':
          if (!fileBuffer) throw new Error('File buffer is null')
          try {
            const jsonContent = fileBuffer.toString('utf-8')
            const parsed = JSON.parse(jsonContent)
            previewContent = {
              content: JSON.stringify(parsed, null, 2).substring(0, 10000),
              contentType: 'text',
              metadata: {
                characters: jsonContent.length,
              },
            }
          } catch (jsonError) {
            previewContent = {
              content: fileBuffer.toString('utf-8').substring(0, 10000),
              contentType: 'text',
            }
          }
          break

        case '.xml':
        case '.csv':
          if (!fileBuffer) throw new Error('File buffer is null')
          previewContent = {
            content: fileBuffer.toString('utf-8').substring(0, 10000),
            contentType: 'text',
            metadata: {
              characters: fileBuffer.toString('utf-8').length,
            },
          }
          break

        default:
          if (!fileBuffer) throw new Error('File buffer is null')
          try {
            const textContent = fileBuffer.toString('utf-8')
            const printableRatio =
              (textContent.match(/[\x20-\x7E\s]/g) || []).length / textContent.length
            if (printableRatio > 0.8) {
              previewContent = {
                content: textContent.substring(0, 10000),
                contentType: 'text',
                metadata: {
                  characters: textContent.length,
                },
              }
            }
          } catch (error) {}
          break
      }
    } catch (processingError) {
      console.error('Error processing file for preview:', processingError)
      previewContent = {
        content: 'Error processing file for preview',
        contentType: 'unsupported',
      }
    }

    return NextResponse.json(previewContent)
  } catch (error) {
    console.error('Error generating document preview:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error',
        documentId,
      },
      { status: 500 }
    )
  }
}
