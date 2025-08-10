import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Health check called')
    
    // Test basic functionality
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      supabaseConfigured: !!supabaseServer,
      environment: process.env.NODE_ENV
    }
    
    // Test database connection if Supabase is configured
    if (supabaseServer) {
      try {
        const { data, error } = await supabaseServer
          .from('user_profiles')
          .select('count')
          .limit(1)
        
        health.databaseConnection = !error
        if (error) {
          console.error('Database test error:', error)
        }
      } catch (dbError) {
        console.error('Database connection error:', dbError)
        health.databaseConnection = false
      }
    }
    
    console.log('Health check result:', health)
    return NextResponse.json(health)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}