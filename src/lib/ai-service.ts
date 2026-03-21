import { encryptApiKey, decryptApiKey, isValidApiKey, maskApiKey, sanitizeError } from './crypto-utils'

export interface AIProvider {
  id?: string
  name: string
  type: 'google' | 'mistral' | 'lm-studio' | 'ollama' | 'open-router' | 'openai' | 'anthropic' | 'custom' | 'openai-compatible' | 'groq'
  baseUrl: string
  apiKey: string
  model: string
  isActive: boolean
  isConfigured: boolean
  models?: string[]
  maxTokens?: number
  temperature?: number
  topP?: number
}

export interface AIServiceConfig {
  provider: AIProvider
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: string
}

export class AIService {
  private static instance: AIService
  private providers: AIProvider[] = []

  private constructor() {
    this.loadProviders()
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  private async loadProviders() {
  }

  getActiveProvider(): AIProvider | null {
    return this.providers.find(p => p.isActive && (p.isConfigured || ['ollama', 'lm-studio'].includes(p.type))) || null
  }

  async loadProvidersFromDatabase(userId?: string) {
    try {
      if (typeof window !== 'undefined') {
        return
      }

      if (!userId) {
        return
      }

      const { supabaseServer } = await import('./supabase')
      
      if (!supabaseServer) {
        return
      }

      const { data: settings, error } = await supabaseServer
        .from('ai_provider_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        console.error('Failed to load AI providers from database:', error)
        return
      }

      if (!settings || settings.length === 0) {
        return
      }
      
      this.providers = settings.map(setting => {
        const rawName = (setting.provider_name || '').toString()
        const providerName = rawName.trim().toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-')

        const typeMapping: Record<string, AIProvider['type']> = {
          'google': 'google',
          'google-ai': 'google',
          'googleai': 'google',
          'google-llm': 'google',
          'gemini': 'google',
          'mistral': 'mistral',
          'lm-studio': 'lm-studio',
          'lmstudio': 'lm-studio',
          'ollama': 'ollama',
          'openrouter': 'open-router',
          'open-router': 'open-router',
          'openrouter.ai': 'open-router',
          'openai': 'openai',
          'chatgpt': 'openai',
          'gpt': 'openai',
          'anthropic': 'anthropic',
          'claude': 'anthropic',
          'openai-compatible': 'openai-compatible',
          'groq': 'groq',
          'custom': 'custom'
        }

        const mappedType: AIProvider['type'] =
          typeMapping[providerName] || typeMapping[providerName.replace(/\./g, '')] || 'custom'
        
        const defaultBaseUrls: Record<string, string> = {
          'google': 'https://generativelanguage.googleapis.com/v1beta',
          'mistral': 'https://api.mistral.ai/v1',
          'openai': 'https://api.openai.com/v1',
          'anthropic': 'https://api.anthropic.com/v1',
          'open-router': 'https://openrouter.ai/api/v1',
          'lm-studio': 'http://localhost:1234/v1',
          'ollama': 'http://localhost:11434/api',
          'openai-compatible': 'https://api.your-provider.com/v1',
          'groq': 'https://api.groq.com/openai/v1'
        }
        
        let decryptedApiKey = ''
        if (setting.api_key) {
          try {
            decryptedApiKey = decryptApiKey(setting.api_key)
          } catch (error) {
            console.error('Failed to decrypt API key for provider:', rawName, error)
            decryptedApiKey = ''
          }
        }
        
        return {
          id: setting.id,
          name: `${rawName} (${setting.model_name || ''})`,
          type: mappedType,
          apiKey: decryptedApiKey,
          baseUrl: setting.base_url || defaultBaseUrls[mappedType] || 'http://localhost:8080',
          model: setting.model_name || '',
          isActive: !!setting.is_active,
          isConfigured: !!decryptedApiKey,
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1.0
        } as AIProvider
      })
      
    } catch (error) {
      console.error('Failed to load AI providers from database:', error)
    }
  }

  getProviders(): AIProvider[] {
    return this.providers
  }

  async generateCompletion(config: AIServiceConfig): Promise<AIResponse> {
    const provider = config.provider
    
    if (provider.type === 'groq' && !provider.apiKey && process.env.GROQ_API_KEY) {
      provider.apiKey = process.env.GROQ_API_KEY
    }

    if (!provider.apiKey && !['ollama', 'lm-studio'].includes(provider.type)) {
      throw new Error('API key not configured for provider')
    }

    try {
      switch (provider.type) {
        case 'google':
          return this.callGoogleAI(config)
        case 'mistral':
          return this.callMistralAI(config)
        case 'lm-studio':
          return this.callLMStudio(config)
        case 'ollama':
          return this.callOllama(config)
        case 'open-router':
          return this.callOpenRouter(config)
        case 'openai':
        case 'openai-compatible':
        case 'groq':
          return this.callOpenAI(config)
        case 'anthropic':
          return this.callAnthropic(config)
        default:
          throw new Error(`Unsupported provider: ${provider.type}`)
      }
    } catch (error) {
      console.error(`AI Service error for ${provider.name}:`, error)
      throw error
    }
  }

  private async callGoogleAI(config: AIServiceConfig): Promise<AIResponse> {
    const { provider, prompt, systemPrompt, temperature = 0.7, maxTokens = 8192 } = config
    
    const url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`
    
    const contents: any[] = []
    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      })
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: provider.topP
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google AI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
      content,
      model: provider.model,
      provider: provider.name,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      }
    }
  }

  private async callMistralAI(config: AIServiceConfig): Promise<AIResponse> {
    const { provider, prompt, systemPrompt, temperature = 0.7, maxTokens = 8192 } = config
    
    const url = `${provider.baseUrl}/chat/completions`
    
    const messages: any[] = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: provider.topP
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Mistral AI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return {
      content,
      model: provider.model,
      provider: provider.name,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    }
  }

  private async callLMStudio(config: AIServiceConfig): Promise<AIResponse> {
    const { provider, prompt, systemPrompt, temperature = 0.7, maxTokens = 8192 } = config
    
    const url = `${provider.baseUrl}/chat/completions`
    
    const messages: any[] = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(provider.apiKey && { 'Authorization': `Bearer ${provider.apiKey}` })
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: provider.topP
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LM Studio API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return {
      content,
      model: provider.model,
      provider: provider.name,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    }
  }

  private async callOllama(config: AIServiceConfig): Promise<AIResponse> {
    const { provider, prompt, systemPrompt, temperature = 0.7 } = config
    
    const url = `${provider.baseUrl}/generate`
    
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature,
          top_p: provider.topP,
          num_predict: provider.maxTokens
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API error: ${error}`)
    }

