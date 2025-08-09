import { isSupabaseConfigured, supabaseServer } from './supabase'
import {
  User,
  AiProviderSetting,
  Document,
  Analysis,
  Query as QueryType
} from './supabase-types'

// Table names
export const TABLES = {
  USERS: 'users',
  AI_PROVIDER_SETTINGS: 'ai_provider_settings',
  DOCUMENTS: 'documents',
  ANALYSES: 'analyses',
  QUERIES: 'queries'
} as const

function assertSupabase() {
  if (!isSupabaseConfigured || !supabaseServer) {
    throw new Error('Supabase is not configured')
  }
}

async function handle<T>(result: { data: T | null; error: any }) {
  if (result.error) throw result.error
  return result.data as T
}

function toSnakeCaseKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

function toCamelCaseKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function toSnake<T>(obj: any): any {
  if (obj == null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj.toISOString()
  if (Array.isArray(obj)) return obj.map(toSnake)
  const out: any = {}
  Object.keys(obj).forEach((k) => {
    out[toSnakeCaseKey(k)] = toSnake(obj[k])
  })
  return out
}

function toCamel<T>(obj: any): any {
  if (obj == null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(toCamel)
  const out: any = {}
  Object.keys(obj).forEach((k) => {
    out[toCamelCaseKey(k)] = toCamel(obj[k])
  })
  return out
}

function reviveDates<T>(obj: any): any {
  if (obj == null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(reviveDates)
  const out: any = { ...obj }
  const dateLikeKeys = ['createdAt', 'updatedAt', 'uploadDate', 'processedAt', 'timestamp']
  for (const key of dateLikeKeys) {
    if (key in out && typeof out[key] === 'string' && out[key] !== '{}') {
      try {
        const d = new Date(out[key])
        if (!isNaN(d.getTime())) {
          out[key] = d
        } else {
          // If invalid date, set to current date
          out[key] = new Date()
        }
      } catch (e) {
        // If date parsing fails, set to current date
        out[key] = new Date()
      }
    } else if (key in out && (out[key] === '{}' || typeof out[key] === 'object')) {
      // Handle malformed timestamps
      out[key] = new Date()
    }
  }
  return out
}

export class SupabaseService<T extends { id: string }> {
  constructor(private tableName: string) {}

  async create(data: Omit<T, 'id'>): Promise<string> {
    assertSupabase()
    const { data: rows, error } = await supabaseServer!
      .from(this.tableName)
      .insert(toSnake(data) as any)
      .select('id')
      .single()
    if (error) throw error
    return (rows as any).id
  }

  async getById(id: string): Promise<T | null> {
    assertSupabase()
    const { data, error } = await supabaseServer!
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return (data ? (reviveDates(toCamel(data)) as any) : null)
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    assertSupabase()
    const { error } = await supabaseServer!
      .from(this.tableName)
      .update(toSnake(data) as any)
      .eq('id', id)
    if (error) throw error
  }

  async delete(id: string): Promise<void> {
    assertSupabase()
    const { error } = await supabaseServer!
      .from(this.tableName)
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  async getAll(): Promise<T[]> {
    assertSupabase()
    const { data, error } = await supabaseServer!
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return reviveDates(toCamel(data)) as T[]
  }

  async getWhere(field: string, operator: any, value: any): Promise<T[]> {
    assertSupabase()
    let qb = supabaseServer!.from(this.tableName).select('*')
    const column = toSnakeCaseKey(field)

    // Basic operator mapping
    switch (operator) {
      case '==':
        qb = qb.eq(column, value)
        break
      case '!=':
        qb = qb.neq(column, value)
        break
      case 'array-contains':
        // For JSON array columns stored as TEXT, we need to use a different approach
        // Use the LIKE operator to search within the JSON string
        qb = qb.like(column, `%"${value}"%`)
        break
      default:
        qb = qb.eq(column, value)
    }

    const { data, error } = await qb
    if (error) throw error
    return reviveDates(toCamel(data)) as T[]
  }
}

// Service instances
export const userService = new SupabaseService<User>(TABLES.USERS)
export const aiProviderService = new SupabaseService<AiProviderSetting>(TABLES.AI_PROVIDER_SETTINGS)
export const documentService = new SupabaseService<Document>(TABLES.DOCUMENTS)
export const analysisService = new SupabaseService<Analysis>(TABLES.ANALYSES)
export const queryService = new SupabaseService<QueryType>(TABLES.QUERIES)

// Specialized methods
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const rows = await userService.getWhere('email', '==', email)
  return rows[0] || null
}

export const getAiProviderSettingsByUserId = async (userId: string): Promise<AiProviderSetting[]> => {
  return aiProviderService.getWhere('userId', '==', userId)
}

export const getDocumentsByStatus = async (status: string): Promise<Document[]> => {
  return documentService.getWhere('status', '==', status)
}

export const getAnalysesByDocumentId = async (documentId: string): Promise<Analysis[]> => {
  return analysisService.getWhere('documentId', '==', documentId)
}


