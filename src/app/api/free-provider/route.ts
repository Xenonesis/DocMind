import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.DOCSCAN_FREE_API_KEY
  const baseUrl = process.env.DOCSCAN_FREE_BASE_URL || 'https://api.us-west-2.modal.direct/v1'

  const groqApiKey = process.env.GROQ_API_KEY
  const groqBaseUrl = 'https://api.groq.com/openai/v1'

  let groqModels = ['llama-3.1-8b-instant', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it']

  if (groqApiKey) {
    try {
      const res = await fetch(`${groqBaseUrl}/models`, {
        headers: { Authorization: `Bearer ${groqApiKey}` },
        next: { revalidate: 3600 },
      })
      if (res.ok) {
        const data = await res.json()
        if (data && data.data) {
          groqModels = data.data.map((m: any) => m.id)
        }
      }
    } catch (e) {
      console.error('Failed to fetch groq models:', e)
    }
  }

  const providers: any[] = []

  if (apiKey) {
    providers.push({
      id: 'docscan-free-builtin',
      name: 'DocScan Glm-5 (free)',
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

  if (groqApiKey) {
    const defaultGroqModel = groqModels.includes('llama-3.1-8b-instant')
      ? 'llama-3.1-8b-instant'
      : groqModels.find((m) => m.includes('llama') && !m.includes('guard')) || groqModels[0]

    providers.push({
      id: 'docscan-free-groq',
      name: 'DocScan model name from groq (free)',
      type: 'groq',
      baseUrl: groqBaseUrl,
      apiKey: groqApiKey,
      model: defaultGroqModel,
      models: groqModels,
      isActive: false,
      isConfigured: true,
      description: 'Ultra-fast inference powered by Groq. Free built-in provider.',
      iconType: 'zap',
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.9,
    })
  }

  if (providers.length === 0) {
    return NextResponse.json([])
  }

  return NextResponse.json(providers)
}
