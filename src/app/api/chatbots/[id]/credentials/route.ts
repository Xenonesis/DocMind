import { NextRequest, NextResponse } from 'next/server'
import { generateApiKey } from '@/lib/chatbot-security'
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

    const { data: keys, error } = await ctx.db
      .from('chatbot_api_keys')
      .select('id, key_name, key_prefix, is_active, expires_at, created_at, last_used_at')
      .eq('chatbot_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    return NextResponse.json(keys || [])
  } catch {
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
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

    if (body.rotate === true) {
      await ctx.db
        .from('chatbot_api_keys')
        .update({ is_active: false })
        .eq('chatbot_id', id)
        .eq('is_active', true)
    }

    const generated = generateApiKey()
    const expiresAt =
      typeof body.expiresInDays === 'number'
        ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null

    const { data: inserted, error } = await ctx.db
      .from('chatbot_api_keys')
      .insert({
        chatbot_id: id,
        user_id: ctx.user.id,
        key_name: body.name?.trim() || 'default',
        key_prefix: generated.shortPrefix,
        key_hash: generated.hash,
        expires_at: expiresAt,
        is_active: true,
      })
      .select('id, key_name, key_prefix, expires_at, created_at')
      .single()

    if (error || !inserted) {
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    return NextResponse.json({
      ...inserted,
      apiKey: generated.plain,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
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
    const keyId = searchParams.get('keyId')

    if (!keyId) {
      return NextResponse.json({ error: 'keyId is required' }, { status: 400 })
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
      .from('chatbot_api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('chatbot_id', id)

    if (error) {
      return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
  }
}
