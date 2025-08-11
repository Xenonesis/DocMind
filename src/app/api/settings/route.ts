import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, createServerClientForToken } from '@/lib/supabase'
import { getAuthenticatedUser, ensureUserProfile } from '@/lib/auth-server'
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/crypto-utils'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const db = createServerClientForToken(token) || supabaseServer

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Verify user exists by checking if we can query their data
    try {
      const { data: testQuery, error: testError } = await db
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // If the user doesn't exist, their session is invalid
      if (testError && testError.code === 'PGRST116') {
        console.error(`User ${user.id} not found in database:`, testError)
        return NextResponse.json({ 
          error: 'User session is invalid. Please log out and log back in.' 
        }, { status: 401 })
      }

      // If there's any other error with the test query, log it but continue
      if (testError) {
        console.warn('User verification query had an error, but continuing:', testError)
      }
    } catch (verificationError) {
      console.warn('User verification failed, but continuing:', verificationError)
    }

    // Ensure user profile exists
    try {
      await ensureUserProfile(user)
    } catch (profileError: any) {
      console.error('Error ensuring user profile:', profileError)
      if (profileError.code === '23503' || profileError.message === 'User not found in authentication system') {
        return NextResponse.json({ 
          error: 'User session is invalid. Please log out and log back in.' 
        }, { status: 401 })
      }
      throw profileError
    }

    // Get user's AI provider settings
    const { data: settings, error } = await db
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
      apiKey: setting.api_key ? decryptApiKey(setting.api_key) : '', // Return actual API key, no masking
      model: setting.model_name,
      isActive: setting.is_active,
      baseUrl: setting.base_url || '',
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

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const db = createServerClientForToken(token) || supabaseServer

    if (!db) {
      console.error('Supabase server not configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Ensure user profile exists (best-effort)
    try { await ensureUserProfile(user) } catch {}

    const { providers } = body
    if (!providers || !Array.isArray(providers)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

    const results = []

    console.log(`Processing ${providers.length} providers for user ${user.id}`)

    for (const item of providers) {
      try {
        console.log(`Processing provider: ${item.provider}, apiKey length: ${item.apiKey?.length || 0}`)
        const result = await upsertProviderSetting(db, user.id, item)
        results.push(result)
        console.log(`Successfully processed provider: ${item.provider}`)
      } catch (error: any) {
        console.error('Error processing provider:', item.provider, error)
        results.push({ error: error.message, provider: item.provider })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error in settings POST:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

// Enhanced upsert function with proper encryption
async function upsertProviderSetting(db: any, userId: string, item: any) {
  const { provider, apiKey, model, isActive, config, baseUrl } = item

  // Check for existing setting
  const { data: existingSetting, error: fetchError } = await db
    .from('ai_provider_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('provider_name', provider)
    .maybeSingle()

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching existing setting:', fetchError)
    throw fetchError
  }

  let result
  if (existingSetting) {
    // Always update API key if provided
    let apiKeyUpdate = existingSetting.api_key
    if (apiKey !== undefined && apiKey !== '') {
      // Encrypt the new API key
      apiKeyUpdate = encryptApiKey(apiKey)
    }

    const updateData = {
      api_key: apiKeyUpdate,
      model_name: model ?? existingSetting.model_name,
      is_active: isActive,
      updated_at: new Date().toISOString(),
      base_url: baseUrl ?? existingSetting.base_url
    }

    const { data: updatedSetting, error: updateError } = await db
      .from('ai_provider_settings')
      .update(updateData)
      .eq('id', existingSetting.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating setting:', updateError)
      throw updateError
    }
    result = updatedSetting
  } else {
    // Encrypt API key for new settings
    const encryptedApiKey = apiKey ? encryptApiKey(apiKey) : ''

    const insertData = {
      user_id: userId,
      provider_name: provider,
      api_key: encryptedApiKey,
      model_name: model || '',
      is_active: isActive,
      base_url: baseUrl ?? null
    }

    const { data: newSetting, error: createError } = await db
      .from('ai_provider_settings')
      .insert(insertData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating setting:', createError)
      throw createError
    }
    result = newSetting
  }

  return result
}

