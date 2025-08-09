import { NextRequest, NextResponse } from 'next/server'
import { aiProviderService, userService, AiProvider } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const defaultUser = await getOrCreateDefaultUser()

    const settings = await aiProviderService.getAll()

    // Filter by userId (since Firebase doesn't have built-in where clause in getAll)
    const userSettings = settings.filter(setting => setting.userId === defaultUser.id)

    const formattedSettings = userSettings.map(setting => ({
      id: setting.id,
      provider: setting.provider,
      apiKey: setting.apiKey ? '•'.repeat(32) : '', // Masked API key
      baseUrl: setting.baseUrl,
      model: setting.model,
      isActive: setting.isActive,
      config: setting.config ? JSON.parse(setting.config) : {},
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt
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

    const defaultUser = await getOrCreateDefaultUser()

    // Helper to upsert a single provider setting
    const upsertOne = async (item: any) => {
      const { provider, apiKey, baseUrl, model, config = {}, isActive = false } = item || {}

      if (!provider) {
        throw new Error('Provider is required')
      }

      const existingSettings = await aiProviderService.getWhere('userId', '==', defaultUser.id)
      const existingSetting = existingSettings.find(s => s.provider === provider)

      let settingId: string
      let setting

      if (existingSetting) {
        await aiProviderService.update(existingSetting.id, {
          apiKey: apiKey ?? existingSetting.apiKey,
          baseUrl: baseUrl ?? existingSetting.baseUrl,
          model: model ?? existingSetting.model,
          isActive,
          config: JSON.stringify(config)
        })
        settingId = existingSetting.id
        setting = await aiProviderService.getById(settingId)
      } else {
        settingId = await aiProviderService.create({
          userId: defaultUser.id,
          provider: provider as AiProvider,
          apiKey: apiKey || '',
          baseUrl: baseUrl || '',
          model: model || '',
          isActive,
          config: JSON.stringify(config),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        setting = await aiProviderService.getById(settingId)
      }

      if (!setting) {
        throw new Error('Failed to retrieve setting after creation/update')
      }

      return {
        id: setting.id,
        provider: setting.provider,
        apiKey: '•'.repeat(32),
        baseUrl: setting.baseUrl,
        model: setting.model,
        isActive: setting.isActive,
        config: setting.config ? JSON.parse(setting.config) : {},
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt
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

async function getOrCreateDefaultUser() {
  const users = await userService.getAll()
  let user = users.length > 0 ? users[0] : null
  
  if (!user) {
    const userId = await userService.create({
      email: 'default@example.com',
      name: 'Default User',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    user = await userService.getById(userId)
  }
  
  return user!
}