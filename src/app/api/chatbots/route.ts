import { NextRequest, NextResponse } from 'next/server'
import { buildUniqueSlug, getOwnerContext, validateOwnerDocumentIds } from '@/lib/chatbot-owner'

function isMissingTableError(error: any): boolean {
  const code = error?.code || error?.details?.code
  const message = (error?.message || '').toLowerCase()
  return code === '42P01' || message.includes('does not exist')
}

function isMissingColumnError(error: any): boolean {
  const code = error?.code || error?.details?.code
  const message = (error?.message || '').toLowerCase()
  return code === '42703' || (message.includes('column') && message.includes('does not exist'))
}

function migrationHint() {
  return 'Chatbot schema is missing. Run migration: supabase/migrations/20260322091500_chatbot_platform.sql'
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getOwnerContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: bots, error } = await ctx.db
      .from('chatbots')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      const status = isMissingTableError(error) ? 503 : 500
      return NextResponse.json(
        {
          error: 'Failed to fetch chatbots',
          details: error.message,
          hint: isMissingTableError(error) ? migrationHint() : undefined,
        },
        { status }
      )
    }

    const chatbotIds = (bots || []).map((bot: { id: string }) => bot.id)
    let linkCountMap: Record<string, number> = {}

    if (chatbotIds.length > 0) {
      const { data: links } = await ctx.db
        .from('chatbot_documents')
        .select('chatbot_id')
        .in('chatbot_id', chatbotIds)

      linkCountMap = (links || []).reduce(
        (acc: Record<string, number>, row: { chatbot_id: string }) => {
          acc[row.chatbot_id] = (acc[row.chatbot_id] || 0) + 1
          return acc
        },
        {}
      )
    }

    return NextResponse.json(
      (bots || []).map((bot: any) => ({
        ...bot,
        linkedDocumentCount: linkCountMap[bot.id] || 0,
        hostedUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/bot/${bot.slug}`,
      }))
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch chatbots',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let step = 'init'
  try {
    step = 'owner-context'
    const ctx = await getOwnerContext(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    step = 'parse-body'
    const body = await request.json()
    const name = (body.name || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    step = 'validate-documents'
    const documentIds = Array.isArray(body.documentIds) ? body.documentIds : []
    const validDocumentIds = await validateOwnerDocumentIds(ctx.db, ctx.user.id, documentIds)

    if (validDocumentIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one document' }, { status: 400 })
    }

    step = 'build-slug'
    const slug = await buildUniqueSlug(ctx.db, ctx.user.id, name)

    const chatbotInsert = {
      user_id: ctx.user.id,
      name,
      slug,
      description: body.description?.trim() || null,
      system_prompt: body.systemPrompt?.trim() || null,
      refusal_message: body.refusalMessage?.trim() || undefined,
      fallback_message: body.fallbackMessage?.trim() || undefined,
      allowed_origins: Array.isArray(body.allowedOrigins) ? body.allowedOrigins : [],
      is_active: body.isActive !== false,
      model_override: body.modelOverride?.trim() || null,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.2,
      max_tokens: typeof body.maxTokens === 'number' ? body.maxTokens : 1024,
      requests_per_minute_bot:
        typeof body.requestsPerMinuteBot === 'number' ? body.requestsPerMinuteBot : 60,
      requests_per_minute_ip:
        typeof body.requestsPerMinuteIp === 'number' ? body.requestsPerMinuteIp : 20,
      requests_per_day_bot:
        typeof body.requestsPerDayBot === 'number' ? body.requestsPerDayBot : 2000,
      response_style: ['concise', 'balanced', 'detailed'].includes(body.responseStyle)
        ? body.responseStyle
        : 'balanced',
      include_references: body.includeReferences !== false,
      include_highlights: body.includeHighlights !== false,
      use_chat_memory: body.useChatMemory !== false,
      auto_regenerate_on_dislike: body.autoRegenerateOnDislike !== false,
    }

    const legacyChatbotInsert = {
      user_id: ctx.user.id,
      name,
      slug,
      description: body.description?.trim() || null,
      system_prompt: body.systemPrompt?.trim() || null,
      refusal_message: body.refusalMessage?.trim() || undefined,
      fallback_message: body.fallbackMessage?.trim() || undefined,
      allowed_origins: Array.isArray(body.allowedOrigins) ? body.allowedOrigins : [],
      is_active: body.isActive !== false,
      model_override: body.modelOverride?.trim() || null,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.2,
      max_tokens: typeof body.maxTokens === 'number' ? body.maxTokens : 1024,
      requests_per_minute_bot:
        typeof body.requestsPerMinuteBot === 'number' ? body.requestsPerMinuteBot : 60,
      requests_per_minute_ip:
        typeof body.requestsPerMinuteIp === 'number' ? body.requestsPerMinuteIp : 20,
      requests_per_day_bot:
        typeof body.requestsPerDayBot === 'number' ? body.requestsPerDayBot : 2000,
    }

    step = 'insert-chatbot'
    let { data: bot, error: insertError } = await ctx.db
      .from('chatbots')
      .insert(chatbotInsert)
      .select('*')
      .single()

    if (insertError && isMissingColumnError(insertError)) {
      const fallbackInsert = await ctx.db
        .from('chatbots')
        .insert(legacyChatbotInsert)
        .select('*')
        .single()
      bot = fallbackInsert.data
      insertError = fallbackInsert.error
    }

    if (insertError || !bot) {
      const status = isMissingTableError(insertError) ? 503 : 500
      return NextResponse.json(
        {
          error: 'Failed to create chatbot',
          details: insertError?.message || 'Insert failed',
          hint: isMissingTableError(insertError) ? migrationHint() : undefined,
        },
        { status }
      )
    }

    step = 'attach-documents'
    const linkRows = validDocumentIds.map((documentId) => ({
      chatbot_id: bot.id,
      user_id: ctx.user.id,
      document_id: documentId,
    }))

    const { error: linkError } = await ctx.db.from('chatbot_documents').insert(linkRows)
    if (linkError) {
      await ctx.db.from('chatbots').delete().eq('id', bot.id)
      const status = isMissingTableError(linkError) ? 503 : 500
      return NextResponse.json(
        {
          error: 'Failed to attach documents',
          details: linkError.message,
          hint: isMissingTableError(linkError) ? migrationHint() : undefined,
        },
        { status }
      )
    }

    return NextResponse.json({
      ...bot,
      linkedDocumentCount: validDocumentIds.length,
      hostedUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/bot/${bot.slug}`,
    })
  } catch (error: any) {
    console.error('[POST /api/chatbots] failed at step:', step, error)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to create chatbot',
        details: error?.details || error?.hint || null,
        step,
        hint:
          step === 'validate-documents'
            ? 'Ensure selected documents are COMPLETED and belong to the logged-in user.'
            : undefined,
      },
      { status: 500 }
    )
  }
}
