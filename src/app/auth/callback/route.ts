import { NextRequest, NextResponse } from 'next/server'

// Keep this route as a simple redirect trampoline back to the client so the
// browser-side Supabase client can exchange the code and persist the session
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  return NextResponse.redirect(`${origin}${next}`)
}