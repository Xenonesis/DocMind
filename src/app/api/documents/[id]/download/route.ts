import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id

    // Get document from database
    const document = await documentService.getById(documentId)
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

    // Try different possible file locations
    const possiblePaths = [
      // New format: documents/{documentId}/{filename}
      path.join(process.cwd(), 'public', 'uploads', 'documents', documentId, document.name),
      // Legacy format: just the filename
      path.join(process.cwd(), 'public', 'uploads', document.name),
      // Metadata storage reference
      metadata.storageRef ? path.join(process.cwd(), 'public', 'uploads', metadata.storageRef) : null
    ].filter(Boolean) as string[]

    let filePath: string | null = null
    let fileBuffer: Buffer | null = null

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath
        fileBuffer = fs.readFileSync(filePath)
        break
      }
    }

    if (!fileBuffer || !filePath) {
      console.error('File not found in any of these locations:', possiblePaths)
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }
    
    // Determine content type
    const fileExtension = path.extname(document.name).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (fileExtension) {
      case '.pdf': contentType = 'application/pdf'; break
      case '.doc': contentType = 'application/msword'; break
      case '.docx': contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break
      case '.txt': contentType = 'text/plain'; break
      case '.jpg':
      case '.jpeg': contentType = 'image/jpeg'; break
      case '.png': contentType = 'image/png'; break
      case '.gif': contentType = 'image/gif'; break
      case '.json': contentType = 'application/json'; break
      case '.xml': contentType = 'application/xml'; break
      case '.csv': contentType = 'text/csv'; break
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${document.name}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    )
  }
}