import { NextRequest, NextResponse } from 'next/server'
import { createServerClientForToken, supabaseServer } from '@/lib/supabase'
import { verifyApiKey, verifyEmbedToken } from '@/lib/chatbot-security'

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

    const apiKey = request.headers.get('x-api-key')
    const embedToken = request.headers.get('x-embed-token')

    if (!apiKey && !embedToken) {
      return NextResponse.json({ error: 'Token or API key required' }, { status: 401 })
    }

    let verified: any = null
    if (apiKey) {
      verified = await verifyApiKey(db, String(apiKey))
    } else {
      verified = await verifyEmbedToken(db, String(embedToken))
    }

    if (!verified || !verified.chatbots) {
      return NextResponse.json({ error: 'Invalid credential' }, { status: 401 })
    }

    const chatbot = verified.chatbots
    const body = await request.json()
    const feedbackType = body?.feedbackType === 'up' ? 'up' : 'down'

    const { error } = await db.from('message_feedback').insert({
      scope: 'public',
      user_id: null,
      chatbot_id: chatbot.id,
      chatbot_session_id: body?.sessionId || null,
      app_message_id: String(body?.appMessageId || ''),
      feedback_type: feedbackType,
      feedback_reason: body?.feedbackReason ? String(body.feedbackReason).slice(0, 500) : null,
      query_text: body?.queryText ? String(body.queryText).slice(0, 2000) : null,
      response_text: body?.responseText ? String(body.responseText).slice(0, 6000) : null,
      metadata: {
        source: 'runtime-feedback',
      },
    })

    if (error) {
      return NextResponse.json({ error: 'Failed to store feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Runtime feedback API error:', error)
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 })
  }
}
