interface RateLimitConfig {
  chatbotId: string
  ipAddress: string
  botPerMinute: number
  ipPerMinute: number
  botPerDay: number
}

interface RateLimitResult {
  allowed: boolean
  reason?: string
}

function toMinuteWindow(date: Date): string {
  const ms = Math.floor(date.getTime() / 60000) * 60000
  return new Date(ms).toISOString()
}

function toDayWindow(date: Date): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  ).toISOString()
}

async function incrementBucket(
  db: any,
  chatbotId: string,
  ipAddress: string,
  bucket: string,
  windowStart: string,
  limit: number
): Promise<RateLimitResult> {
  // Non-positive or invalid values are treated as unlimited for this bucket.
  if (!Number.isFinite(limit) || limit <= 0) {
    return { allowed: true }
  }

  const { data: existing, error: fetchError } = await db
    .from('chatbot_rate_limits')
    .select('id, request_count')
    .eq('chatbot_id', chatbotId)
    .eq('ip_address', ipAddress)
    .eq('bucket', bucket)
    .eq('window_start', windowStart)
    .maybeSingle()

  if (fetchError) {
    return { allowed: true, reason: 'Rate-limit storage unavailable (read)' }
  }

  if (!existing) {
    const { error: insertError } = await db.from('chatbot_rate_limits').insert({
      chatbot_id: chatbotId,
      ip_address: ipAddress,
      bucket,
      window_start: windowStart,
      request_count: 1,
    })

    if (insertError) {
      return { allowed: true, reason: 'Rate-limit storage unavailable (insert)' }
    }

    return { allowed: true }
  }

  if (existing.request_count >= limit) {
    return { allowed: false, reason: `${bucket} quota exceeded` }
  }

  const { error: updateError } = await db
    .from('chatbot_rate_limits')
    .update({
      request_count: existing.request_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  if (updateError) {
    return { allowed: true, reason: 'Rate-limit storage unavailable (update)' }
  }

  return { allowed: true }
}

export async function enforceStandardRateLimit(
  db: any,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date()
  const minuteWindow = toMinuteWindow(now)
  const dayWindow = toDayWindow(now)

  const botMinute = await incrementBucket(
    db,
    config.chatbotId,
    '*',
    'bot_minute',
    minuteWindow,
    config.botPerMinute
  )
  if (!botMinute.allowed) return botMinute

  const ipMinute = await incrementBucket(
    db,
    config.chatbotId,
    config.ipAddress,
    'ip_minute',
    minuteWindow,
    config.ipPerMinute
  )
  if (!ipMinute.allowed) return ipMinute

  const botDay = await incrementBucket(
    db,
    config.chatbotId,
    '*',
    'bot_day',
    dayWindow,
    config.botPerDay
  )
  if (!botDay.allowed) return botDay

  return { allowed: true }
}
