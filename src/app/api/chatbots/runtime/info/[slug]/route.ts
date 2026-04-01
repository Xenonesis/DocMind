import { NextRequest, NextResponse } from 'next/server'
import { createServerClientForToken, supabaseServer } from '@/lib/supabase'
import { verifyEmbedToken } from '@/lib/chatbot-security'

interface Params {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : undefined

    const db = createServerClientForToken(bearerToken) || supabaseServer

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { slug } = await params
    const token = request.headers.get('x-embed-token')

    if (!token) {
      return NextResponse.json({ error: 'Embed token header is required' }, { status: 401 })
    }

    const verified = await verifyEmbedToken(db, token)
    if (!verified?.chatbots || verified.chatbots.slug !== slug) {
      return NextResponse.json({ error: 'Invalid embed token' }, { status: 401 })
    }

    return NextResponse.json({
      id: verified.chatbots.id,
      name: verified.chatbots.name,
      slug: verified.chatbots.slug,
      description: null,
      isActive: verified.chatbots.is_active,
      autoRegenerateOnDislike: verified.chatbots.auto_regenerate_on_dislike !== false,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch chatbot info' }, { status: 500 })
  }
}
