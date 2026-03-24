import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai-service'
import { supabaseServer } from '@/lib/supabase'
import { buildGuardrailedPrompts, normalizeGuardrailResponse } from '@/lib/chatbot-guardrails'
import { enforceStandardRateLimit } from '@/lib/chatbot-rate-limit'
import { getClientIp, verifyApiKey, verifyEmbedToken } from '@/lib/chatbot-security'

export const dynamic = 'force-dynamic'

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
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const query = String(body.query || '').trim()
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const slug = String(body.slug || '').trim()
    const embedToken = request.headers.get('x-embed-token') || body.token
    const apiKey = request.headers.get('x-api-key') || body.apiKey

    if (!embedToken && !apiKey) {
      return NextResponse.json({ error: 'Token or API key required' }, { status: 401 })
    }

    let verified: any = null
    let authMode: 'api_key' | 'embed_token' = 'embed_token'

    if (apiKey) {
      verified = await verifyApiKey(supabaseServer, String(apiKey))
      authMode = 'api_key'
    } else {
      verified = await verifyEmbedToken(supabaseServer, String(embedToken))
      authMode = 'embed_token'
    }

    if (!verified || !verified.chatbots) {
      return NextResponse.json({ error: 'Invalid or expired credential' }, { status: 401 })
    }

    const chatbot = verified.chatbots

    if (slug && slug !== chatbot.slug) {
      return NextResponse.json({ error: 'Invalid chatbot slug for this credential' }, { status: 401 })
    }

    if (authMode === 'embed_token') {
      const origin = request.headers.get('origin')
      const allowedOrigins = Array.isArray(verified.allowed_origins) ? verified.allowed_origins : []
      if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        return NextResponse.json({ error: 'Origin is not allowed' }, { status: 403 })
      }
    }

    const ipAddress = getClientIp(request)

    const rateResult = await enforceStandardRateLimit(supabaseServer, {
      chatbotId: chatbot.id,
      ipAddress,
      botPerMinute: chatbot.requests_per_minute_bot,
      ipPerMinute: chatbot.requests_per_minute_ip,
      botPerDay: chatbot.requests_per_day_bot,
    })

    if (!rateResult.allowed) {
      await supabaseServer.from('chatbot_audit_logs').insert({
        chatbot_id: chatbot.id,
        auth_mode: authMode,
        client_ip: ipAddress,
        query_text: query,
        decision: 'blocked',
        decision_reason: rateResult.reason || 'rate limit exceeded',
      })

      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 })
    }

    const { data: links, error: docsError } = await supabaseServer
      .from('chatbot_documents')
      .select('document_id, documents!inner(id, name, category, content, status)')
      .eq('chatbot_id', chatbot.id)

    if (docsError) {
      return NextResponse.json({ error: 'Failed to load chatbot documents' }, { status: 500 })
    }

    const docs = (links || [])
      .map((item: any) => item.documents)
      .filter((doc: any) => doc?.status === 'COMPLETED' && typeof doc.content === 'string' && doc.content.trim().length > 0)

    if (docs.length === 0) {
      return NextResponse.json({ error: 'No completed documents linked to this chatbot' }, { status: 400 })
    }

    const history = parseHistory(body.history)
    const prompts = buildGuardrailedPrompts({
      query,
      history,
      systemPrompt: chatbot.system_prompt,
      refusalMessage: chatbot.refusal_message,
      documents: docs,
    })

    let sessionId = body.sessionId ? String(body.sessionId) : ''

    if (!sessionId) {
      const { data: createdSession, error: sessionError } = await supabaseServer
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

      if (sessionError || !createdSession) {
        return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 })
      }

      sessionId = createdSession.id
    } else {
      await supabaseServer
        .from('chatbot_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('chatbot_id', chatbot.id)
    }

    await supabaseServer.from('chatbot_messages').insert({
      session_id: sessionId,
      chatbot_id: chatbot.id,
      role: 'user',
      content: query,
    })

    const aiService = AIService.getInstance()
    await aiService.loadProvidersFromDatabase(chatbot.user_id)
    const provider = aiService.getActiveProvider() || await getFallbackProvider()

    if (!provider) {
      return NextResponse.json({ error: 'No AI provider configured for bot owner' }, { status: 400 })
    }

    const completion = await aiService.generateCompletion({
      provider,
      prompt: prompts.userPrompt,
      systemPrompt: prompts.systemPrompt,
      temperature: chatbot.temperature ?? 0.2,
      maxTokens: chatbot.max_tokens ?? 1024,
    })

    const normalized = normalizeGuardrailResponse(completion.content, chatbot.refusal_message)

    await supabaseServer.from('chatbot_messages').insert({
      session_id: sessionId,
      chatbot_id: chatbot.id,
      role: 'assistant',
      content: normalized.answer,
      tokens_used: completion.usage?.totalTokens || 0,
    })

    await supabaseServer.from('chatbot_audit_logs').insert({
      chatbot_id: chatbot.id,
      session_id: sessionId,
      auth_mode: authMode,
      client_ip: ipAddress,
      query_text: query,
      decision: normalized.refused ? 'refused' : 'allowed',
      decision_reason: normalized.refused ? 'outside linked document scope' : null,
      response_excerpt: normalized.answer.slice(0, 300),
      tokens_used: completion.usage?.totalTokens || 0,
    })

    if (authMode === 'api_key') {
      await supabaseServer
        .from('chatbot_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', verified.id)
    } else {
      await supabaseServer
        .from('chatbot_embed_tokens')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', verified.id)
    }

    return NextResponse.json({
      chatbot: {
        id: chatbot.id,
        name: chatbot.name,
        slug: chatbot.slug,
      },
      sessionId,
      answer: normalized.answer,
      refused: normalized.refused,
      relevantDocuments: docs.map((doc: any) => doc.name),
      provider: provider.name,
      usage: completion.usage,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to process chatbot query' }, { status: 500 })
  }
}
