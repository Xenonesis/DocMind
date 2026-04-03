import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-service'
import { createServerClientForToken, supabaseServer } from '@/lib/supabase'
import { buildGuardrailedPrompts, normalizeGuardrailResponse } from '@/lib/chatbot-guardrails'
import { enforceStandardRateLimit } from '@/lib/chatbot-rate-limit'
import { getClientIp, verifyApiKey, verifyEmbedToken } from '@/lib/chatbot-security'
import { clampSelectionText, deriveHighlights, deriveReferences } from '@/lib/answer-utils'

export const dynamic = 'force-dynamic'

function chunkText(text: string, chunkSize = 120): string[] {
  if (!text) return []
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks
}

function createStreamResponse(payload: {
  chatbot: { id: string; name: string; slug: string }
  sessionId: string
  messageId?: string | null
  answer: string
  refused: boolean
  relevantDocuments: string[]
  references: Array<{ documentId: string; documentName: string; snippet: string; score: number }>
  highlights: Array<{ text: string; reason: string }>
  provider: string
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number }
}) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      send({ type: 'start', provider: payload.provider })

      for (const chunk of chunkText(payload.answer)) {
        send({ type: 'chunk', content: chunk })
      }

      send({ type: 'done', payload })
      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

function parseHistory(value: unknown): Array<{ role: string; content: string }> {
  if (!Array.isArray(value)) return []
  return value
    .filter((item: any) => item && typeof item.content === 'string')
    .map((item: any) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content).slice(0, 2000),
    }))
    .slice(-8)
}

