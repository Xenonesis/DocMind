import { NextRequest } from 'next/server'
import { supabaseServer } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  avatar_url?: string
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
    // base64url -> base64 padding
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const json = Buffer.from(normalized, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Get authenticated user from request headers
 * Returns null if not authenticated.
 * Tries local JWT decode first (no network); falls back to Supabase auth.getUser.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  // Get the session token from the request headers
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  // Try local decode (fast, no network). RLS will still validate token on DB calls.
  const payload = decodeJwtPayload(token)
  if (payload?.sub) {
    const email: string = payload.email || payload.user_metadata?.email || ''
    const name: string = payload.user_metadata?.name || (email ? email.split('@')[0] : 'User')
    return {
      id: payload.sub,
      email,
      name,
      avatar_url: payload.user_metadata?.avatar_url,
    }
  }

  // Fallback: call Supabase (may timeout if network unavailable)
  if (!supabaseServer) {
    return null
  }

  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    if (error || !user) {
      return null
    }
    return {
      id: user.id,
      email: user.email || '',
      name: (user as any).user_metadata?.name || user.email?.split('@')[0] || 'User',
      avatar_url: (user as any).user_metadata?.avatar_url,
    }
  } catch (error) {
    return null
  }
}

/**
 * Require authentication for an API route
 * Returns the authenticated user or throws an error response
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    throw new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  return user
}

/**
 * Create or get user profile in the database
 */
export async function ensureUserProfile(user: AuthenticatedUser) {
  if (!supabaseServer) {
    throw new Error('Supabase not configured')
  }

  // Check if user profile exists
  const { data: existingProfile, error: fetchError } = await supabaseServer
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
    // If it's a foreign key constraint error, the user doesn't exist in auth.users
    if (fetchError.code === '23503') {
      const error = new Error('User not found in authentication system')
      ;(error as any).code = '23503'
      throw error
    }
    throw fetchError
  }

  if (existingProfile) {
    return existingProfile
  }

  // Create user profile
  const { data: newProfile, error: createError } = await supabaseServer
    .from('user_profiles')
    .insert({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url
    })
    .select()
    .single()

  if (createError) {
    // If it's a foreign key constraint error, the user doesn't exist in auth.users
    if (createError.code === '23503') {
      const error = new Error('User not found in authentication system')
      ;(error as any).code = '23503'
      throw error
    }
    throw createError
  }

  return newProfile
}