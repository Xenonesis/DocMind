export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, createServerClientForToken } from '@/lib/supabase'
import { getAuthenticatedUser, ensureUserProfile } from '@/lib/auth-server'
import { formatFileSize, getProcessingStrategy } from '@/lib/document-processing'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
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

    await ensureUserProfile(user, db)

    const sanitizedEmail = user.email.replace(/[^a-zA-Z0-9@.-]/g, '_')

    try {
      await db.storage.createBucket('documents', { public: true })
    } catch (error: any) {
      console.warn('Bucket creation warning:', error?.message || error)
    }

    const processingStrategy = getProcessingStrategy(file.name)

    const { data: document, error: createError } = await db
      .from('documents')
      .insert({
        user_id: user.id,
        name: file.name,
        type: file.type || 'unknown',
        size: formatFileSize(file.size),
        status: 'UPLOADING',
        metadata: JSON.stringify({
          originalName: file.name,
          mimeType: file.type,
          lastModified: new Date(file.lastModified).toISOString(),
          userEmail: user.email,
          processingStrategy,
        }),
      })
      .select()
      .single()

    if (createError || !document) {
      console.error('Failed to create document record:', createError)
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    const fileBuffer = await file.arrayBuffer()
    const storageRef = `users/${sanitizedEmail}/documents/${document.id}/${file.name}`

    const { error: uploadError } = await db.storage
      .from('documents')
      .upload(storageRef, Buffer.from(fileBuffer), {
        contentType: file.type || undefined,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      await db.from('documents').update({ status: 'ERROR' }).eq('id', document.id)
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
    }

    const { data: publicUrl } = db.storage.from('documents').getPublicUrl(storageRef)
    const mergedMetadata = {
      ...(typeof document.metadata === 'string'
        ? JSON.parse(document.metadata || '{}')
        : document.metadata || {}),
      storageRef,
      downloadURL: publicUrl.publicUrl,
      processingStrategy,
    }

    const { error: updateError } = await db
      .from('documents')
      .update({
        status: 'PROCESSING',
        metadata: JSON.stringify(mergedMetadata),
      })
      .eq('id', document.id)

    if (updateError) {
      console.error('Failed to update uploaded document:', updateError)
      await db.from('documents').update({ status: 'ERROR' }).eq('id', document.id)
      return NextResponse.json({ error: 'Failed to finalize upload' }, { status: 500 })
    }

    return NextResponse.json({
      id: document.id,
      name: document.name,
      type: document.type,
      size: document.size,
      status: 'PROCESSING',
      uploadDate: document.upload_date,
      downloadURL: publicUrl.publicUrl,
      storageRef,
      processingStrategy,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        error: 'Upload failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
