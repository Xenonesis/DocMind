import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: documentId } = await params
    console.log('Fetching document with ID:', documentId)

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
    console.log('Deleting document with ID:', documentId)

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
    
    console.log('Updating document with ID:', documentId, 'Updates:', updates)

    // Update document in database
    const updatedDocument = await documentService.update(documentId, updates)

    if (!updatedDocument) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
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