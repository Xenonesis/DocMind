import { NextRequest, NextResponse } from 'next/server'
import { buildUniqueSlug, getOwnerContext, validateOwnerDocumentIds } from '@/lib/chatbot-owner'

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

    const { data: bot, error } = await ctx.db
      .from('chatbots')
      .select('*')
      .eq('id', id)
      .eq('user_id', ctx.user.id)
      .maybeSingle()

    if (error || !bot) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    const { data: links } = await ctx.db
      .from('chatbot_documents')
      .select('document_id, documents!inner(id, name, type, status)')
      .eq('chatbot_id', bot.id)

    return NextResponse.json({
      ...bot,
      documents: (links || []).map((item: any) => item.documents),
      documentIds: (links || []).map((item: any) => item.document_id),
      hostedUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/bot/${bot.slug}`,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch chatbot' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const ctx = await getOwnerContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const { data: existing, error: existingError } = await ctx.db
      .from('chatbots')
      .select('*')
      .eq('id', id)
      .eq('user_id', ctx.user.id)
      .maybeSingle()

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 })
    }

    const name = body.name ? String(body.name).trim() : existing.name
    const slug = body.name && body.name.trim() !== existing.name
      ? await buildUniqueSlug(ctx.db, ctx.user.id, name)
      : existing.slug

    const updates = {
      name,
      slug,
      description: body.description !== undefined ? (body.description?.trim() || null) : existing.description,
      system_prompt: body.systemPrompt !== undefined ? (body.systemPrompt?.trim() || null) : existing.system_prompt,
      refusal_message: body.refusalMessage !== undefined ? body.refusalMessage : existing.refusal_message,
      fallback_message: body.fallbackMessage !== undefined ? body.fallbackMessage : existing.fallback_message,
      allowed_origins: Array.isArray(body.allowedOrigins) ? body.allowedOrigins : existing.allowed_origins,
      is_active: body.isActive !== undefined ? !!body.isActive : existing.is_active,
      model_override: body.modelOverride !== undefined ? (body.modelOverride?.trim() || null) : existing.model_override,
      temperature: typeof body.temperature === 'number' ? body.temperature : existing.temperature,
      max_tokens: typeof body.maxTokens === 'number' ? body.maxTokens : existing.max_tokens,
      requests_per_minute_bot: typeof body.requestsPerMinuteBot === 'number' ? body.requestsPerMinuteBot : existing.requests_per_minute_bot,
      requests_per_minute_ip: typeof body.requestsPerMinuteIp === 'number' ? body.requestsPerMinuteIp : existing.requests_per_minute_ip,
      requests_per_day_bot: typeof body.requestsPerDayBot === 'number' ? body.requestsPerDayBot : existing.requests_per_day_bot,
      updated_at: new Date().toISOString(),
    }

    const { data: bot, error: updateError } = await ctx.db
      .from('chatbots')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError || !bot) {
      return NextResponse.json({ error: 'Failed to update chatbot' }, { status: 500 })
    }

    if (Array.isArray(body.documentIds)) {
      const validDocumentIds = await validateOwnerDocumentIds(ctx.db, ctx.user.id, body.documentIds)
      if (validDocumentIds.length === 0) {
        return NextResponse.json({ error: 'Select at least one document' }, { status: 400 })
      }

      await ctx.db.from('chatbot_documents').delete().eq('chatbot_id', id)
      const linkRows = validDocumentIds.map((documentId: string) => ({
        chatbot_id: id,
        user_id: ctx.user.id,
        document_id: documentId,
      }))
      const { error: linkError } = await ctx.db.from('chatbot_documents').insert(linkRows)
      if (linkError) {
        return NextResponse.json({ error: 'Failed to update linked documents' }, { status: 500 })
      }
    }

    return NextResponse.json({
      ...bot,
      hostedUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/bot/${bot.slug}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update chatbot' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const ctx = await getOwnerContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await ctx.db
      .from('chatbots')
      .delete()
      .eq('id', id)
      .eq('user_id', ctx.user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete chatbot' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete chatbot' }, { status: 500 })
  }
}
