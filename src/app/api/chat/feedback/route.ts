import { NextRequest, NextResponse } from 'next/server'
import { createServerClientForToken, supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const db = createServerClientForToken(token) || supabaseServer

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const body = await request.json()
    const feedbackType = body?.feedbackType === 'up' ? 'up' : 'down'

    const { error: insertError } = await db.from('message_feedback').insert({
      scope: 'dashboard',
      user_id: user.id,
      session_id: body?.sessionId || null,
      app_message_id: String(body?.appMessageId || ''),
      feedback_type: feedbackType,
      feedback_reason: body?.feedbackReason ? String(body.feedbackReason).slice(0, 500) : null,
      query_text: body?.queryText ? String(body.queryText).slice(0, 2000) : null,
      response_text: body?.responseText ? String(body.responseText).slice(0, 6000) : null,
      metadata: {
        selectedText: body?.selectedText || null,
      },
    })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to store feedback' }, { status: 500 })
    }

    const { data: profile } = await db
      .from('user_memory_profiles')
      .select('feedback_summary')
      .eq('user_id', user.id)
      .maybeSingle()

    const summary = profile?.feedback_summary || {}
    const likes = Number(summary.likes || 0) + (feedbackType === 'up' ? 1 : 0)
    const dislikes = Number(summary.dislikes || 0) + (feedbackType === 'down' ? 1 : 0)

    await db
      .from('user_memory_profiles')
      .upsert({
        user_id: user.id,
        feedback_summary: {
          ...summary,
          likes,
          dislikes,
          lastReason: body?.feedbackReason ? String(body.feedbackReason).slice(0, 200) : null,
        },
        last_learned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 })
  }
}
