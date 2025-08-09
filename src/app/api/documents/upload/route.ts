export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { documentService, analysisService, DocumentStatus, AnalysisType, Severity } from '@/lib/db'
import { isSupabaseConfigured, supabaseServer } from '@/lib/supabase'
import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { emitDocumentUpdate, emitProgressUpdate, emitSystemNotification } from '@/lib/socket'
import * as mammoth from 'mammoth'

// Get socket.io server instance from global
const getSocketIO = () => {
  return (global as any).io || null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const doLocalSaveAndRespond = async () => {
      const fileBuffer = await file.arrayBuffer()
      const fallbackId = `local-${Date.now()}`
      const fileName = `documents/${fallbackId}/${file.name}`
      const targetPath = join(process.cwd(), 'public', 'uploads', fileName)
      mkdirSync(dirname(targetPath), { recursive: true })
      writeFileSync(targetPath, Buffer.from(fileBuffer))

      const io = getSocketIO()
      if (io) {
        emitDocumentUpdate(io, {
          documentId: fallbackId,
          status: 'completed',
          message: `Saved locally: ${file.name}`,
          timestamp: new Date().toISOString()
        })
      }

      return NextResponse.json({
        id: fallbackId,
        name: file.name,
        type: file.type || 'unknown',
        size: formatFileSize(file.size),
        status: DocumentStatus.COMPLETED,
        uploadDate: new Date(),
        downloadURL: `/uploads/${fileName}`
      })
    }

    // If Supabase isn't configured, do a local-only upload and return
    if (!isSupabaseConfigured) {
      return doLocalSaveAndRespond()
    }

    // Ensure storage bucket exists (idempotent)
    try {
      if (supabaseServer) {
        await supabaseServer.storage.createBucket('documents', { public: true })
      }
    } catch (e: any) {
      // ignore if bucket already exists
    }

    // Create document record in database - handle permission errors
    let documentId;
    try {
      documentId = await documentService.create({
        name: file.name,
        type: file.type || 'unknown',
        size: formatFileSize(file.size),
        status: DocumentStatus.UPLOADING,
        uploadDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: JSON.stringify({
          originalName: file.name,
          mimeType: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        })
      })
    } catch (dbError: any) {
      console.warn('DB unavailable, saving upload locally. Reason:', dbError?.message || dbError)
      return doLocalSaveAndRespond()
    }
    
    let document;
    try {
      document = await documentService.getById(documentId)
      if (!document) {
        return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
      }
    } catch (dbError: any) {
      throw dbError;
    }

    // Emit socket update if socket.io is available
    const io = getSocketIO()
    if (io) {
      emitDocumentUpdate(io, {
        documentId: document.id,
        status: 'uploading',
        message: `Starting upload of ${file.name}`,
        timestamp: new Date().toISOString()
      })
    }

    // Read file contents once
    const fileBuffer = await file.arrayBuffer()
    const fileName = `documents/${documentId}/${file.name}`
    
    try {
      let downloadURL = ''
      let storageRef = ''
      try {
        if (!supabaseServer) throw new Error('Supabase not available on server')
        console.log(`Attempting to upload to Supabase storage: ${fileName}`)
        const { data, error } = await supabaseServer
          .storage
          .from('documents')
          .upload(fileName, Buffer.from(fileBuffer), { contentType: file.type || undefined, upsert: true })
        if (error) {
            console.error('Supabase upload error:', error)
            throw error // Force fallback to local storage
        }
        const { data: publicUrl } = supabaseServer.storage.from('documents').getPublicUrl(fileName)
        downloadURL = publicUrl.publicUrl
        storageRef = fileName
        console.log(`Successfully uploaded to Supabase. URL: ${downloadURL}`)
      } catch (clientStorageErr: any) {
        console.warn('Supabase upload failed. Falling back to local filesystem storage.')
        // Final fallback to local filesystem under public/uploads
        const targetPath = join(process.cwd(), 'public', 'uploads', fileName)
        try {
            mkdirSync(dirname(targetPath), { recursive: true })
            writeFileSync(targetPath, Buffer.from(fileBuffer))
            downloadURL = `/uploads/${fileName}`
            storageRef = fileName
            console.log(`Successfully wrote file to local filesystem: ${targetPath}`)
        } catch (localWriteError) {
            console.error(`CRITICAL: Failed to write file to local filesystem at ${targetPath}`, localWriteError)
            // If local write also fails, we must mark the document as an error
            await documentService.update(document.id, { status: DocumentStatus.ERROR })
            throw new Error('Failed to save file to both cloud and local storage.')
        }
      }

      // Update document status to processing
      try {
        console.log(`Updating document record ${document.id} with storageRef: ${storageRef}`)
        await documentService.update(document.id, { 
          status: DocumentStatus.PROCESSING,
          metadata: JSON.stringify({
            ...JSON.parse(document.metadata || '{}'),
            storageRef: storageRef, // Use the determined storageRef
            downloadURL: downloadURL
          })
        })
      } catch (updateError: any) {
        throw updateError;
      }

      // Emit socket update
      if (io) {
        emitDocumentUpdate(io, {
          documentId: document.id,
          status: 'processing',
          message: `Processing ${file.name}`,
          timestamp: new Date().toISOString()
        })
      }

      // Extract basic content for indexing
      const content = await extractFileContent(file, fileBuffer)
      
      // Final update with basic info
      try {
        await documentService.update(document.id, { 
          status: DocumentStatus.COMPLETED,
          processedAt: new Date(),
          content: content || `File uploaded: ${file.name} (${formatFileSize(file.size)})`,
          category: getFileCategory(file.name)
        })
      } catch (updateError: any) {
        if (updateError.code === 'permission-denied') {
          console.warn('Could not update document status due to permissions');
        } else {
          throw updateError;
        }
      }

      // Generate simple analyses (best effort)
      try {
        await generateAnalysisFromContent(document.id, file.name, content)
      } catch (analysisError: any) {
        if (analysisError?.code === 'permission-denied') {
          console.warn('Analysis creation skipped due to Firestore permissions')
        } else {
          console.warn('Analysis generation error (non-fatal):', analysisError)
        }
      }

      // Emit completion update
      if (io) {
        emitDocumentUpdate(io, {
          documentId: document.id,
          status: 'completed',
          message: `Successfully processed ${file.name}`,
          timestamp: new Date().toISOString()
        })

        emitSystemNotification(io, {
          type: 'success',
          title: 'Document Processing Complete',
          message: `${file.name} has been successfully processed and analyzed.`
        })
      }

      return NextResponse.json({ 
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
        status: DocumentStatus.COMPLETED,
        uploadDate: document.uploadDate,
        downloadURL: downloadURL
      })

    } catch (storageError: any) {
      console.error('Storage upload error:', storageError)
      
      // Update document status to error
      await documentService.update(document.id, { 
        status: DocumentStatus.ERROR 
      })

      const io = getSocketIO()
      if (io) {
        emitSystemNotification(io, {
          type: 'error',
          title: 'Upload Failed',
          message: `Failed to upload ${file.name} to storage.`
        })
      }

      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
    }

  } catch (error) {
    console.error('Upload error:', error)
    
    // Emit error notification if socket.io is available
    const io = getSocketIO()
    if (io) {
      emitSystemNotification(io, {
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload document. Please try again.'
      })
    }
    
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
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
          const pdfParseModule: any = await import('pdf-parse/lib/pdf-parse.js')
          const pdfParse = pdfParseModule.default || pdfParseModule
          const result = await pdfParse(Buffer.from(fileBuffer))
          const text = result.text?.trim()
          if (text) return text
        } catch (e) {}
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
  type: AnalysisType
  title: string
  description: string
  confidence: number
  severity?: Severity
}

