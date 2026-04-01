// ── Document ──────────────────────────────────────────────────────────────────
export interface Document {
  id: string
  name: string
  type: string
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
  uploadDate: string
  size: string
  category?: string
  tags?: string[]
  analysisCount?: number
  queryCount?: number
  progress?: number
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface MessageReference {
  documentId: string
  documentName: string
  snippet: string
  score: number
}

export interface MessageHighlight {
  text: string
  reason: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  docsUsed?: string[]
  references?: MessageReference[]
  highlights?: MessageHighlight[]
  provider?: string
  model?: string
  tokensUsed?: number
}

export interface StreamDebugEntry {
  id: number
  timestamp: string
  message: string
}

// ── Upload ────────────────────────────────────────────────────────────────────
export type UploadResponse = {
  id: string
  name: string
  type: string
  size: string
  status: 'PROCESSING'
  uploadDate: string
  downloadURL: string
  storageRef: string
  processingStrategy: 'go' | 'node'
}

// ── AI Provider ───────────────────────────────────────────────────────────────
export interface AIProvider {
  id: string
  name: string
  type:
    | 'google'
    | 'mistral'
    | 'lm-studio'
    | 'ollama'
    | 'open-router'
    | 'openai'
    | 'anthropic'
    | 'custom'
    | 'openai-compatible'
    | 'groq'
  baseUrl: string
  apiKey: string
  model: string
  isActive: boolean
  isConfigured: boolean
  lastTested?: string
  testStatus?: 'success' | 'error' | 'pending'
  errorMessage?: string
  models: string[]
  maxTokens?: number
  temperature?: number
  topP?: number
  costPer1kTokens?: number
  description: string
  iconType: 'brain' | 'zap' | 'server' | 'shield' | 'globe'
  dirtyApiKey?: boolean
  hasStoredApiKey?: boolean
  maskedApiKey?: string
}

export interface ConfiguredProvider {
  id: string
  name: string
}

// ── Chatbot ───────────────────────────────────────────────────────────────────
export interface ChatbotItem {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  linkedDocumentCount: number
  hostedUrl: string
  created_at: string
}

export interface ChatbotDetails {
  id: string
  name: string
  description: string | null
  slug: string
  system_prompt: string | null
  refusal_message: string
  fallback_message: string
  is_active: boolean
  allowed_origins: string[]
  requests_per_minute_bot: number
  requests_per_minute_ip: number
  requests_per_day_bot: number
  response_style: 'concise' | 'balanced' | 'detailed'
  include_references: boolean
  include_highlights: boolean
  use_chat_memory: boolean
  auto_regenerate_on_dislike: boolean
  documentIds: string[]
}

export interface UserResponsePreferences {
  response_style: 'concise' | 'balanced' | 'detailed'
  highlight_enabled: boolean
  reference_enabled: boolean
  memory_learning_enabled: boolean
  auto_regenerate_on_dislike: boolean
  preview_selection_enabled: boolean
}

export interface SecretItem {
  id: string
  key_name?: string
  token_name?: string
  key_prefix?: string
  token_prefix?: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  last_used_at?: string | null
}

// ── Analysis ──────────────────────────────────────────────────────────────────
export interface AnalysisResult {
  id: string
  type: 'INSIGHT' | 'RISK' | 'OPPORTUNITY' | 'COMPLIANCE'
  title: string
  description: string
  confidence: number
  document: { id: string; name: string; type: string; category: string } | null
  documents: string[]
  timestamp: string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH'
  metadata: any
}

export interface AnalysisStats {
  total: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  averageConfidence: number
  recentCount: number
  totalDocuments: number
  completedDocuments: number
  totalQueries: number
  topDocuments: { id: string; name: string; queries: number }[]
  queriesPerDay: { date: string; count: number }[]
}

export interface DocumentSummary {
  id: string
  name: string
  type: string
  category: string
  status: string
  analysisCount: number
  queryCount: number
  uploadDate: string
}
