'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Settings, 
  Key, 
  TestTube, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Shield,
  Zap,
  Brain,
  Cloud,
  Server,
  Globe,
  Eye,
  EyeOff,
  Activity,
  Clock
} from 'lucide-react'
import { isValidApiKey } from '@/lib/crypto-utils'
import { useToast } from '@/hooks/use-toast'

import { ApiUsageTracker } from '@/components/features/api-usage-tracker'

interface AIProvider {
  id: string
  name: string
  type: 'google' | 'mistral' | 'lm-studio' | 'ollama' | 'open-router' | 'openai' | 'anthropic' | 'custom' | 'openai-compatible' | 'groq'
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
  description: string
  iconType: 'brain' | 'zap' | 'server' | 'shield' | 'globe'
  // Track if user edited the API key so we know to send it to the server
  dirtyApiKey?: boolean
}

const defaultProviders: Omit<AIProvider, 'id'>[] = [
  {
    name: 'Google Gemini',
    type: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: '',
    model: 'gemini-2.5-flash',
    isActive: true,
    isConfigured: false,
    models: [], // fetched live on demand
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: 'Google\'s Gemini 2.5/2.0/1.5 models for reasoning and multimodal understanding.',
    iconType: 'brain'
  },
  {
    name: 'Mistral AI',
    type: 'mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKey: '',
    model: 'mistral-large-latest',
    isActive: false,
    isConfigured: false,
    models: [], // fetched live on demand
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: 'Mistral\'s high-performance language models.',
    iconType: 'zap'
  },
  {
    name: 'OpenAI',
    type: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    isActive: false,
    isConfigured: false,
    models: [], // fetched live on demand
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: 'OpenAI\'s GPT models for chat and reasoning.',
    iconType: 'brain'
  },
  {
    name: 'Anthropic Claude',
    type: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '',
    model: 'claude-3-5-sonnet-latest',
    isActive: false,
    isConfigured: false,
    models: ['claude-opus-4-0', 'claude-sonnet-4-0', 'claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest'], // Anthropic has no public models endpoint
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: 'Anthropic\'s Claude 3 family of models.',
    iconType: 'shield'
  },
  {
    name: 'LM Studio',
    type: 'lm-studio',
    baseUrl: 'http://localhost:1234/v1',
    apiKey: '',
    model: 'local-model',
    isActive: false,
    isConfigured: false,
    models: [], // fetched live from LM Studio
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: 'Run local AI models using LM Studio.',
    iconType: 'server'
  },
  {
    name: 'Ollama',
    type: 'ollama',
    baseUrl: 'http://localhost:11434/api',
    apiKey: '',
    model: 'llama2',
    isActive: false,
    isConfigured: false,
    models: [], // fetched live from Ollama
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: 'Run local AI models using Ollama.',
    iconType: 'shield'
  },
  {
    name: 'OpenRouter',
    type: 'open-router',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'anthropic/claude-3.5-sonnet',
    isActive: false,
    isConfigured: false,
    models: [], // fetched live from OpenRouter
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: 'Access multiple AI models through OpenRouter.',
    iconType: 'globe'
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
    iconType: 'server'
  },
  {
    name: 'DocScan Glm-5 (free)',
    type: 'openai-compatible',
    baseUrl: 'https://api.us-west-2.modal.direct/v1',
    apiKey: '', // injected from server at runtime
    model: 'zai-org/GLM-5-FP8',
    isActive: false,
    isConfigured: false,
    models: ['zai-org/GLM-5-FP8'],
    maxTokens: 4096,
    temperature: 0.7,
    topP: 0.9,
    description: 'Free built-in provider powered by DocScan. No API key needed — just activate and use!',
    iconType: 'zap'
  }
]

