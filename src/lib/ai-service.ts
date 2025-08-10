import { encryptApiKey, decryptApiKey, isValidApiKey, maskApiKey, sanitizeError } from './crypto-utils'

// Minimal provider type used by the AI service
export interface AIProvider {
  id?: string
  name: string
  type: 'google' | 'mistral' | 'lm-studio' | 'ollama' | 'open-router' | 'openai' | 'anthropic' | 'custom'
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
    try {
      // Check if we're in browser environment
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('aiProviders')
        if (saved) {
          const providers = JSON.parse(saved)
          // Decrypt API keys when loading
          this.providers = providers.map((p: AIProvider) => ({
            ...p,
            apiKey: decryptApiKey(p.apiKey)
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load AI providers:', error)
    }
  }

  getActiveProvider(): AIProvider | null {
    return this.providers.find(p => p.isActive && (p.isConfigured || ['ollama', 'lm-studio'].includes(p.type))) || null
  }

  async loadProvidersFromDatabase(userId?: string) {
    try {
      // Only load from database on server side
      if (typeof window !== 'undefined') {
        return
      }

      if (!userId) {
        console.log('No user ID provided, cannot load AI providers')
        return
      }

      // Import Supabase client
      const { supabaseServer } = await import('./supabase')
      
      if (!supabaseServer) {
        console.log('Supabase not configured, cannot load AI providers')
        return
      }

      // Get AI provider settings from Supabase
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
        console.log('No AI provider settings found for user')
        return
      }
      
      // Convert database settings to AIProvider format
      this.providers = settings.map(setting => {
        // Map database provider names to AI service type strings
        const typeMapping: Record<string, AIProvider['type']> = {
          'google': 'google',
          'mistral': 'mistral',
          'lm-studio': 'lm-studio',
          'ollama': 'ollama',
          'openrouter': 'open-router',
          'open-router': 'open-router',
          'openai': 'openai',
          'anthropic': 'anthropic',
          'custom': 'custom'
        }

        const providerName = setting.provider_name.toLowerCase()
        const mappedType: AIProvider['type'] = typeMapping[providerName] || 'custom'
        
        // Set default base URLs based on provider type
        const defaultBaseUrls: Record<string, string> = {
          'google': 'https://generativelanguage.googleapis.com/v1beta',
          'mistral': 'https://api.mistral.ai/v1',
          'openai': 'https://api.openai.com/v1',
          'anthropic': 'https://api.anthropic.com/v1',
          'open-router': 'https://openrouter.ai/api/v1',
          'lm-studio': 'http://localhost:1234/v1',
          'ollama': 'http://localhost:11434/api'
        }
        
        return {
          id: setting.id,
          name: `${setting.provider_name} (${setting.model_name || ''})`,
          type: mappedType,
          apiKey: setting.api_key || '',
          baseUrl: defaultBaseUrls[mappedType] || 'http://localhost:8080',
          model: setting.model_name || '',
          isActive: !!setting.is_active,
          isConfigured: !!setting.api_key,
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1.0
        } as AIProvider
      })
      
      console.log(`Loaded ${this.providers.length} AI providers from database`)
      
    } catch (error) {
      console.error('Failed to load AI providers from database:', error)
    }
  }

  getProviders(): AIProvider[] {
    return this.providers
  }

  async generateCompletion(config: AIServiceConfig): Promise<AIResponse> {
    const provider = config.provider
    
    // Only require API key for cloud providers, not local ones
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
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'DocuMind AI'
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
      throw new Error(`OpenAI API error: ${error}`)
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
    // Anthropic Messages API v1
    const url = `${provider.baseUrl}/messages`

    const messages: any[] = []
    if (systemPrompt) {
      // Anthropic uses a top-level system field rather than a system role message
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

  

  updateProviders(providers: AIProvider[]) {
    // Encrypt API keys before saving
    const encryptedProviders = providers.map(p => ({
      ...p,
      apiKey: encryptApiKey(p.apiKey)
    }))
    this.providers = providers
    localStorage.setItem('aiProviders', JSON.stringify(encryptedProviders))
  }
}