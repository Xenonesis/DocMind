import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Returns the built-in free DocScan provider config.
 * API key is injected from server-side env so it is never exposed in client bundles.
 */
export async function GET() {
  const apiKey = process.env.DOCSCAN_FREE_API_KEY
  const baseUrl = process.env.DOCSCAN_FREE_BASE_URL || 'https://api.us-west-2.modal.direct/v1'

  if (!apiKey) {
    return NextResponse.json({ error: 'Free provider not configured' }, { status: 404 })
  }

  return NextResponse.json({
    name: 'DocScan Free',
    type: 'openai-compatible',
    baseUrl,
    apiKey,
    model: 'zai-org/GLM-5-FP8',
    models: ['zai-org/GLM-5-FP8'],
    isActive: false,
    isConfigured: true,
    description: 'Free built-in provider powered by DocScan. No API key required.',
    iconType: 'zap',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
  })
}
