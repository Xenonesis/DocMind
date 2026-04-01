export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  const envKeys = Object.keys(process.env).filter(k => 
    k.includes('SUPABASE') || k.includes('NEXT_PUBLIC')
  )

  const envValues = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV
  }

  let userError = null
  let userDetails = null
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (supabaseServer && token) {
    try {
      const { data, error } = await supabaseServer.auth.getUser(token)
      if (error) {
        userError = { message: error.message, status: error.status, name: error.name }
      } else {
        userDetails = data.user?.id
      }
    } catch (e: any) {
      userError = { message: e.message, stack: e.stack }
    }
  }

  return NextResponse.json({
    hasSupabaseServer: !!supabaseServer,
    hasAuthHeader: !!authHeader,
    envKeys,
    envValues,
    userError,
    userDetails,
    timestamp: new Date().toISOString()
  })
}
