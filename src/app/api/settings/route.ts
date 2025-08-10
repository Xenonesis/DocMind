import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser, ensureUserProfile } from '@/lib/auth-server'

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

    // Ensure user profile exists
    await ensureUserProfile(user)

    // Get user's AI provider settings
    const { data: settings, error } = await supabaseServer
      .from('ai_provider_settings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    const formattedSettings = (settings || []).map(setting => ({
      id: setting.id,
      provider: setting.provider_name,
      apiKey: setting.api_key ? '•'.repeat(32) : '', // Masked API key
      model: setting.model_name,
      isActive: setting.is_active,
      createdAt: setting.created_at,
      updatedAt: setting.updated_at
    }))

    return NextResponse.json(formattedSettings)

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Ensure user profile exists
    await ensureUserProfile(user)

    // Helper to upsert a single provider setting
    const upsertOne = async (item: any) => {
      const { provider, apiKey, model, isActive = false } = item || {}

      if (!provider) {
        throw new Error('Provider is required')
      }

      // Check if setting already exists
      const { data: existingSetting } = await supabaseServer
        .from('ai_provider_settings')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider_name', provider)
        .single()

      let result
      if (existingSetting) {
        // Update existing setting
        const { data: updatedSetting, error: updateError } = await supabaseServer
          .from('ai_provider_settings')
          .update({
            api_key: apiKey ?? existingSetting.api_key,
            model_name: model ?? existingSetting.model_name,
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSetting.id)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }
        result = updatedSetting
      } else {
        // Create new setting
        const { data: newSetting, error: createError } = await supabaseServer
          .from('ai_provider_settings')
          .insert({
            user_id: user.id,
            provider_name: provider,
            api_key: apiKey || '',
            model_name: model || '',
            is_active: isActive
          })
          .select()
          .single()

        if (createError) {
          throw createError
        }
        result = newSetting
      }

      return {
        id: result.id,
        provider: result.provider_name,
        apiKey: '•'.repeat(32),
        model: result.model_name,
        isActive: result.is_active,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      }
    }

    // Bulk save if providers array is provided
    if (Array.isArray(body?.providers)) {
      const results = [] as any[]
      for (const item of body.providers) {
        const saved = await upsertOne(item)
        results.push(saved)
      }
      return NextResponse.json(results)
    }

    // Single save fallback (backward compatible)
    const singleResult = await upsertOne(body)
    return NextResponse.json(singleResult)

  } catch (error) {
    console.error('Error saving setting:', error)
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 })
  }
}

