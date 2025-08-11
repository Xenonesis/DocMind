// Supabase collection types

export interface User {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface AiProviderSetting {
  id: string
  userId: string
  provider: AiProvider
  apiKey: string
  baseUrl?: string
  model?: string
  isActive: boolean
  config?: string
  createdAt: Date
  updatedAt: Date
}

export enum AiProvider {
  GOOGLE_AI = 'GOOGLE_AI',
  MISTRAL = 'MISTRAL',
  LM_STUDIO = 'LM_STUDIO',
  OLLAMA = 'OLLAMA',
  OPENROUTER = 'OPENROUTER',
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  CUSTOM = 'CUSTOM'
}

export interface Document {
  id: string
  userId: string
  name: string
  type: string
  size: string
  status: DocumentStatus
  content?: string
  metadata?: string
  uploadDate: Date
  processedAt?: Date
  category?: string
  tags?: string
  progress?: number // For upload progress tracking
  createdAt: Date
  updatedAt: Date
}

export interface Analysis {
  id: string
  type: AnalysisType
  title: string
  description: string
  confidence: number
  severity?: Severity
  documentId: string
  documents?: string
  timestamp: Date
  metadata?: string
  createdAt: Date
  updatedAt: Date
}

export interface Query {
  id: string
  query: string
  status: QueryStatus
  response?: string
  results?: number
  documentIds?: string
  timestamp: Date
  metadata?: string
  createdAt: Date
  updatedAt: Date
}

export enum DocumentStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum AnalysisType {
  INSIGHT = 'INSIGHT',
  RISK = 'RISK',
  OPPORTUNITY = 'OPPORTUNITY',
  COMPLIANCE = 'COMPLIANCE'
}

export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum QueryStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}


