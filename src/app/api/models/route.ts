import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { AIService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { provider } = await request.json()

    if (!provider || !provider.type) {
      return NextResponse.json({ error: 'Provider configuration is required' }, { status: 400 })
    }

    const aiService = AIService.getInstance()
    const models = await aiService.fetchModels(provider)

    return NextResponse.json({ models })
  } catch (error: any) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models', details: error.message },
      { status: 500 }
    )
  }
}
