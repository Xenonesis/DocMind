import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClientForToken, supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser, ensureUserProfile } from '@/lib/auth-server'

const payloadSchema = z.object({
  response_style: z.enum(['concise', 'balanced', 'detailed']).optional(),
  highlight_enabled: z.boolean().optional(),
  reference_enabled: z.boolean().optional(),
  memory_learning_enabled: z.boolean().optional(),
  auto_regenerate_on_dislike: z.boolean().optional(),
  preview_selection_enabled: z.boolean().optional(),
})

const defaultPreferences = {
  response_style: 'balanced' as const,
  highlight_enabled: true,
  reference_enabled: true,
  memory_learning_enabled: true,
  auto_regenerate_on_dislike: true,
  preview_selection_enabled: true,
}

function isMissingColumnError(error: any): boolean {
  const code = error?.code || error?.details?.code
  const message = String(error?.message || '').toLowerCase()
  return code === '42703' || (message.includes('column') && message.includes('does not exist'))
}

function getDbClient(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
  return createServerClientForToken(token) || supabaseServer
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    try { await ensureUserProfile(user, db) } catch {}

    let { data, error }: { data: any; error: any } = await db
      .from('user_response_preferences')
      .select('response_style, highlight_enabled, reference_enabled, memory_learning_enabled, auto_regenerate_on_dislike, preview_selection_enabled')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error && isMissingColumnError(error)) {
      const fallback = await db
        .from('user_response_preferences')
        .select('response_style, highlight_enabled, reference_enabled')
        .eq('user_id', user.id)
        .maybeSingle()
      data = fallback.data
      error = fallback.error
    }

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
    }

    return NextResponse.json({ ...defaultPreferences, ...(data || {}) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    try { await ensureUserProfile(user, db) } catch {}

    const body = await request.json()
    const parsed = payloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid preferences payload' }, { status: 400 })
    }

    const updates = {
      user_id: user.id,
      response_style: parsed.data.response_style ?? defaultPreferences.response_style,
      highlight_enabled: parsed.data.highlight_enabled ?? defaultPreferences.highlight_enabled,
      reference_enabled: parsed.data.reference_enabled ?? defaultPreferences.reference_enabled,
      memory_learning_enabled: parsed.data.memory_learning_enabled ?? defaultPreferences.memory_learning_enabled,
      auto_regenerate_on_dislike: parsed.data.auto_regenerate_on_dislike ?? defaultPreferences.auto_regenerate_on_dislike,
      preview_selection_enabled: parsed.data.preview_selection_enabled ?? defaultPreferences.preview_selection_enabled,
      updated_at: new Date().toISOString(),
    }

    let { data, error }: { data: any; error: any } = await db
      .from('user_response_preferences')
      .upsert(updates, { onConflict: 'user_id' })
      .select('response_style, highlight_enabled, reference_enabled, memory_learning_enabled, auto_regenerate_on_dislike, preview_selection_enabled')
      .single()

    if (error && isMissingColumnError(error)) {
      const fallback = await db
        .from('user_response_preferences')
        .upsert({
          user_id: user.id,
          response_style: updates.response_style,
          highlight_enabled: updates.highlight_enabled,
          reference_enabled: updates.reference_enabled,
          updated_at: updates.updated_at,
        }, { onConflict: 'user_id' })
        .select('response_style, highlight_enabled, reference_enabled')
        .single()
      data = fallback.data
      error = fallback.error
    }

    if (error) {
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ ...defaultPreferences, ...(data || {}) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save preferences' }, { status: 500 })
  }
}
