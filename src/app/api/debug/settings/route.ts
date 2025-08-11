import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { decryptApiKey } from '@/lib/crypto-utils'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Get raw AI provider settings from Supabase
    const { data: settings, error } = await supabaseServer
      .from('ai_provider_settings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Debug information
    const debugInfo = {
      userId: user.id,
      userEmail: user.email,
      totalSettings: settings?.length || 0,
      settings: (settings || []).map(setting => ({
        id: setting.id,
        provider_name: setting.provider_name,
        model_name: setting.model_name,
        is_active: setting.is_active,
        has_api_key: !!setting.api_key,
        api_key_length: setting.api_key ? setting.api_key.length : 0,
        api_key_encrypted: setting.api_key ? setting.api_key.substring(0, 20) + '...' : null,
        api_key_decrypted_preview: setting.api_key ? 
          (() => {
            try {
              const decrypted = decryptApiKey(setting.api_key)
              return decrypted ? decrypted.substring(0, 10) + '...' : 'FAILED_TO_DECRYPT'
            } catch (e) {
              return 'DECRYPT_ERROR'
            }
          })() : null,
        base_url: setting.base_url,
        created_at: setting.created_at,
        updated_at: setting.updated_at
      }))
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('Error in debug settings:', error)
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 })
  }
}