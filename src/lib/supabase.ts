import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')?.trim()
const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''
)?.trim()
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '')?.trim()


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

export const supabase = supabaseBrowser

export const isSupabaseConfigured = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey))

export type { SupabaseClient }

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


