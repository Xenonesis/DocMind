import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: documentId } = await params

    // Get document from database
    const document = await documentService.getById(documentId)

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Return the document data
    return NextResponse.json(document)

  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: documentId } = await params

    // Delete document from database
    await documentService.delete(documentId)

    return NextResponse.json({ success: true, message: 'Document deleted successfully' })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: documentId } = await params
    const updates = await request.json()
    
    // Update document in database
    await documentService.update(documentId, updates)

    // Get the updated document
    const updatedDocument = await documentService.getById(documentId)

    if (!updatedDocument) {
      return NextResponse.json({ error: 'Document not found after update' }, { status: 404 })
    }

    return NextResponse.json(updatedDocument)

  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}