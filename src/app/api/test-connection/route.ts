import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { provider } = body

    if (!provider || !provider.type || !provider.apiKey) {
      return NextResponse.json({ 
        error: 'Provider configuration is incomplete',
        details: 'Provider type and API key are required'
      }, { status: 400 })
    }

    // Create AI service instance
    const aiService = AIService.getInstance()

    try {
      // Test the connection with a simple prompt
      const testResult = await aiService.generateCompletion({
        provider: {
          ...provider,
          isActive: true,
          isConfigured: true
        },
        prompt: 'Hello! Please respond with just "Connection successful" to confirm the API is working.',
        systemPrompt: 'You are a helpful assistant. Respond concisely.',
        maxTokens: 50,
        temperature: 0.1
      })

      // Check if we got a valid response
      if (testResult && testResult.content) {
        return NextResponse.json({
          success: true,
          message: 'Connection test successful',
          response: testResult.content.trim(),
          usage: testResult.usage,
          model: testResult.model,
          provider: testResult.provider
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'No response received from AI provider',
          details: 'The API call completed but returned no content'
        }, { status: 500 })
      }

    } catch (aiError: any) {
      console.error('AI Service error during connection test:', aiError)
      
      // Parse common error types
      let errorMessage = 'Connection test failed'
      let errorDetails = aiError.message || 'Unknown error'
      
      if (aiError.message?.includes('API key')) {
        errorMessage = 'Invalid API key'
        errorDetails = 'The provided API key is invalid or has insufficient permissions'
      } else if (aiError.message?.includes('quota') || aiError.message?.includes('limit')) {
        errorMessage = 'API quota exceeded'
        errorDetails = 'You have exceeded your API usage limits'
      } else if (aiError.message?.includes('network') || aiError.message?.includes('fetch')) {
        errorMessage = 'Network connection failed'
        errorDetails = 'Unable to reach the AI provider. Check your internet connection.'
      } else if (aiError.message?.includes('model')) {
        errorMessage = 'Model not available'
        errorDetails = 'The specified model is not available or not supported'
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: errorDetails,
        originalError: aiError.message
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error in connection test:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}