    const data = await response.json()
    const content = data.response || ''

    return {
      content,
      model: provider.model,
      provider: provider.name,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    }
  }

  private async callOpenRouter(config: AIServiceConfig): Promise<AIResponse> {
    const { provider, prompt, systemPrompt, temperature = 0.7, maxTokens = 8192 } = config
    
    const url = `${provider.baseUrl}/chat/completions`
    
    const messages: any[] = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://docmind.app'),
        'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'DocMind'
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: provider.topP
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return {
      content,
      model: provider.model,
      provider: provider.name,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    }
  }

  private async callOpenAI(config: AIServiceConfig): Promise<AIResponse> {
    const { provider, prompt, systemPrompt, temperature = 0.7, maxTokens = 8192 } = config
    const url = `${provider.baseUrl}/chat/completions`
    const messages: any[] = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: prompt })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          top_p: provider.topP
        }),
        signal: controller.signal
      })
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err?.name === 'AbortError') {
        throw new Error(`Request timed out after 30s. The AI provider (${provider.name}) is not responding.`)
      }
      throw new Error(`Network error connecting to AI provider (${provider.name}): ${err?.message || 'Unknown error'}`)
    }
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      const isUpstream = errorText.includes('upstream request failed') || response.status === 502
      if (isUpstream) {
        throw new Error(`The AI provider "${provider.name}" is temporarily unavailable (upstream error). Please try again or switch to a different provider in Settings.`)
      }
      throw new Error(`AI API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    return {
      content,
      model: provider.model,
      provider: provider.name,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    }
  }

  private async callAnthropic(config: AIServiceConfig): Promise<AIResponse> {
    const { provider, prompt, systemPrompt, temperature = 0.7, maxTokens = 8192 } = config
    const url = `${provider.baseUrl}/messages`

    const messages: any[] = []
    if (systemPrompt) {
    }

    messages.push({ role: 'user', content: prompt })

    const body: any = {
      model: provider.model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }
    if (systemPrompt) {
      body.system = systemPrompt
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${error}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || data.output_text || ''
    return {
      content,
      model: provider.model,
      provider: provider.name,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      }
    }
  }

  async testConnection(provider: AIProvider): Promise<boolean> {
    try {
      await this.generateCompletion({
        provider,
        prompt: 'Hello, this is a test message.',
        systemPrompt: 'You are a helpful assistant.',
        maxTokens: 10
      })
      return true
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  

  async fetchModels(provider: AIProvider): Promise<string[]> {
    if (!provider.baseUrl) return provider.models || []

    if (provider.type === 'groq' && !provider.apiKey && process.env.GROQ_API_KEY) {
      provider.apiKey = process.env.GROQ_API_KEY
    }

    const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 5000) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetch(url, { ...options, signal: controller.signal })
        clearTimeout(timeoutId)
        return res
      } catch (e) {
        clearTimeout(timeoutId)
        throw e
      }
    }

    if (provider.type === 'ollama') {
      try {
        const baseUrl = provider.baseUrl.endsWith('/api') ? provider.baseUrl.replace('/api', '') : provider.baseUrl
        const res = await fetchWithTimeout(`${baseUrl}/api/tags`, {}, 3000)
        if (res.ok) {
          const data = await res.json()
          return data.models?.map((m: any) => m.name) || []
        }
      } catch {
      }
    } else if (provider.type === 'lm-studio') {
      try {
        const modelsUrl = `${provider.baseUrl}/models`
        const res = await fetchWithTimeout(modelsUrl, {
          headers: provider.apiKey ? { 'Authorization': `Bearer ${provider.apiKey}` } : {}
        }, 3000)
        if (res.ok) {
          const data = await res.json()
          return data.data?.map((m: any) => m.id) || []
        }
      } catch {
      }
    } else if (provider.type === 'open-router') {
      try {
        const res = await fetchWithTimeout(`${provider.baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://docmind.app',
            'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'DocMind'
          }
        })
        if (res.ok) {
          const data = await res.json()
          return data.data?.map((m: any) => m.id) || []
        }
      } catch {
      }
    } else if (provider.type === 'google') {
      try {
        const res = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${provider.apiKey}`)
        if (res.ok) {
          const data = await res.json()
          return data.models?.map((m: any) => m.name.replace('models/', '')) || []
        }
      } catch {
      }
    } else if (['openai', 'mistral', 'openai-compatible', 'groq'].includes(provider.type)) {
      try {
        const baseUrl = provider.baseUrl
        const modelsUrl = baseUrl.endsWith('/chat/completions') 
          ? baseUrl.replace('/chat/completions', '/models')
          : `${baseUrl}/models`

        const res = await fetchWithTimeout(modelsUrl, {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`
          }
        })
        if (res.ok) {
          const data = await res.json()
          return data.data?.map((m: any) => m.id) || []
        }
      } catch {
      }
    } else if (provider.type === 'anthropic') {
      return ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-latest', 'claude-3-sonnet-20240229']
    }

    return provider.models || []
  }

  updateProviders(providers: AIProvider[]) {
    this.providers = providers
  }
}