async function getFallbackProvider() {
  if (process.env.GROQ_API_KEY) {
    return {
      id: 'docscan-free-groq',
      name: 'DocScan llama-3.1-8b from groq (free)',
      type: 'groq' as const,
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant',
      maxTokens: 4096,
      temperature: 0.7,
      isActive: true,
      isConfigured: true,
    }
  }

  if (process.env.DOCSCAN_FREE_API_KEY) {
    return {
      id: 'docscan-free-builtin',
      name: 'DocScan Glm-5 (free)',
      type: 'openai-compatible' as const,
      baseUrl: process.env.DOCSCAN_FREE_BASE_URL || 'https://api.us-west-2.modal.direct/v1',
      apiKey: process.env.DOCSCAN_FREE_API_KEY,
      model: 'zai-org/GLM-5-FP8',
      maxTokens: 4096,
      temperature: 0.7,
      isActive: true,
      isConfigured: true,
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : undefined

    const db = createServerClientForToken(bearerToken) || supabaseServer

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const query = String(body.query || '').trim()
    const selectedText = clampSelectionText(body?.selectedTextContext?.text || '')
    const feedbackReason = body?.improveFromFeedback?.feedbackReason
      ? String(body.improveFromFeedback.feedbackReason).slice(0, 300)
      : ''
    const wantsStream = body.stream === true
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const slug = String(body.slug || '').trim()
    const embedToken = request.headers.get('x-embed-token')
    const apiKey = request.headers.get('x-api-key')

    if (!embedToken && !apiKey) {
      return NextResponse.json({ error: 'Token or API key required' }, { status: 401 })
    }

    let verified: any = null
    let authMode: 'api_key' | 'embed_token' = 'embed_token'

    if (apiKey) {
      verified = await verifyApiKey(db, String(apiKey))
      authMode = 'api_key'
    } else {
      verified = await verifyEmbedToken(db, String(embedToken))
      authMode = 'embed_token'
    }

    if (!verified || !verified.chatbots) {
      return NextResponse.json({ error: 'Invalid or expired credential' }, { status: 401 })
    }

    const chatbot = verified.chatbots
    const responseStyle = chatbot.response_style || 'balanced'
    const includeReferences = chatbot.include_references !== false
    const includeHighlights = chatbot.include_highlights !== false
    const useChatMemory = chatbot.use_chat_memory !== false
    const allowAutoRegenerate = chatbot.auto_regenerate_on_dislike !== false

    const promptQuery = [
      query,
      selectedText ? `Selected text focus:\n${selectedText}` : '',
      allowAutoRegenerate && feedbackReason
        ? `User disliked a previous answer. Improve this response by addressing: ${feedbackReason}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    if (slug && slug !== chatbot.slug) {
      return NextResponse.json(
        { error: 'Invalid chatbot slug for this credential' },
        { status: 401 }
      )
    }

    const origin = request.headers.get('origin')
    const allowedOrigins = Array.isArray(verified.allowed_origins)
      ? verified.allowed_origins
          .map((value: unknown) =>
            String(value || '')
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      : []

    if (
      origin &&
      allowedOrigins.length > 0 &&
      !allowedOrigins.includes(origin.trim().toLowerCase())
    ) {
      return NextResponse.json({ error: 'Origin is not allowed' }, { status: 403 })
    }

    const ipAddress = getClientIp(request)

    const rateResult = await enforceStandardRateLimit(db, {
      chatbotId: chatbot.id,
      ipAddress,
      botPerMinute: chatbot.requests_per_minute_bot,
      ipPerMinute: chatbot.requests_per_minute_ip,
      botPerDay: chatbot.requests_per_day_bot,
    })

    if (!rateResult.allowed) {
      await db.from('chatbot_audit_logs').insert({
        chatbot_id: chatbot.id,
        auth_mode: authMode,
        client_ip: ipAddress,
        query_text: query,
        decision: 'blocked',
        decision_reason: rateResult.reason || 'rate limit exceeded',
      })

      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const { data: links, error: docsError } = await db
      .from('chatbot_documents')
      .select('document_id, documents!inner(id, name, category, content, status)')
      .eq('chatbot_id', chatbot.id)

    if (docsError) {
      return NextResponse.json({ error: 'Failed to load chatbot documents' }, { status: 500 })
    }

    const docs = (links || [])
      .map((item: any) => item.documents)
      .filter(
        (doc: any) =>
          doc?.status === 'COMPLETED' &&
          typeof doc.content === 'string' &&
          doc.content.trim().length > 0
      )

    if (docs.length === 0) {
      return NextResponse.json(
        { error: 'No completed documents linked to this chatbot' },
        { status: 400 }
      )
    }

    const history = useChatMemory ? parseHistory(body.history) : []
    const prompts = buildGuardrailedPrompts({
      query: promptQuery,
      history,
      systemPrompt: chatbot.system_prompt,
      refusalMessage: chatbot.refusal_message,
      documents: docs,
    })

    let sessionId = body.sessionId ? String(body.sessionId) : `ephemeral-${Date.now()}`
    let canPersistSession = false

    if (!body.sessionId) {
      const { data: createdSession, error: sessionError } = await db
        .from('chatbot_sessions')
        .insert({
          chatbot_id: chatbot.id,
          source: authMode === 'api_key' ? 'api' : 'hosted',
          visitor_id: body.visitorId ? String(body.visitorId) : null,
          metadata: {
            ipAddress,
            authMode,
          },
        })
        .select('id')
        .single()

      if (!sessionError && createdSession?.id) {
        sessionId = createdSession.id
        canPersistSession = true
      }
    } else {
      const { error: sessionUpdateError } = await db
        .from('chatbot_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('chatbot_id', chatbot.id)

      if (!sessionUpdateError) {
        canPersistSession = true
      }
    }

    let assistantMessageId: string | null = null

    if (canPersistSession) {
      await db.from('chatbot_messages').insert({
        session_id: sessionId,
        chatbot_id: chatbot.id,
        role: 'user',
        content: query,
      })
    }

    const aiService = AIService.getInstance()
    await aiService.loadProvidersFromDatabase(chatbot.user_id)
    const provider = aiService.getActiveProvider() || (await getFallbackProvider())

    if (!provider) {
      return NextResponse.json(
        { error: 'No AI provider configured for bot owner' },
        { status: 400 }
      )
    }

    const styleInstruction =
      responseStyle === 'concise'
        ? 'Keep responses concise, direct, and short.'
        : responseStyle === 'detailed'
          ? 'Provide detailed explanations with complete context and rationale.'
          : 'Keep a balanced response style: clear, moderately detailed, and practical.'

    const completion = await aiService.generateCompletion({
      provider,
      prompt: prompts.userPrompt,
      systemPrompt: `${prompts.systemPrompt}\n\n${styleInstruction}`,
      temperature: chatbot.temperature ?? 0.2,
      maxTokens: chatbot.max_tokens ?? 1024,
    })

    const normalized = normalizeGuardrailResponse(completion.content, chatbot.refusal_message)

    if (canPersistSession) {
      const { data: assistantMessage } = await db
        .from('chatbot_messages')
        .insert({
          session_id: sessionId,
          chatbot_id: chatbot.id,
          role: 'assistant',
          content: normalized.answer,
          tokens_used: completion.usage?.totalTokens || 0,
        })
        .select('id')
        .single()

      assistantMessageId = assistantMessage?.id || null
    }

    const references =
      normalized.refused || !includeReferences
        ? []
        : deriveReferences(
            query,
            normalized.answer,
            docs.map((doc: any) => ({
              id: doc.id,
              name: doc.name,
              content: doc.content,
            }))
          )
    const highlights =
      normalized.refused || !includeHighlights ? [] : deriveHighlights(normalized.answer)

    try {
      await db.from('chatbot_audit_logs').insert({
        chatbot_id: chatbot.id,
        session_id: canPersistSession ? sessionId : null,
        auth_mode: authMode,
        client_ip: ipAddress,
        query_text: query,
        decision: normalized.refused ? 'refused' : 'allowed',
        decision_reason: normalized.refused ? 'outside linked document scope' : null,
        response_excerpt: normalized.answer.slice(0, 300),
        tokens_used: completion.usage?.totalTokens || 0,
      })
    } catch {
      // Best effort audit logging.
    }

    try {
      if (authMode === 'api_key') {
        await db
          .from('chatbot_api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', verified.id)
      } else {
        await db
          .from('chatbot_embed_tokens')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', verified.id)
      }
    } catch {
      // Best effort credential usage tracking.
    }

    const responsePayload = {
      chatbot: {
        id: chatbot.id,
        name: chatbot.name,
        slug: chatbot.slug,
      },
      sessionId,
      messageId: assistantMessageId,
      answer: normalized.answer,
      refused: normalized.refused,
      relevantDocuments:
        references.length > 0
          ? references.map((ref: any) => ref.documentName)
          : docs.map((doc: any) => doc.name),
      references,
      highlights,
      provider: provider.name,
      usage: completion.usage,
    }

    if (wantsStream) {
      return createStreamResponse(responsePayload)
    }

    return NextResponse.json(responsePayload)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process chatbot query' },
      { status: 500 }
    )
  }
}