export function AiApiSettings() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({})
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    
    // Remove test filtering - show all configured providers

    const load = async () => {
      try {
        const { authenticatedRequest } = await import('@/lib/api-client')
        const [data, freeProviderRes] = await Promise.allSettled([
          authenticatedRequest('/api/settings'),
          fetch('/api/free-provider').then(r => r.ok ? r.json() : null)
        ])
        const settingsData = data.status === 'fulfilled' ? data.value : []
        const freeConfig = freeProviderRes.status === 'fulfilled' ? freeProviderRes.value : null
        
        // Map backend records to UI provider model
        let mapped: AIProvider[] = settingsData.map((s: any, index: number) => {
          const mappedType = (() => {
            const raw = (s.provider || 'custom').toString().toUpperCase()
            if (raw === 'OPENROUTER') return 'open-router'
            if (raw === 'GOOGLE_AI') return 'google'
            if (raw === 'LM_STUDIO') return 'lm-studio'
            if (raw === 'OPENAI_COMPATIBLE') return 'openai-compatible'
            if (raw === 'GROQ') return 'groq'
            return raw.toLowerCase().replace(/_/g, '-')
          })()
          const defaults = defaultProviders.find(d => d.type === mappedType)
          
          let pName = `${s.provider} (${s.model || ''})`
          if (mappedType === 'groq') {
            pName = `DocScan ${s.model || 'model name'} from groq (free)`
          }

          return {
            id: s.id || `provider-${index}`,
            name: pName,
            type: mappedType as AIProvider['type'],
            baseUrl: s.baseUrl || (defaults?.baseUrl ?? ''),
            apiKey: s.apiKey || '',
            model: s.model || (defaults?.models?.[0] ?? ''),
            isActive: !!s.isActive,
            isConfigured: !!(s.apiKey && s.apiKey.length > 0),
            lastTested: undefined,
            testStatus: undefined,
            errorMessage: undefined,
            models: defaults?.models || [],
            maxTokens: s.config?.maxTokens ?? defaults?.maxTokens ?? 1000,
            temperature: s.config?.temperature ?? defaults?.temperature ?? 0.7,
            topP: s.config?.topP ?? defaults?.topP ?? 1.0,
            description: defaults?.description || 'Configured provider',
            iconType: defaults?.iconType || 'brain',
            dirtyApiKey: false,
          }
        })

        // Inject DocScan Free providers from server config
        if (freeConfig) {
          const configs = Array.isArray(freeConfig) ? freeConfig : [freeConfig];
          // reverse so that the first one in the array becomes the first element due to unshifting
          for (const config of [...configs].reverse()) {
            const existingIndex = mapped.findIndex(m => m.baseUrl === config.baseUrl && m.type === config.type);
            if (existingIndex >= 0) {
              const savedModel = mapped[existingIndex].model;
              const isModelValid = config.models.length === 0 || config.models.includes(savedModel);

              mapped[existingIndex] = {
                ...mapped[existingIndex],
                id: config.id,
                apiKey: config.apiKey, // Ensure latest env key is used
                isConfigured: true,
                model: isModelValid ? savedModel : config.model, // Reset discarded models
                models: config.models.length > 0 ? config.models : mapped[existingIndex].models, // Keep dynamic models from backend if present
              };
            } else {
              mapped = [{
                ...config,
                dirtyApiKey: false,
              }, ...mapped];
            }
          }
        }

        // Always merge in default providers so all options are visible
        const existingTypes = new Set(mapped.map(m => m.type))
        const missingDefaults = defaultProviders
          .filter(d => !existingTypes.has(d.type))
          .map((d, idx) => ({ ...d, id: `provider-missing-${idx}` }))
        mapped = [...mapped, ...missingDefaults]

        // If no providers exist at all, start with defaults
        if (mapped.length === 0) {
          mapped = defaultProviders.map((p, index) => ({ ...p, id: `provider-${index}` }))
        }

        setProviders(mapped)
        const active = mapped.find(p => p.isActive)
        const firstId = active?.id || mapped[0]?.id || ''
        setSelectedProviderId(firstId)

        // Background auto-test and model fetch for all configured providers
        Promise.all(mapped.map(async (p) => {
          if (!p.apiKey && !['ollama', 'lm-studio'].includes(p.type) && !p.id.startsWith('docscan-free')) return;
          try {
            const { authenticatedRequest } = await import('@/lib/api-client')
            
            // Mark as testing
            setProviders(prev => prev.map(pp => pp.id === p.id ? { ...pp, testStatus: 'pending' } : pp))
            
            const [testResult, modelsResult] = await Promise.allSettled([
              authenticatedRequest('/api/test-connection', { method: 'POST', body: JSON.stringify({ provider: p }) }),
              authenticatedRequest('/api/models', { method: 'POST', body: JSON.stringify({ provider: p }) })
            ])
            
            const isTestSuccess = testResult.status === 'fulfilled' && testResult.value.success;
            const newModels = modelsResult.status === 'fulfilled' && modelsResult.value?.models?.length > 0 ? modelsResult.value.models : p.models;
            
            setProviders(prev => prev.map(pp => pp.id === p.id ? {
              ...pp,
              models: newModels,
              testStatus: isTestSuccess ? 'success' : 'error',
              lastTested: new Date().toISOString(),
              errorMessage: isTestSuccess ? undefined : (testResult.status === 'fulfilled' ? testResult.value.error : 'Connection fail'),
              isConfigured: isTestSuccess || pp.isConfigured
            } : pp))
          } catch(e) {}
        }))
        
        // Show success message if providers were loaded
        if (settingsData.length > 0) {
          toast({
            title: 'Settings loaded',
            description: `Loaded ${settingsData.length} AI provider configuration(s).`,
          })
        }
      } catch (error) {
        console.warn('Failed to load settings from server:', error)
        // Fallback to defaults if server fetch fails
        setProviders(defaultProviders.map((p, index) => ({ ...p, id: `provider-${index}` })))
        
        toast({
          title: 'Failed to load settings',
          description: 'Using default provider configurations. Your saved settings could not be loaded.',
          variant: 'destructive',
        })
      }
    }
    load()
  }, [])

  const saveProviders = async (newProviders: AIProvider[]) => {
    setProviders(newProviders)
    // Only save providers that have been configured (have API keys or are local providers)
    const providersToSave = newProviders.filter(p => 
      p.isConfigured || p.dirtyApiKey || ['ollama', 'lm-studio'].includes(p.type)
    )
    
    const payload = providersToSave.map(p => ({
      provider: (() => {
          switch (p.type) {
          case 'open-router': return 'OPENROUTER'
          case 'lm-studio': return 'LM_STUDIO'
          case 'google': return 'GOOGLE_AI'
          case 'mistral': return 'MISTRAL'
          case 'ollama': return 'OLLAMA'
          case 'openai': return 'OPENAI'
          case 'anthropic': return 'ANTHROPIC'
          case 'openai-compatible': return 'OPENAI_COMPATIBLE'
          case 'groq': return 'GROQ'
          default: return p.type?.toUpperCase().replace(/-/g, '_') || 'CUSTOM'
        }
      })(),
      // Always send apiKey for providers we're saving
      apiKey: p.apiKey ?? '',
      baseUrl: p.baseUrl,
      model: p.model,
      isActive: !!p.isActive,
      config: {
        temperature: p.temperature ?? 0.7,
        maxTokens: p.maxTokens ?? 1000,
        topP: p.topP ?? 1.0
      }
    }))
    const { authenticatedRequest } = await import('@/lib/api-client')
    await authenticatedRequest('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ providers: payload })
    })
    // Refresh from server to get the updated data
    const refreshed = await authenticatedRequest('/api/settings')
    setProviders((refreshed as any[]).map((s: any, index: number) => {
      const mappedType = (() => {
        const raw = (s.provider || 'custom').toString().toUpperCase()
        if (raw === 'OPENROUTER') return 'open-router'
        if (raw === 'GOOGLE_AI') return 'google'
        if (raw === 'LM_STUDIO') return 'lm-studio'
        if (raw === 'GROQ') return 'groq'
        return raw.toLowerCase().replace(/_/g, '-')
      })()
      const defaults = defaultProviders.find(d => d.type === mappedType)
      
      let pName = `${s.provider} (${s.model || ''})`
      if (mappedType === 'groq') {
        pName = `DocScan ${s.model || 'model name'} from groq (free)`
      }

      return {
        id: s.id || `provider-${index}`,
        name: pName,
        type: mappedType as AIProvider['type'],
        baseUrl: s.baseUrl || (defaults?.baseUrl ?? ''),
        // Use the actual API key as returned from server (or override if it's a known free provider)
        apiKey: s.apiKey || '',
        model: s.model || (defaults?.models?.[0] ?? ''),
        isActive: !!s.isActive,
        // Provider is configured if it has an API key
        isConfigured: !!(s.apiKey && s.apiKey.length > 0),
        lastTested: undefined,
        testStatus: undefined,
        errorMessage: undefined,
        models: defaults?.models || [],
        maxTokens: s.config?.maxTokens ?? defaults?.maxTokens ?? 1000,
        temperature: s.config?.temperature ?? defaults?.temperature ?? 0.7,
        topP: s.config?.topP ?? defaults?.topP ?? 1.0,
        description: defaults?.description || 'Configured provider',
        iconType: defaults?.iconType || 'brain',
        dirtyApiKey: false,
      }
    }))
  }

  const updateProvider = (id: string, updates: Partial<AIProvider>) => {
    const newProviders = providers.map(p => 
      p.id === id ? { ...p, ...updates } : p
    )
    setProviders(newProviders)
  }

  const saveProviderChanges = async () => {
    try {
      await saveProviders(providers)
      toast({
        title: 'Provider updated',
        description: 'Your AI provider configuration has been saved.',
      })
    } catch (error) {
      console.error('Failed to save provider changes:', error)
      toast({
        title: 'Failed to save provider',
        description: 'There was an error saving your provider configuration. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const autoTestAndSave = async (provider: AIProvider) => {
    if (!provider.apiKey && !['ollama', 'lm-studio'].includes(provider.type) && !provider.id.startsWith('docscan-free')) {
      return;
    }
    
    setTestingProvider(provider.id);
    updateProvider(provider.id, { testStatus: 'pending' });

    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const [testResult, modelsResult] = await Promise.allSettled([
        authenticatedRequest('/api/test-connection', {
          method: 'POST',
          body: JSON.stringify({ provider })
        }),
        authenticatedRequest('/api/models', {
          method: 'POST',
          body: JSON.stringify({ provider })
        })
      ])

      const isTestSuccess = testResult.status === 'fulfilled' && testResult.value.success;
      const newModels = modelsResult.status === 'fulfilled' && modelsResult.value?.models?.length > 0 
        ? modelsResult.value.models 
        : provider.models;

      if (isTestSuccess) {
        toast({
          title: 'Provider Checked',
          description: `${provider.name} is working correctly. Auto-saved.`,
        })

        // Find the index of the provider to update it in the latest state
        setProviders(prev => {
          const updated = prev.map(p => p.id === provider.id ? {
            ...p,
            models: newModels,
            testStatus: 'success' as const,
            lastTested: new Date().toISOString(),
            errorMessage: undefined,
            isConfigured: true
          } : p);
          
          // Auto-save silently in background
          const providersToSave = updated.filter(p => 
            p.isConfigured || p.dirtyApiKey || ['ollama', 'lm-studio'].includes(p.type)
          );
          
          const payload = providersToSave.map(p => ({
            provider: (() => {
              switch (p.type) {
                case 'open-router': return 'OPENROUTER'
                case 'lm-studio': return 'LM_STUDIO'
                case 'google': return 'GOOGLE_AI'
                case 'mistral': return 'MISTRAL'
                case 'ollama': return 'OLLAMA'
                case 'openai': return 'OPENAI'
                case 'anthropic': return 'ANTHROPIC'
                case 'openai-compatible': return 'OPENAI_COMPATIBLE'
                case 'groq': return 'GROQ'
                default: return p.type?.toUpperCase().replace(/-/g, '_') || 'CUSTOM'
              }
            })(),
            apiKey: p.apiKey ?? '',
            baseUrl: p.baseUrl,
            model: p.model,
            isActive: !!p.isActive,
            config: {
              temperature: p.temperature ?? 0.7,
              maxTokens: p.maxTokens ?? 1000,
              topP: p.topP ?? 1.0
            }
          }))

          authenticatedRequest('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ providers: payload })
          }).catch(console.error);

          return updated;
        });
      } else {
        const errorMsg = testResult.status === 'fulfilled' ? testResult.value.error : 'Connection failed';
        updateProvider(provider.id, {
          testStatus: 'error',
          lastTested: new Date().toISOString(),
          errorMessage: errorMsg,
          isConfigured: false
        })
        toast({
          title: 'Connection failed',
          description: errorMsg || 'Please double check your API key & Base URL.',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      updateProvider(provider.id, {
        testStatus: 'error',
        lastTested: new Date().toISOString(),
        errorMessage: error.message || 'Connection test failed',
        isConfigured: false
      })
    } finally {
      setTestingProvider(null)
    }
  }

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
    
    const provider = providers.find(p => p.id === id)
    if (provider) {
      toast({
        title: 'API Key visibility changed',
        description: `API key for ${provider.name} is now ${showApiKeys[id] ? 'hidden' : 'visible'}.`,
      })
    }
  }

  const getDisplayedApiKey = (provider: AIProvider) => {
    // Return the actual API key as entered by user
    return provider.apiKey || ''
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Update active provider logic - only one can be active at a time
      const activeProvider = providers.find(p => p.isActive && p.isConfigured)
      const newProviders = providers.map(p => ({
        ...p,
        isActive: p.id === activeProvider?.id
      }))
      await saveProviders(newProviders)
      
      // Show success message
      toast({
        title: 'Settings updated',
        description: 'Your AI provider settings have been updated successfully.',
      })
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast({
        title: 'Failed to update settings',
        description: 'There was an error updating your AI provider settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFetchModels = async (provider: AIProvider) => {
    setFetchingModels(prev => ({ ...prev, [provider.id]: true }))
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const response = await authenticatedRequest('/api/models', {
        method: 'POST',
        body: JSON.stringify({ provider })
      })
      
      if (response && response.models && response.models.length > 0) {
        // Only override if new models found
        updateProvider(provider.id, { models: response.models })
        toast({
          title: 'Models fetched successfully',
          description: `Loaded ${response.models.length} models for ${provider.name}.`,
        })
      } else {
        toast({
          title: 'No new models found',
          description: `Using default or existing models for ${provider.name}.`,
        })
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      toast({
        title: 'Failed to fetch models',
        description: 'Could not fetch live models. This might be due to an invalid API key or connection issue.',
        variant: 'destructive',
      })
    } finally {
      setFetchingModels(prev => ({ ...prev, [provider.id]: false }))
    }
  }

  const getProviderStatus = (provider: AIProvider) => {
    if (!provider.apiKey) return 'not_configured'
    if (provider.testStatus === 'success') return 'connected'
    if (provider.testStatus === 'error') return 'error'
    if (provider.testStatus === 'pending') return 'testing'
    return 'needs_test'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50'
      case 'error': return 'bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'
      case 'testing': return 'bg-amber-100/50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50'
      case 'needs_test': return 'bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50'
      default: return 'bg-secondary text-muted-foreground border-transparent'
    }
  }

  const getStatusIcon = (provider: AIProvider) => {
    if (testingProvider === provider.id) return <Loader2 className="w-3.5 h-3.5 animate-spin" />
    if (provider.testStatus === 'success') return <CheckCircle className="w-3.5 h-3.5" />
    if (provider.testStatus === 'error') return <AlertCircle className="w-3.5 h-3.5" />
    return <Key className="w-3.5 h-3.5" />
  }

  const getProviderIcon = (iconType: string) => {
    switch (iconType) {
      case 'brain': return <Brain className="w-5 h-5" />
      case 'zap': return <Zap className="w-5 h-5" />
      case 'server': return <Server className="w-5 h-5" />
      case 'shield': return <Shield className="w-5 h-5" />
      case 'globe': return <Globe className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="space-y-6 flex items-center justify-center p-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-3"/> Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-border bg-card overflow-hidden">
        <CardHeader className="p-6 md:p-8 bg-background relative z-10">
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
            <Settings className="w-6 h-6 text-primary" />
            AI Service Integration
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            Configure and manage your AI service providers. Only one provider can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border/50 bg-secondary/10">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-background shadow-sm gap-1.5 font-normal">
              <Brain className="w-4 h-4 text-indigo-500" />
              {providers.filter(p => p.isConfigured).length} Configured
            </Badge>
            <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 gap-1.5 shadow-sm font-normal">
              <CheckCircle className="w-4 h-4" />
              {providers.filter(p => p.isActive && p.isConfigured).length} Active
            </Badge>
          </div>
          <Button onClick={saveSettings} disabled={saving} size="lg" className="w-full sm:w-auto shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Integrations
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="providers" className="space-y-6">
        <div className="bg-background rounded-2xl p-1.5 shadow-sm border border-border inline-flex w-fit">
          <TabsList className="bg-transparent h-auto p-0 flex gap-1">
            <TabsTrigger value="providers" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground font-medium py-2 px-6 transition-all shadow-none text-muted-foreground border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm">Providers</TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground font-medium py-2 px-6 transition-all shadow-none text-muted-foreground border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm">Advanced</TabsTrigger>
            <TabsTrigger value="usage" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground font-medium py-2 px-6 transition-all shadow-none text-muted-foreground border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm">Usage</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="providers" className="space-y-6 m-0 outline-none">
          <div className="space-y-3 p-1 mb-2">
            <Label className="text-sm font-semibold text-foreground">Select AI Provider to Configure</Label>
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="w-full bg-background h-12 rounded-xl shadow-sm border-border text-base">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id} className="cursor-pointer py-3 h-auto">
                    <span className="font-medium text-sm">
                      {p.name} {p.isActive && p.isConfigured ? ' (Active)' : ''}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {providers.filter(p => p.id === selectedProviderId).map((provider) => (
            <motion.div key={provider.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="shadow-sm border-border bg-card transition-shadow hover:shadow-md">
                <CardHeader className="p-6 border-b border-border/50 bg-background/50">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`p-3 rounded-2xl shadow-sm border ${provider.isActive && provider.isConfigured ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary/50 border-border/50 text-muted-foreground'}`}>
                        {getProviderIcon(provider.iconType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground truncate">{provider.name}</CardTitle>
                        <CardDescription className="text-sm mt-1 line-clamp-1">{provider.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                      <Badge className={`px-2.5 py-1 text-xs font-medium tracking-wide shadow-none border ${getStatusColor(getProviderStatus(provider))} flex items-center gap-1.5`}>
                        {getStatusIcon(provider)}
                        {getProviderStatus(provider).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <div className="flex items-center gap-2 bg-secondary/40 p-1.5 rounded-full border border-border/50">
                        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 ${!provider.isActive ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>Off</span>
                        <Switch
                          checked={provider.isActive}
                          onCheckedChange={(checked) => {
                            if (checked && provider.isConfigured) {
                              const newProviders = providers.map(p => ({
                                ...p,
                                isActive: p.id === provider.id
                              }))
                              setProviders(newProviders)
                              toast({
                                title: 'Provider activated',
                                description: `${provider.name} is now the active AI provider.`,
                              })
                            } else {
                              updateProvider(provider.id, { isActive: false })
                              toast({
                                title: 'Provider deactivated',
                                description: `${provider.name} has been deactivated.`,
                              })
                            }
                          }}
                          disabled={!provider.isConfigured}
                        />
                        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 ${provider.isActive ? 'text-primary' : 'text-muted-foreground/40'}`}>On</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {provider.id.startsWith('docscan-free') ? (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Managed automatically</p>
                        <p className="text-xs text-muted-foreground mt-1">This provider is pre-configured by DocScan. No setup needed — just toggle it on to start using it for free.</p>
                      </div>
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor={`base-url-${provider.id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base URL</Label>
                      <Input
                        id={`base-url-${provider.id}`}
                        value={provider.baseUrl}
                        onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                        onBlur={() => {
                          if (provider.baseUrl && provider.apiKey) {
                            autoTestAndSave(provider)
                          }
                        }}
                        placeholder="API base URL"
                        className="bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`api-key-${provider.id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">API Key</Label>
                      <div className="relative">
                        <Input
                          id={`api-key-${provider.id}`}
                          type={showApiKeys[provider.id] ? 'text' : 'password'}
                          value={getDisplayedApiKey(provider)}
                          onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value, dirtyApiKey: true })}
                          onBlur={() => {
                            if (provider.baseUrl && provider.apiKey) {
                              autoTestAndSave({ ...provider, apiKey: provider.apiKey })
                            }
                          }}
                          placeholder="Enter your API key"
                          className="pr-10 bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
                          onClick={() => toggleApiKeyVisibility(provider.id)}
                        >
                          {showApiKeys[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {provider.apiKey && !isValidApiKey(provider.apiKey, provider.type) && (
                        <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" /> Invalid required API key format
                        </p>
                      )}
                      {fetchingModels[provider.id] && (
                        <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching live models...
                        </p>
                      )}
                    </div>
                  </div>
                  )}

                  {(provider.id !== 'docscan-free-builtin' || provider.models.length > 1) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`model-${provider.id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Model</Label>
                      </div>
                      <Select 
                        value={provider.model} 
                        onValueChange={(value) => updateProvider(provider.id, { model: value })}
                      >
                        <SelectTrigger id={`model-${provider.id}`} className="bg-background rounded-xl shadow-sm h-10">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-64">
                          {provider.models.map((model) => (
                            <SelectItem key={model} value={model} className="py-2.5">{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                     {!provider.id.startsWith('docscan-free') && (<>
                    <div className="space-y-2">
                      <Label htmlFor={`max-tokens-${provider.id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tokens</Label>
                      <Input
                        id={`max-tokens-${provider.id}`}
                        type="number"
                        value={provider.maxTokens}
                        onChange={(e) => updateProvider(provider.id, { maxTokens: parseInt(e.target.value) })}
                        className="bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`temperature-${provider.id}`} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Creativity (Temp)</Label>
                      <Input
                        id={`temperature-${provider.id}`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={provider.temperature}
                        onChange={(e) => updateProvider(provider.id, { temperature: parseFloat(e.target.value) })}
                        className="bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                      />
                    </div>
                    </>)}
                  </div>
                  )}

                  {provider.errorMessage && (
                    <Alert variant="destructive" className="bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-400">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm font-medium ml-2">{provider.errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {/* Removed manual option & test connection buttons */}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 m-0 outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="p-6 border-b border-border/50 bg-background/50">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" /> System Prompting
                </CardTitle>
                <CardDescription>Configure core behavioral directives for all models</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base Persona</Label>
                  <Textarea
                    placeholder="You are a helpful AI assistant that analyzes documents..."
                    className="min-h-[120px] bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timeout (sec)</Label>
                    <Input type="number" defaultValue="30" min="5" max="300" className="bg-background rounded-xl shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Retries</Label>
                    <Input type="number" defaultValue="3" min="1" max="10" className="bg-background rounded-xl shadow-sm" />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Archival Responses</Label>
                      <p className="text-xs text-muted-foreground">Save payloads structurally</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Vector Caching</Label>
                      <p className="text-xs text-muted-foreground">Reuse historical embeddings</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="p-6 border-b border-border/50 bg-background/50">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" /> Security Layer
                </CardTitle>
                <CardDescription>Manage keys, data lifecycles, and access</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">At-Rest Encryption</Label>
                    <p className="text-xs text-muted-foreground">Keys undergo AES-256 wrapping</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none shadow-sm gap-1.5 font-normal">
                    <CheckCircle className="w-3.5 h-3.5" /> Enforced
                  </Badge>
                </div>

                <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Lifecycle Policy</Label>
                    <p className="text-xs text-muted-foreground mb-3">Retention window for raw logs</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-full bg-background rounded-xl shadow-sm h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="7">7 Days (Ephemeral)</SelectItem>
                      <SelectItem value="30">30 Days (Standard)</SelectItem>
                      <SelectItem value="90">90 Days (Compliance)</SelectItem>
                      <SelectItem value="365">365 Days (Archival)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Telemetry Sharing</Label>
                    <p className="text-xs text-muted-foreground">Submit anonymous operational data</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card lg:col-span-2">
              <CardHeader className="p-6 border-b border-border/50 bg-background/50">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-500" /> Operations Center
                </CardTitle>
                <CardDescription>Pipeline monitoring and resource throttles</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Concurrency Cap</Label>
                  <div className="flex items-center gap-3">
                    <Input type="number" defaultValue="5" min="1" max="20" className="w-24 bg-background rounded-xl shadow-sm" />
                    <span className="text-sm text-muted-foreground">req/min</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Traffic Shaping</Label>
                  <Select defaultValue="balanced">
                    <SelectTrigger className="bg-background rounded-xl shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="speed">Optimize for Latency</SelectItem>
                      <SelectItem value="balanced">Balanced Mode</SelectItem>
                      <SelectItem value="quality">Optimize for Payload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Event Stream (SSE)</Label>
                    <p className="text-xs text-muted-foreground">Deliver chunks organically as generated</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/50 bg-primary/5 dark:bg-primary/10 shadow-sm lg:col-span-2 mt-2">
              <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Global Registry Commit</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Apply these policies universally across all configured units.
                  </p>
                </div>
                <Button className="w-full sm:w-auto shadow-sm px-6 rounded-full font-medium">
                  <Save className="w-4 h-4 mr-2" />
                  Synchronize
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6 m-0 outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="shadow-sm border-border bg-card overflow-hidden">
              <CardHeader className="p-6 md:p-8 border-b border-border/50 bg-background/50">
                <CardTitle className="flex items-center gap-3 text-xl font-semibold tracking-tight">
                  <Activity className="w-5 h-5 text-blue-500" /> Analytics Digest
                </CardTitle>
                <CardDescription className="mt-1.5 text-sm">
                  Review computational costs and payload consumption metrics.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ApiUsageTracker />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}