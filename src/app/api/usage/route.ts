export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, createServerClientForToken } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'

type TimeRange = '24h' | '7d' | '30d'

type UsageRow = {
  ai_provider: string | null
  ai_model: string | null
  tokens_used: number | null
  processing_time_ms: number | null
  response: string | null
  created_at: string
}

type PricingRow = {
  provider_name: string | null
  model_name: string | null
  cost_per_1k_tokens: number | null
}

function getRangeStart(range: TimeRange): Date {
  const now = new Date()
  if (range === '24h') {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  const days = range === '30d' ? 30 : 7
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

function normalizeProviderName(provider: string | null, model: string | null): string {
  const p = (provider || '').trim()
  const m = (model || '').trim()

  if (!p && !m) return 'Unknown'
  if (p && p !== 'unknown') return p
  return m || 'Unknown'
}

function normalizeKey(value: string | null): string {
  return (value || '').toLowerCase().trim().replace(/[_\s]+/g, '-')
}

function isSuccessfulResponse(row: UsageRow): boolean {
  if ((row.ai_provider || '').toLowerCase() === 'error') {
    return false
  }

  if (!row.response) {
    return false
  }

  try {
    const parsed = JSON.parse(row.response)
    return !(parsed && typeof parsed === 'object' && 'error' in parsed)
  } catch {
    return true
  }
}

function estimateCostUSD(provider: string | null, model: string | null, tokens: number, pricingMap: Map<string, number>): number {
  const providerKey = normalizeKey(provider)
  const modelKey = normalizeKey(model)

  const directKey = `${providerKey}::${modelKey}`
  const modelOnlyKey = `*::${modelKey}`

  const directPrice = pricingMap.get(directKey)
  if (typeof directPrice === 'number') {
    return (tokens / 1000) * directPrice
  }

  const modelOnlyPrice = pricingMap.get(modelOnlyKey)
  if (typeof modelOnlyPrice === 'number') {
    return (tokens / 1000) * modelOnlyPrice
  }

  const key = `${provider || ''} ${model || ''}`.toLowerCase()

  let usdPer1kTokens = 0

  if (key.includes('gpt-4o mini')) usdPer1kTokens = 0.0006
  else if (key.includes('gpt-4o')) usdPer1kTokens = 0.007
  else if (key.includes('gpt-4.1')) usdPer1kTokens = 0.008
  else if (key.includes('gemini') && key.includes('flash')) usdPer1kTokens = 0.00035
  else if (key.includes('gemini')) usdPer1kTokens = 0.001
  else if (key.includes('claude') && key.includes('haiku')) usdPer1kTokens = 0.0012
  else if (key.includes('claude')) usdPer1kTokens = 0.006
  else if (key.includes('mistral')) usdPer1kTokens = 0.002
  else if (key.includes('groq') || key.includes('llama-3.1-8b') || key.includes('docscan-free')) usdPer1kTokens = 0

  return (tokens / 1000) * usdPer1kTokens
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const rangeParam = request.nextUrl.searchParams.get('range')
    const range: TimeRange = rangeParam === '24h' || rangeParam === '30d' ? rangeParam : '7d'
    const startDate = getRangeStart(range)

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const db = createServerClientForToken(token) || supabaseServer

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { data, error } = await db
      .from('queries')
      .select('ai_provider, ai_model, tokens_used, processing_time_ms, response, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    const { data: pricingRows, error: pricingError } = await db
      .from('ai_provider_settings')
      .select('provider_name, model_name, cost_per_1k_tokens')
      .eq('user_id', user.id)
      .not('cost_per_1k_tokens', 'is', null)

    if (error) {
      console.error('Error fetching usage rows:', error)
      return NextResponse.json({ error: 'Failed to fetch usage metrics' }, { status: 500 })
    }

    if (pricingError) {
      console.warn('Failed to fetch pricing overrides, using fallback heuristics:', pricingError)
    }

    const rows = (data || []) as UsageRow[]
    const pricingMap = new Map<string, number>()

    ;((pricingRows || []) as PricingRow[]).forEach((row) => {
      if (typeof row.cost_per_1k_tokens !== 'number' || row.cost_per_1k_tokens < 0) {
        return
      }

      const providerKey = normalizeKey(row.provider_name)
      const modelKey = normalizeKey(row.model_name)
      if (!modelKey) return

      pricingMap.set(`${providerKey}::${modelKey}`, row.cost_per_1k_tokens)
      if (!pricingMap.has(`*::${modelKey}`)) {
        pricingMap.set(`*::${modelKey}`, row.cost_per_1k_tokens)
      }
    })

    const totalRequests = rows.length
    const totalTokens = rows.reduce((sum, row) => sum + (row.tokens_used || 0), 0)

    let successCount = 0
    let responseTimeSum = 0
    let responseTimeCount = 0
    let estimatedCost = 0

    const providerStats = new Map<string, { requests: number; tokens: number; cost: number }>()

    rows.forEach((row) => {
      const tokens = row.tokens_used || 0
      const provider = normalizeProviderName(row.ai_provider, row.ai_model)
      const cost = estimateCostUSD(row.ai_provider, row.ai_model, tokens, pricingMap)

      if (isSuccessfulResponse(row)) {
        successCount += 1
      }

      if (typeof row.processing_time_ms === 'number' && row.processing_time_ms > 0) {
        responseTimeSum += row.processing_time_ms
        responseTimeCount += 1
      }

      estimatedCost += cost

      const current = providerStats.get(provider) || { requests: 0, tokens: 0, cost: 0 }
      current.requests += 1
      current.tokens += tokens
      current.cost += cost
      providerStats.set(provider, current)
    })

    const providerBreakdown = Array.from(providerStats.entries())
      .map(([provider, values]) => ({
        provider,
        requests: values.requests,
        tokens: values.tokens,
        cost: Number(values.cost.toFixed(4)),
        percentage: totalRequests > 0 ? Number(((values.requests / totalRequests) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.requests - a.requests)

    const topProvider = providerBreakdown[0]?.provider || 'N/A'
    const successRate = totalRequests > 0 ? Number(((successCount / totalRequests) * 100).toFixed(1)) : 0
    const averageResponseTime = responseTimeCount > 0
      ? Number((responseTimeSum / responseTimeCount / 1000).toFixed(2))
      : 0

    const dailyUsage: Array<{ date: string; label: string; requests: number; tokens: number; cost: number }> = []

    if (range === '24h') {
      const now = new Date()
      const bucketByHour = new Map<string, { requests: number; tokens: number; cost: number }>()

      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000)
        const key = `${d.toISOString().slice(0, 13)}:00:00.000Z`
        bucketByHour.set(key, { requests: 0, tokens: 0, cost: 0 })
      }

      rows.forEach((row) => {
        const d = new Date(row.created_at)
        d.setMinutes(0, 0, 0)
        const key = d.toISOString().slice(0, 13) + ':00:00.000Z'
        const bucket = bucketByHour.get(key)
        if (!bucket) return
        const tokens = row.tokens_used || 0
        bucket.requests += 1
        bucket.tokens += tokens
        bucket.cost += estimateCostUSD(row.ai_provider, row.ai_model, tokens, pricingMap)
      })

      Array.from(bucketByHour.entries()).forEach(([isoHour, bucket]) => {
        const d = new Date(isoHour)
        dailyUsage.push({
          date: isoHour,
          label: d.toLocaleTimeString('en-US', { hour: 'numeric' }),
          requests: bucket.requests,
          tokens: bucket.tokens,
          cost: Number(bucket.cost.toFixed(4)),
        })
      })
    } else {
      const days = range === '30d' ? 30 : 7
      const now = new Date()
      const bucketByDate = new Map<string, { requests: number; tokens: number; cost: number }>()

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        bucketByDate.set(toISODate(d), { requests: 0, tokens: 0, cost: 0 })
      }

      rows.forEach((row) => {
        const key = row.created_at.slice(0, 10)
        const bucket = bucketByDate.get(key)
        if (!bucket) return
        const tokens = row.tokens_used || 0
        bucket.requests += 1
        bucket.tokens += tokens
        bucket.cost += estimateCostUSD(row.ai_provider, row.ai_model, tokens, pricingMap)
      })

      Array.from(bucketByDate.entries()).forEach(([date, bucket]) => {
        const d = new Date(date + 'T00:00:00Z')
        dailyUsage.push({
          date,
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          requests: bucket.requests,
          tokens: bucket.tokens,
          cost: Number(bucket.cost.toFixed(4)),
        })
      })
    }

    return NextResponse.json({
      totalRequests,
      totalTokens,
      estimatedCost: Number(estimatedCost.toFixed(4)),
      averageResponseTime,
      successRate,
      topProvider,
      dailyUsage,
      providerBreakdown,
    })
  } catch (error) {
    console.error('Usage analytics error:', error)
    return NextResponse.json({ error: 'Failed to load usage analytics' }, { status: 500 })
  }
}