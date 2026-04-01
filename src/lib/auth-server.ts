import { NextRequest } from 'next/server'
import { supabaseServer } from './supabase'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  avatar_url?: string
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[auth-server] Missing or invalid Authorization header')
    return null
  }

  const token = authHeader.substring(7)

  if (!supabaseServer) {
    console.error('[auth-server] supabaseServer is null. Check NEXT_PUBLIC_SUPABASE_URL and Anon Key env variables.')
    return null
  }

  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    if (error) {
      console.error('[auth-server] Supabase getUser error:', error.message, error.status)
      return null
    }
    if (!user) {
      console.warn('[auth-server] getUser returned no user and no error')
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