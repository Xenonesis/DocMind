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
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const json = Buffer.from(normalized, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

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

export async function ensureUserProfile(user: AuthenticatedUser, dbClient?: any) {
  const db = dbClient || supabaseServer
  if (!db) {
    throw new Error('Supabase not configured')
  }

  const { data: existingProfile, error: fetchError } = await db
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { 
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

  const { data: newProfile, error: createError } = await db
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
    if (createError.code === '23503') {
      const error = new Error('User not found in authentication system')
      ;(error as any).code = '23503'
      throw error
    }
    throw createError
  }

  return newProfile
}