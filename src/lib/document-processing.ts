import * as mammoth from 'mammoth'

export type ProcessingStrategy = 'go' | 'node'

type FileDescriptor = {
  name: string
  size: number
  type?: string
}

type GeneratedAnalysis = {
  type: string
  title: string
  description: string
  confidence: number
  severity?: string
}

const GO_SUPPORTED_EXTENSIONS = new Set(['txt', 'json', 'csv', 'xml'])

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileCategory(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf':
    case 'doc':
    case 'docx':
      return 'Document'
    case 'txt':
      return 'Text'
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'Image'
    case 'json':
    case 'xml':
    case 'csv':
      return 'Data'
    default:
      return 'Other'
  }
}

export function getProcessingStrategy(fileName: string): ProcessingStrategy {
  const extension = fileName.split('.').pop()?.toLowerCase() || ''
  return GO_SUPPORTED_EXTENSIONS.has(extension) ? 'go' : 'node'
}

export async function extractFileContent(
  file: FileDescriptor,
  fileBuffer: ArrayBuffer
): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  try {
    switch (extension) {
      case 'txt':
        return new TextDecoder().decode(fileBuffer)

      case 'json': {
        const jsonContent = new TextDecoder().decode(fileBuffer)
        const parsed = JSON.parse(jsonContent)
        return JSON.stringify(parsed, null, 2)
      }

      case 'csv':
      case 'xml':
        return new TextDecoder().decode(fileBuffer)

      case 'pdf':
        try {
          const pdfParse = (await import('pdf-parse')).default
          const result = await pdfParse(Buffer.from(fileBuffer))
          const text = result.text?.trim()
          if (text) return text
        } catch (error) {
          console.error('PDF parsing error:', error)
        }
        return `PDF Document: ${file.name}\nSize: ${formatFileSize(file.size)}`

      case 'doc':
      case 'docx':
        try {
          const { value } = await mammoth.extractRawText({ buffer: Buffer.from(fileBuffer) })
          const text = value?.trim()
          if (text) return text
        } catch (error) {
          console.error('Word parsing error:', error)
        }
        return `Word Document: ${file.name}\nSize: ${formatFileSize(file.size)}`

      case 'jpg':
      case 'jpeg':
      case 'png':
        return `Image File: ${file.name}\nSize: ${formatFileSize(file.size)}\nImage analysis and OCR are not enabled in the serverless fallback processor.`

      default:
        try {
          const decoded = new TextDecoder().decode(fileBuffer)
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

export async function generateAnalysisFromContent(
  documentId: string,
  fileName: string,
  content: string,
  userId: string,
  db: any
) {
  const analyses: GeneratedAnalysis[] = []
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const charCount = content.length
  const lineCount = content.split('\n').length

  analyses.push({
    type: 'INSIGHT',
    title: 'Document Statistics',
    description: `Document contains ${wordCount} words, ${charCount} characters, and ${lineCount} lines.`,
    confidence: 100
  })

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

    case 'csv': {
      const lines = content.split('\n')
      const headers = lines[0]?.split(',').length || 0
      contentAnalysis = `CSV file with ${headers} columns and ${Math.max(lines.length - 1, 0)} data rows.`
      break
    }

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

    case 'pdf':
      contentAnalysis = 'PDF document processed through the Node.js fallback extractor.'
      break

    case 'doc':
    case 'docx':
      contentAnalysis = 'Word document processed through the Node.js fallback extractor.'
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

  const sensitivePatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  ]

  const sensitiveDataFound = sensitivePatterns.some((pattern) => pattern.test(content))

  analyses.push(
    sensitiveDataFound
      ? {
          type: 'COMPLIANCE',
          title: 'Sensitive Data Detected',
          description: 'Document may contain sensitive information such as email addresses, phone numbers, or other PII.',
          confidence: 85,
          severity: 'HIGH'
        }
      : {
          type: 'COMPLIANCE',
          title: 'No Sensitive Data Detected',
          description: 'Initial scan found no obvious sensitive data patterns.',
          confidence: 80,
          severity: 'LOW'
        }
  )

  await db
    .from('analyses')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .eq('ai_provider', 'system')
    .eq('ai_model', 'rule-based')

  await db.from('analyses').insert(
    analyses.map((analysis) => ({
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
    }))
  )
}

export async function processStoredDocumentWithNode(documentId: string, userId: string, db: any) {
  const { data: document, error: documentError } = await db
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single()

  if (documentError || !document) {
    throw new Error('Document not found')
  }

  if (document.status === 'COMPLETED' && document.content) {
    return {
      id: document.id,
      status: document.status,
      category: document.category,
      processedAt: document.processed_at
    }
  }

  const rawMetadata = typeof document.metadata === 'string'
    ? JSON.parse(document.metadata || '{}')
    : (document.metadata || {})

  const storageRef = rawMetadata.storageRef
  if (!storageRef) {
    throw new Error('Document storage reference is missing')
  }

  const { data: fileData, error: downloadError } = await db.storage
    .from('documents')
    .download(storageRef)

  if (downloadError || !fileData) {
    throw new Error(downloadError?.message || 'Failed to download stored document')
  }

  const fileBuffer = await fileData.arrayBuffer()
  const content = await extractFileContent(
    {
      name: document.name,
      size: Number(fileData.size || 0) || fileBuffer.byteLength,
      type: document.type
    },
    fileBuffer
  )

  const updatePayload = {
    status: 'COMPLETED',
    processed_at: new Date().toISOString(),
    content: content || `File uploaded: ${document.name} (${document.size})`,
    category: getFileCategory(document.name)
  }

  const { error: updateError } = await db
    .from('documents')
    .update(updatePayload)
    .eq('id', document.id)
    .eq('user_id', userId)

  if (updateError) {
    throw new Error(updateError.message || 'Failed to update processed document')
  }

  await generateAnalysisFromContent(document.id, document.name, content, userId, db)

  return {
    id: document.id,
    status: 'COMPLETED',
    category: updatePayload.category,
    processedAt: updatePayload.processed_at
  }
}
