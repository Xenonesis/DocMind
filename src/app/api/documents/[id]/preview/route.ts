import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/db'
import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: documentId } = await params
    console.log('Preview request for document ID:', documentId)

    // Get document from database
    let document
    try {
      document = await documentService.getById(documentId)
      console.log('Document found:', document ? 'Yes' : 'No')
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database error: ' + (dbError as Error).message }, { status: 500 })
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Parse metadata to get storage information
    let metadata: any = {}
    try {
      metadata = JSON.parse(document.metadata || '{}')
    } catch (e) {
      console.warn('Failed to parse document metadata:', e)
    }

    // Determine file path based on storage location (try multiple possibilities)
    let filePath: string | null = null
    let fileBuffer: Buffer | null = null

    // Construct possible local file paths
    const expectedFilePath = path.join(process.cwd(), 'public', 'uploads', 'documents', documentId, document.name)
    const legacyPath = path.join(process.cwd(), 'public', 'uploads', document.name)
    const storageRefPath = (metadata && metadata.storageRef)
      ? path.join(process.cwd(), 'public', 'uploads', metadata.storageRef)
      : null

    const possiblePaths = [expectedFilePath, legacyPath, storageRefPath].filter(Boolean) as string[]

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p
        fileBuffer = fs.readFileSync(p)
        break
      }
    }

    if (!fileBuffer) {
      // If not found locally, attempt graceful fallbacks for previewable types
      const ext = path.extname(document.name).toLowerCase()

      // For images, we can return a URL even without local file
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        const imageUrl = (metadata && metadata.downloadURL)
          ? metadata.downloadURL
          : `/uploads/documents/${documentId}/${document.name}`
        return NextResponse.json({
          content: imageUrl,
          contentType: 'image',
          metadata: { size: document.size }
        })
      }

      // For PDFs, return a URL to let the client embed it
      if (ext === '.pdf') {
        const pdfUrl = (metadata && metadata.downloadURL)
          ? metadata.downloadURL
          : `/uploads/documents/${documentId}/${document.name}`
        return NextResponse.json({
          content: pdfUrl,
          contentType: 'pdf',
          metadata: {}
        })
      }

      // Otherwise, we cannot preview without bytes
      console.error('File not found at any expected local path:', possiblePaths)
      console.error('Document name:', document.name)
      console.error('Document metadata:', document.metadata)
      return NextResponse.json({ 
        error: 'File not found on disk',
        details: `File "${document.name}" could not be located in the expected directories`,
        searchedPaths: possiblePaths,
        documentId: documentId
      }, { status: 404 })
    }

    const fileExtension = path.extname(document.name).toLowerCase()

    let previewContent: any = {
      content: '',
      contentType: 'unsupported',
      metadata: {}
    }

    try {
      switch (fileExtension) {
        case '.txt':
          if (!fileBuffer) throw new Error('File buffer is null')
          const textContent = fileBuffer.toString('utf-8')
          previewContent = {
            content: textContent.substring(0, 10000), // Limit to first 10k characters
            contentType: 'text',
            metadata: {
              characters: textContent.length,
              wordCount: textContent.split(/\s+/).filter(word => word.length > 0).length
            }
          }
          break

        case '.pdf':
          const pdfUrl = `/uploads/documents/${documentId}/${document.name}`
          let pages = 0
          try {
            if (fileBuffer) {
              const pdfParse = (await import('pdf-parse')).default
              const pdfData = await pdfParse(fileBuffer)
              pages = pdfData.numpages
            }
          } catch (e) {
            console.error("Could not get page count from PDF", e)
          }
          previewContent = {
            content: pdfUrl,
            contentType: 'pdf',
            metadata: {
              pages: pages > 0 ? pages : undefined
            }
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
                wordCount: result.value.split(/\s+/).filter(word => word.length > 0).length
              }
            }
          } catch (docError) {
            console.error('Document parsing error:', docError)
            previewContent = {
              content: 'Unable to preview this document format',
              contentType: 'unsupported'
            }
          }
          break

        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        case '.webp':
          // Return the correct URL path for the image
          const imageUrl = `/uploads/documents/${documentId}/${document.name}`
          
          previewContent = {
            content: imageUrl,
            contentType: 'image',
            metadata: {
              size: document.size
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
                characters: jsonContent.length
              }
            }
          } catch (jsonError) {
            previewContent = {
              content: fileBuffer.toString('utf-8').substring(0, 10000),
              contentType: 'text'
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
              characters: fileBuffer.toString('utf-8').length
            }
          }
          break

        default:
          // Try to read as text for unknown extensions
          if (!fileBuffer) throw new Error('File buffer is null')
          try {
            const textContent = fileBuffer.toString('utf-8')
            // Check if it's likely text (contains mostly printable characters)
            const printableRatio = (textContent.match(/[\x20-\x7E\s]/g) || []).length / textContent.length
            if (printableRatio > 0.8) {
              previewContent = {
                content: textContent.substring(0, 10000),
                contentType: 'text',
                metadata: {
                  characters: textContent.length
                }
              }
            }
          } catch (error) {
            // Keep default unsupported
          }
          break
      }
    } catch (processingError) {
      console.error('Error processing file for preview:', processingError)
      previewContent = {
        content: 'Error processing file for preview',
        contentType: 'unsupported'
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
        documentId: params.id
      },
      { status: 500 }
    )
  }
}
