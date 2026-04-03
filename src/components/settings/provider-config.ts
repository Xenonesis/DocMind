import type { AIProvider } from '@/types'

// ── Default Providers ─────────────────────────────────────────────────────────
export const defaultProviders: Omit<AIProvider, 'id'>[] = [
  {
    name: 'Google Gemini',
    type: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: '',
    model: 'gemini-2.5-flash',
    isActive: true,
    isConfigured: false,
    models: [],
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: "Google's Gemini 2.5/2.0/1.5 models for reasoning and multimodal understanding.",
    iconType: 'brain',
  },
  {
    name: 'Mistral AI',
    type: 'mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKey: '',
    model: 'mistral-large-latest',
    isActive: false,
    isConfigured: false,
    models: [],
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: "Mistral's high-performance language models.",
    iconType: 'zap',
  },
  {
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    isActive: false,
    isConfigured: false,
    models: [],
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: "OpenAI's GPT models for chat and reasoning.",
    iconType: 'brain',
  },
  {
    name: 'Anthropic Claude',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    model: 'claude-3-5-sonnet-latest',
    isActive: false,
    isConfigured: false,
    models: [
      'claude-opus-4-0',
      'claude-sonnet-4-0',
      'claude-3-7-sonnet-latest',
      'claude-3-5-haiku-latest',
    ],
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: "Anthropic's Claude 3 family of models.",
    iconType: 'shield',
  },
  {
    name: 'LM Studio',
    type: 'lm-studio',
    baseUrl: 'http://localhost:1234/v1',
    apiKey: '',
    model: 'local-model',
    isActive: false,
    isConfigured: false,
    models: [],
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: 'Run local AI models using LM Studio.',
    iconType: 'server',
  },
  {
    name: 'Ollama',
    type: 'ollama',
    baseUrl: 'http://localhost:11434/api',
    apiKey: '',
    model: 'llama2',
    isActive: false,
    isConfigured: false,
    models: [],
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: 'Run local AI models using Ollama.',
    iconType: 'shield',
  },
  {
    name: 'OpenRouter',
    type: 'open-router',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'anthropic/claude-3.5-sonnet',
    isActive: false,
    isConfigured: false,
    models: [],
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: 'Access multiple AI models through OpenRouter.',
    iconType: 'globe',
  },
  {
    name: 'OpenAI Compatible API',
    type: 'openai-compatible',
    baseUrl: 'https://api.your-provider.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    isActive: false,
    isConfigured: false,
    models: ['gpt-3.5-turbo', 'gpt-4', 'custom-model'],
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: 'Connect to any custom OpenAI-compatible endpoint.',
    iconType: 'server',
  },
  {
    name: 'DocScan Glm-5 (free)',
    type: 'openai-compatible',
    baseUrl: 'https://api.us-west-2.modal.direct/v1',
    apiKey: '',
    model: 'zai-org/GLM-5-FP8',
    isActive: false,
    isConfigured: false,
    models: ['zai-org/GLM-5-FP8'],
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description:
      'Free built-in provider powered by DocScan. No API key needed — just activate and use!',
    iconType: 'zap',
  },
]

// ── Type Mapping ──────────────────────────────────────────────────────────────
export function mapRawProviderType(raw: string): AIProvider['type'] {
  const upper = raw.toUpperCase()
  if (upper === 'OPENROUTER') return 'open-router'
  if (upper === 'GOOGLE_AI') return 'google'
  if (upper === 'LM_STUDIO') return 'lm-studio'
  if (upper === 'OPENAI_COMPATIBLE') return 'openai-compatible'
  if (upper === 'GROQ') return 'groq'
  return upper.toLowerCase().replace(/_/g, '-') as AIProvider['type']
}

export function mapTypeToServerEnum(type: AIProvider['type']): string {
  switch (type) {
    case 'open-router':
      return 'OPENROUTER'
    case 'lm-studio':
      return 'LM_STUDIO'
    case 'google':
      return 'GOOGLE_AI'
    case 'mistral':
      return 'MISTRAL'
    case 'ollama':
      return 'OLLAMA'
    case 'openai':
      return 'OPENAI'
    case 'anthropic':
      return 'ANTHROPIC'
    case 'openai-compatible':
      return 'OPENAI_COMPATIBLE'
    case 'groq':
      return 'GROQ'
    default:
      return type?.toUpperCase().replace(/-/g, '_') || 'CUSTOM'
  }
}

export function buildProviderName(type: string, model: string, id?: string): string {
  if (type === 'groq') return `DocScan ${model || 'model name'} from groq (free)`
  if (id?.startsWith('docscan-free-')) {
    switch (id) {
      case 'docscan-free-glm':
        return 'DocScan Glm-5 (free)'
      case 'docscan-free-llama':
        return 'DocScan Llama-3 (free)'
      case 'docscan-free-qwen':
        return 'DocScan Qwen-2.5 (free)'
    }
  }
  return `${type} (${model || ''})`
}

// ── Status Helpers ────────────────────────────────────────────────────────────
export function getProviderStatus(provider: AIProvider): string {
  if (!provider.isConfigured) return 'not_configured'
  if (provider.testStatus === 'success') return 'connected'
  if (provider.testStatus === 'error') return 'error'
  if (provider.testStatus === 'pending') return 'testing'
  return 'needs_test'
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
    case 'error':
      return 'bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'
    case 'testing':
      return 'bg-amber-100/50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50'
    case 'needs_test':
      return 'bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'
    default:
      return 'bg-secondary text-muted-foreground border-transparent'
  }
}

// ── Serialization ─────────────────────────────────────────────────────────────
export function serializeProviderPayload(p: AIProvider) {
  return {
    provider: mapTypeToServerEnum(p.type),
    apiKey: p.apiKey ?? '',
    baseUrl: p.baseUrl,
    model: p.model,
    isActive: !!p.isActive,
    config: {
      temperature: p.temperature ?? 0.7,
      maxTokens: p.maxTokens ?? 1000,
      topP: p.topP ?? 1.0,
      costPer1kTokens: typeof p.costPer1kTokens === 'number' ? p.costPer1kTokens : null,
    },
  }
}

export function mapServerDataToProvider(s: any, index: number): AIProvider {
  const mappedType = mapRawProviderType(s.provider || 'custom')
  const defaults = defaultProviders.find((d) => d.type === mappedType)
  const pName = buildProviderName(mappedType, s.model, s.id)

  return {
    id: s.id || `provider-${index}`,
    name: pName,
    type: mappedType,
    baseUrl: s.baseUrl || (defaults?.baseUrl ?? ''),
    apiKey: s.apiKey || '',
    hasStoredApiKey: !!s.hasApiKey,
    maskedApiKey: s.maskedApiKey || '',
    model: s.model || (defaults?.models?.[0] ?? ''),
    isActive: !!s.isActive,
    isConfigured: !!s.hasApiKey || !!(s.apiKey && s.apiKey.length > 0),
    lastTested: undefined,
    testStatus: undefined,
    errorMessage: undefined,
    models: defaults?.models || [],
    maxTokens: s.config?.maxTokens ?? defaults?.maxTokens ?? 1000,
    temperature: s.config?.temperature ?? defaults?.temperature ?? 0.7,
    topP: s.config?.topP ?? defaults?.topP ?? 1.0,
    costPer1kTokens: typeof s.costPer1kTokens === 'number' ? s.costPer1kTokens : undefined,
    description: defaults?.description || 'Configured provider',
    iconType: defaults?.iconType || 'brain',
    dirtyApiKey: false,
  }
}