async function generateAnalysisFromContent(documentId: string, fileName: string, content: string) {
  const analyses: GeneratedAnalysis[] = []
  
  // Basic content analysis
  const wordCount = content.split(/\s+/).length
  const charCount = content.length
  const lineCount = content.split('\n').length
  
  analyses.push({
    type: AnalysisType.INSIGHT,
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
          type: AnalysisType.OPPORTUNITY,
          title: 'Action Items Found',
          description: 'Document contains TODO or FIXME items that may require attention.',
          confidence: 90,
          severity: Severity.MEDIUM
        })
      }
      contentAnalysis = 'Plain text document processed successfully.'
      break
    
    default:
      contentAnalysis = `${extension?.toUpperCase() || 'Unknown'} file type processed.`
  }

  analyses.push({
    type: AnalysisType.INSIGHT,
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
      type: AnalysisType.COMPLIANCE,
      title: 'Sensitive Data Detected',
      description: 'Document may contain sensitive information such as email addresses, phone numbers, or other PII.',
      confidence: 85,
      severity: Severity.HIGH
    })
  } else {
    analyses.push({
      type: AnalysisType.COMPLIANCE,
      title: 'No Sensitive Data Detected',
      description: 'Initial scan found no obvious sensitive data patterns.',
      confidence: 80,
      severity: Severity.LOW
    })
  }

  // Save all analyses
  for (const analysis of analyses) {
    await analysisService.create({
      type: analysis.type,
      title: analysis.title,
      description: analysis.description,
      confidence: analysis.confidence,
      severity: analysis.severity,
      documentId: documentId,
      documents: JSON.stringify([fileName]),
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}
