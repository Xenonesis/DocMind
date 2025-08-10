import { NextRequest } from 'next/server'
import { supabaseServer } from './supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  avatar_url?: string
}

/**
 * Get authenticated user from request headers
 * Returns null if not authenticated or if Supabase is not configured
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  if (!supabaseServer) {
    console.warn('Supabase not configured on server')
    return null
  }

  try {
    // Get the session token from the request headers
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)
    
    if (error || !user) {
      console.warn('Authentication failed:', error?.message)
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
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
    throw createError
  }

  return newProfile
}