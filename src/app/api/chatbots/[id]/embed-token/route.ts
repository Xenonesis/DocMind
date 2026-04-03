import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedToken } from '@/lib/chatbot-security'
import { getOwnerContext } from '@/lib/chatbot-owner'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const ctx = await getOwnerContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    const { data: chatbot } = await ctx.db
      .from('chatbots')
      .select('id')
      .eq('id', id)
      .eq('user_id', ctx.user.id)
      .maybeSingle()

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    const { data: tokens, error } = await ctx.db
      .from('chatbot_embed_tokens')
      .select('id, token_name, token_prefix, is_active, expires_at, created_at, last_used_at')
      .eq('chatbot_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch embed tokens' }, { status: 500 })
    }

    return NextResponse.json(tokens || [])
  } catch {
    return NextResponse.json({ error: 'Failed to fetch embed tokens' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const ctx = await getOwnerContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = await params

    const { data: chatbot } = await ctx.db
      .from('chatbots')
      .select('id')
      .eq('id', id)
      .eq('user_id', ctx.user.id)
      .maybeSingle()

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    const generated = generateEmbedToken()
    const expiresAt =
      typeof body.expiresInDays === 'number'
        ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null

    const allowedOrigins = Array.isArray(body.allowedOrigins) ? body.allowedOrigins : []

    const { data: inserted, error } = await ctx.db
      .from('chatbot_embed_tokens')
      .insert({
        chatbot_id: id,
        user_id: ctx.user.id,
        token_name: body.name?.trim() || 'default',
        token_prefix: generated.shortPrefix,
        token_hash: generated.hash,
        expires_at: expiresAt,
        allowed_origins: allowedOrigins,
        is_active: true,
      })
      .select('id, token_name, token_prefix, expires_at, allowed_origins, created_at')
      .single()

    if (error || !inserted) {
      return NextResponse.json({ error: 'Failed to create embed token' }, { status: 500 })
    }

    return NextResponse.json({
      ...inserted,
      token: generated.plain,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create embed token' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const ctx = await getOwnerContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get('tokenId')

    if (!tokenId) {
      return NextResponse.json({ error: 'tokenId is required' }, { status: 400 })
    }

    const { data: chatbot } = await ctx.db
      .from('chatbots')
      .select('id')
      .eq('id', id)
      .eq('user_id', ctx.user.id)
      .maybeSingle()

    if (!chatbot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    const { error } = await ctx.db
      .from('chatbot_embed_tokens')
      .update({ is_active: false })
      .eq('id', tokenId)
      .eq('chatbot_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke embed token' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to revoke embed token' }, { status: 500 })
  }
}
