export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser, ensureUserProfile } from '@/lib/auth-server'

import * as mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Ensure user profile exists
    try {
      await ensureUserProfile(user)
    } catch (profileError) {
      console.error('Error ensuring user profile:', profileError)
      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    // Sanitize email for file path (replace special characters)
    const sanitizedEmail = user.email.replace(/[^a-zA-Z0-9@.-]/g, '_')

    // Ensure storage bucket exists (idempotent)
    try {
      await supabaseServer.storage.createBucket('documents', { public: true })
    } catch (e: any) {
      // ignore if bucket already exists
    }

    // Create document record in database
    const { data: document, error: createError } = await supabaseServer
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
          userEmail: user.email
        })
      })
      .select()
      .single()

    if (createError || !document) {
      console.error('Failed to create document record:', createError)
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    // Read file contents once
    const fileBuffer = await file.arrayBuffer()
    const fileName = `users/${sanitizedEmail}/documents/${document.id}/${file.name}`
    
    try {
      let downloadURL = ''
      let storageRef = ''
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabaseServer
        .storage
        .from('documents')
        .upload(fileName, Buffer.from(fileBuffer), { 
          contentType: file.type || undefined, 
          upsert: true 
        })
      
      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        // Update document status to error
        await supabaseServer
          .from('documents')
          .update({ status: 'ERROR' })
          .eq('id', document.id)
        throw uploadError
      }
      
      const { data: publicUrl } = supabaseServer.storage
        .from('documents')
        .getPublicUrl(fileName)
      
      downloadURL = publicUrl.publicUrl
      storageRef = fileName

      // Update document status to processing
      const { error: updateError } = await supabaseServer
        .from('documents')
        .update({ 
          status: 'PROCESSING',
          metadata: JSON.stringify({
            ...JSON.parse(document.metadata || '{}'),
            storageRef: storageRef,
            downloadURL: downloadURL
          })
        })
        .eq('id', document.id)
      
      if (updateError) {
        console.error('Failed to update document status:', updateError)
        throw updateError
      }

      console.log(`Document status updated to PROCESSING: ${document.id}`)

      // Extract basic content for indexing
      const content = await extractFileContent(file, fileBuffer)
      
      // Final update with basic info
      const { error: finalUpdateError } = await supabaseServer
        .from('documents')
        .update({ 
          status: 'COMPLETED',
          processed_at: new Date().toISOString(),
          content: content || `File uploaded: ${file.name} (${formatFileSize(file.size)})`,
          category: getFileCategory(file.name)
        })
        .eq('id', document.id)
      
      if (finalUpdateError) {
        console.error('Failed to update document with final status:', finalUpdateError)
      }

      // Generate simple analyses (best effort)
      try {
        await generateAnalysisFromContent(document.id, file.name, content, user.id)
      } catch (analysisError: any) {
        console.warn('Analysis generation error (non-fatal):', analysisError)
      }

      console.log(`Document processing completed: ${file.name}`)

      return NextResponse.json({ 
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
        status: 'COMPLETED',
        uploadDate: document.upload_date,
        downloadURL: downloadURL
      })

    } catch (storageError: any) {
      console.error('Storage upload error:', storageError)
      
      // Update document status to error
      await supabaseServer
        .from('documents')
        .update({ status: 'ERROR' })
        .eq('id', document.id)

      console.error(`Failed to upload ${file.name} to storage`)

      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
    }

  } catch (error) {
    console.error('Upload error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ 
      error: 'Upload failed',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getFileCategory(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf': return 'Document'
    case 'doc':
    case 'docx': return 'Document'
    case 'txt': return 'Text'
    case 'jpg':
    case 'jpeg':
    case 'png': return 'Image'
    case 'json':
    case 'xml':
    case 'csv': return 'Data'
    default: return 'Other'
  }
}

async function extractFileContent(file: File, fileBuffer: ArrayBuffer): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  try {
    switch (extension) {
      case 'txt':
        return new TextDecoder().decode(fileBuffer)
      
      case 'json':
        const jsonContent = new TextDecoder().decode(fileBuffer)
        const parsed = JSON.parse(jsonContent)
        return JSON.stringify(parsed, null, 2)
      
      case 'csv':
        return new TextDecoder().decode(fileBuffer)
      
      case 'xml':
        return new TextDecoder().decode(fileBuffer)
      
      case 'pdf':
        try {
          const pdfParse = (await import('pdf-parse')).default
          const result = await pdfParse(Buffer.from(fileBuffer))
          const text = result.text?.trim()
          if (text) return text
        } catch (e) {
          console.error('PDF parsing error:', e)
        }
        return `PDF Document: ${file.name}\nSize: ${formatFileSize(file.size)}`
      
      case 'doc':
      case 'docx':
        try {
          const { value } = await mammoth.extractRawText({ buffer: Buffer.from(fileBuffer) })
          const text = value?.trim()
          if (text) return text
        } catch (e) {}
        return `Word Document: ${file.name}\nSize: ${formatFileSize(file.size)}`
      
      case 'jpg':
      case 'jpeg':
      case 'png':
        // For images, we'd normally use OCR or image analysis
        return `Image File: ${file.name}\nSize: ${formatFileSize(file.size)}\nImage analysis and OCR capabilities would be implemented here.`
      
      default:
        // Try to decode as text for unknown file types, but check for binary content
        try {
          const decoded = new TextDecoder().decode(fileBuffer)
          // Check if the content contains null bytes or other binary indicators
          if (decoded.includes('\u0000') || decoded.includes('\uFFFD')) {
            return `Binary File: ${file.name}\nSize: ${formatFileSize(file.size)}\nBinary content cannot be displayed as text.`
          }
          return decoded
        } catch {
          return `Binary File: ${file.name}\nSize: ${formatFileSize(file.size)}\nBinary content cannot be displayed as text.`
        }
    }
  } catch (error) {
    console.error('Content extraction error:', error)
    return `Error extracting content from ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

type GeneratedAnalysis = {
  type: string
  title: string
  description: string
  confidence: number
  severity?: string
}

async function generateAnalysisFromContent(documentId: string, fileName: string, content: string, userId: string) {
  const analyses: GeneratedAnalysis[] = []
  
  // Basic content analysis
  const wordCount = content.split(/\s+/).length
  const charCount = content.length
  const lineCount = content.split('\n').length
  
  analyses.push({
    type: 'INSIGHT',
    title: 'Document Statistics',
    description: `Document contains ${wordCount} words, ${charCount} characters, and ${lineCount} lines.`,
    confidence: 100
  })

  // Content type analysis
  const extension = fileName.split('.').pop()?.toLowerCase()
  let contentAnalysis = ''
  
  switch (extension) {
    case 'json':
      try {
        JSON.parse(content)
        contentAnalysis = 'Valid JSON structure detected with proper formatting.'
      } catch {
        contentAnalysis = 'JSON file with potential formatting issues detected.'
      }
      break
    
    case 'csv':
      const lines = content.split('\n')
      const headers = lines[0]?.split(',').length || 0
      contentAnalysis = `CSV file with ${headers} columns and ${lines.length - 1} data rows.`
      break
    
    case 'txt':
      if (content.includes('TODO') || content.includes('FIXME')) {
        analyses.push({
          type: 'OPPORTUNITY',
          title: 'Action Items Found',
          description: 'Document contains TODO or FIXME items that may require attention.',
          confidence: 90,
          severity: 'MEDIUM'
        })
      }
      contentAnalysis = 'Plain text document processed successfully.'
      break
    
    default:
      contentAnalysis = `${extension?.toUpperCase() || 'Unknown'} file type processed.`
  }

  analyses.push({
    type: 'INSIGHT',
    title: 'Content Analysis',
    description: contentAnalysis,
    confidence: 95
  })

  // Security/compliance check
  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
  ]

  let sensitiveDataFound = false
  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      sensitiveDataFound = true
      break
    }
  }

  if (sensitiveDataFound) {
    analyses.push({
      type: 'COMPLIANCE',
      title: 'Sensitive Data Detected',
      description: 'Document may contain sensitive information such as email addresses, phone numbers, or other PII.',
      confidence: 85,
      severity: 'HIGH'
    })
  } else {
    analyses.push({
      type: 'COMPLIANCE',
      title: 'No Sensitive Data Detected',
      description: 'Initial scan found no obvious sensitive data patterns.',
      confidence: 80,
      severity: 'LOW'
    })
  }

  // Save all analyses to Supabase
  if (supabaseServer) {
    for (const analysis of analyses) {
      await supabaseServer
        .from('analyses')
        .insert({
          document_id: documentId,
          user_id: userId,
          analysis_type: analysis.type,
          result: {
            title: analysis.title,
            description: analysis.description,
            confidence: analysis.confidence,
            severity: analysis.severity
          },
          ai_provider: 'system',
          ai_model: 'rule-based'
        })
    }
  }
}
