import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Environment-driven configuration (do not hardcode keys)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create clients. Use service role on server when available; fall back to anon.
export const supabaseServer: SupabaseClient | null =
  typeof window === 'undefined' && supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey)
    ? createClient(supabaseUrl, (supabaseServiceRoleKey || supabaseAnonKey) as string, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    : null

export const supabaseBrowser: SupabaseClient | null =
  typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: 'docmind.auth',
          flowType: 'pkce'
        }
      })
    : null

// Single client for browser use
export const supabase = supabaseBrowser

export const isSupabaseConfigured = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey))

export type { SupabaseClient }

// Create a per-request server client that carries the user's Authorization header
// This ensures RLS policies using auth.uid() work even without the service role key.
export function createServerClientForToken(token?: string): SupabaseClient | null {
  if (typeof window !== 'undefined') return null
  if (!supabaseUrl || !(supabaseServiceRoleKey || supabaseAnonKey)) return null

  return createClient(supabaseUrl, (supabaseServiceRoleKey || supabaseAnonKey) as string, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  })
}


