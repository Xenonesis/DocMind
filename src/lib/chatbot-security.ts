import { createHash, randomBytes } from 'crypto'
import type { NextRequest } from 'next/server'

interface SecretRecord {
  id: string
  chatbot_id: string
  expires_at: string | null
  is_active: boolean
  allowed_origins?: string[]
  key_name?: string
  token_name?: string
  chatbots?: {
    id: string
    user_id: string
    slug: string
    name: string
    system_prompt: string | null
    refusal_message: string
    fallback_message: string
    is_active: boolean
    model_override: string | null
    temperature: number
    max_tokens: number
    requests_per_minute_bot: number
    requests_per_minute_ip: number
    requests_per_day_bot: number
  }
}

export function toSlug(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return base || `bot-${Date.now()}`
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  return request.headers.get('x-real-ip') || '0.0.0.0'
}

export function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function buildSecret(prefix: string): { plain: string; hash: string; shortPrefix: string } {
  const plain = `${prefix}_${randomBytes(24).toString('hex')}`
  return {
    plain,
    hash: hashSecret(plain),
    shortPrefix: plain.slice(0, 12),
  }
}

export function generateApiKey() {
  return buildSecret('cbk')
}

export function generateEmbedToken() {
  return buildSecret('cbt')
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

export async function verifyApiKey(db: any, rawApiKey: string): Promise<SecretRecord | null> {
  const keyHash = hashSecret(rawApiKey)
  const { data, error } = await db
    .from('chatbot_api_keys')
    .select('id, chatbot_id, expires_at, is_active, key_name, chatbots!inner(id, user_id, slug, name, system_prompt, refusal_message, fallback_message, is_active, model_override, temperature, max_tokens, requests_per_minute_bot, requests_per_minute_ip, requests_per_day_bot)')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null
  if (!data.chatbots?.is_active || isExpired(data.expires_at)) return null
  return data as SecretRecord
}

export async function verifyEmbedToken(db: any, rawToken: string): Promise<SecretRecord | null> {
  const tokenHash = hashSecret(rawToken)
  const { data, error } = await db
    .from('chatbot_embed_tokens')
    .select('id, chatbot_id, expires_at, is_active, token_name, allowed_origins, chatbots!inner(id, user_id, slug, name, system_prompt, refusal_message, fallback_message, is_active, model_override, temperature, max_tokens, requests_per_minute_bot, requests_per_minute_ip, requests_per_day_bot)')
    .eq('token_hash', tokenHash)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !data) return null
  if (!data.chatbots?.is_active || isExpired(data.expires_at)) return null
  return data as SecretRecord
}
