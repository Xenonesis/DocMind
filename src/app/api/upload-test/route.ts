import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== MINIMAL UPLOAD TEST ===')
  
  try {
    console.log('1. Parsing form data...')
    const formData = await request.formData()
    
    console.log('2. Getting file...')
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('ERROR: No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    console.log('3. File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    })
    
    console.log('4. Success!')
    return NextResponse.json({ 
      success: true,
      message: 'Minimal upload test passed',
      file: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    })
    
  } catch (error) {
    console.error('=== MINIMAL UPLOAD ERROR ===')
    console.error('Error:', error)
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ 
      error: 'Minimal upload test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}