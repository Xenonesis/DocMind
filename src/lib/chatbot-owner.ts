import { NextRequest } from 'next/server'
import { createServerClientForToken, supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'
import { toSlug } from '@/lib/chatbot-security'

export interface OwnerContext {
  db: any
  user: {
    id: string
    email: string
    name: string
  }
}

export async function getOwnerContext(request: NextRequest): Promise<OwnerContext | null> {
  const user = await getAuthenticatedUser(request)
  if (!user) return null

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
  const db = createServerClientForToken(token) || supabaseServer

  if (!db) {
    throw new Error('Database not configured')
  }

  return { db, user }
}

export async function buildUniqueSlug(db: any, userId: string, rawName: string) {
  const base = toSlug(rawName)

  const { data: existing, error } = await db
    .from('chatbots')
    .select('slug')
    .eq('user_id', userId)
    .like('slug', `${base}%`)

  if (error || !existing || existing.length === 0) {
    return base
  }

  const set = new Set(existing.map((item: { slug: string }) => item.slug))
  if (!set.has(base)) return base

  for (let i = 2; i < 2000; i++) {
    const candidate = `${base}-${i}`
    if (!set.has(candidate)) return candidate
  }

  return `${base}-${Date.now()}`
}

export async function validateOwnerDocumentIds(db: any, userId: string, documentIds: string[]) {
  if (!documentIds || documentIds.length === 0) {
    return []
  }

  const { data, error } = await db
    .from('documents')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'COMPLETED')
    .in('id', documentIds)

  if (error) {
    throw new Error('Failed to validate document selection')
  }

  const validIds = (data || []).map((doc: { id: string }) => doc.id)
  const invalidIds = documentIds.filter((id) => !validIds.includes(id))
  if (invalidIds.length > 0) {
    throw new Error('One or more selected documents are invalid')
  }

  return validIds
}
