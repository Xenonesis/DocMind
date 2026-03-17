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
  Activity
} from 'lucide-react'
import { isValidApiKey } from '@/lib/crypto-utils'
import { useToast } from '@/hooks/use-toast'
import { ConnectionStatus } from '@/components/ui/connection-status'
import { ApiUsageTracker } from '@/components/features/api-usage-tracker'

interface AIProvider {
  id: string
  name: string
  type: 'google' | 'mistral' | 'lm-studio' | 'ollama' | 'open-router' | 'openai' | 'anthropic' | 'custom'
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
    models: [
      // Gemini 2.5 family (text output)
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      // Gemini 2.0 family (text output)
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      // Gemini 1.5 stable family (text output)
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ],
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
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'mistral-embed'],
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
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1'],
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
    models: ['claude-3-5-sonnet-latest', 'claude-3-opus-latest', 'claude-3-haiku-latest'],
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
    models: ['local-model'],
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
    models: ['llama2', 'llama3', 'mistral', 'codellama', 'phi3'],
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
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta-llama/llama-3.1-70b'],
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.9,
    description: 'Access multiple AI models through OpenRouter.',
    iconType: 'globe'
  }
]

export function AiApiSettings() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({})
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    
    // Remove test filtering - show all configured providers

    const load = async () => {
      try {
        const { authenticatedRequest } = await import('@/lib/api-client')
        const data = await authenticatedRequest('/api/settings')
        
        // Map backend records to UI provider model
        let mapped: AIProvider[] = data.map((s: any, index: number) => {
          const mappedType = (() => {
            const raw = (s.provider || 'custom').toString().toUpperCase()
            if (raw === 'OPENROUTER') return 'open-router'
            if (raw === 'GOOGLE_AI') return 'google'
            if (raw === 'LM_STUDIO') return 'lm-studio'
            return raw.toLowerCase().replace(/_/g, '-')
          })()
          const defaults = defaultProviders.find(d => d.type === mappedType)
          return {
            id: s.id || `provider-${index}`,
            name: `${s.provider} (${s.model || ''})`,
            type: mappedType as AIProvider['type'],
            baseUrl: s.baseUrl || (defaults?.baseUrl ?? ''),
            // Use the actual API key as returned from server
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
        })

        // Show all configured providers (removed test filtering)

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
        
        // Show success message if providers were loaded
        if (mapped.length > 0) {
          toast({
            title: 'Settings loaded',
            description: `Loaded ${mapped.length} AI provider configuration(s).`,
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
          default: return 'CUSTOM'
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
        return raw.toLowerCase().replace(/_/g, '-')
      })()
      const defaults = defaultProviders.find(d => d.type === mappedType)
      return {
        id: s.id || `provider-${index}`,
        name: `${s.provider} (${s.model || ''})`,
        type: mappedType as AIProvider['type'],
        baseUrl: s.baseUrl || (defaults?.baseUrl ?? ''),
        // Use the actual API key as returned from server
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

  const handleConnectionTest = (id: string, result: any) => {
    updateProvider(id, {
      testStatus: result.success ? 'success' : 'error',
      lastTested: new Date().toISOString(),
      errorMessage: result.success ? undefined : result.error,
      isConfigured: result.success
    })

    if (result.success) {
      toast({
        title: 'Connection successful',
        description: `${providers.find(p => p.id === id)?.name} is now configured and ready to use.`,
      })
    } else {
      toast({
        title: 'Connection failed',
        description: result.error || 'Failed to test connection',
        variant: 'destructive',
      })
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
      case 'connected': return 'bg-green-100 text-green-800 border-green-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'testing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'needs_test': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (provider: AIProvider) => {
    if (testingProvider === provider.id) return <Loader2 className="w-4 h-4 animate-spin" />
    if (provider.testStatus === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (provider.testStatus === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />
    return <Key className="w-4 h-4 text-gray-500" />
  }

  const getProviderIcon = (iconType: string) => {
    switch (iconType) {
      case 'brain': return <Brain className="w-5 h-5 text-blue-500" />
      case 'zap': return <Zap className="w-5 h-5 text-purple-500" />
      case 'server': return <Server className="w-5 h-5 text-green-500" />
      case 'shield': return <Shield className="w-5 h-5 text-orange-500" />
      case 'globe': return <Globe className="w-5 h-5 text-indigo-500" />
      default: return <Brain className="w-5 h-5 text-gray-500" />
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div className="space-y-6">Loading...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6 font-mono">
      <Card className="bg-background  border border-4 border-foreground brutal-shadow brutal-shadow dark:brutal-shadow rounded-none overflow-hidden group">
        <div className="absolute inset-0     opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="p-6 sm:p-8 border-b border-4 border-foreground relative z-10 bg-foreground text-background">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-foreground    dark: dark:">
            <div className="p-2.5    rounded-none brutal-shadow brutal-shadow">
              <Settings className="w-6 h-6 text-white" />
            </div>
            AI_API_INTEGRATION_NODE
          </CardTitle>
          <CardDescription className="mt-2 text-base text-foreground opacity-80 font-bold">
            Configure and manage your AI service providers. Only one provider can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 relative z-10 bg-foreground text-background border-b border-4 border-foreground">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-background border-2 border-foreground brutal-shadow gap-1.5">
                <Brain className="w-4 h-4 text-indigo-500" />
                {providers.filter(p => p.isConfigured).length} Configured
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 brutal-shadow gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {providers.filter(p => p.isActive && p.isConfigured).length} Active
              </Badge>
            </div>
            <Button onClick={saveSettings} disabled={saving} size="lg" className="w-full sm:w-auto    hover: hover: text-white brutal-shadow brutal-shadow hover:brutal-shadow hover:brutal-shadow transition-all rounded-none font-medium">
              {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              <span>Save Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="providers" className="space-y-8">
        <TabsList className="grid w-full sm:w-[600px] grid-cols-3 mx-auto bg-muted border-4 border-foreground  p-1.5 rounded-none brutal-shadow border border-4 border-foreground">
          <TabsTrigger value="providers" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:brutal-shadow data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 font-medium transition-all duration-300">Providers</TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:brutal-shadow data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 font-medium transition-all duration-300">Advanced</TabsTrigger>
          <TabsTrigger value="usage" className="rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:brutal-shadow data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 font-medium transition-all duration-300">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6 outline-none focus-visible:ring-0">
          {providers.map((provider) => (
            <motion.div key={provider.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="bg-background  border border-4 border-foreground brutal-shadow brutal-shadow dark:brutal-shadow rounded-none overflow-hidden hover:brutal-shadow transition-all duration-300 relative group">
              <div className="absolute inset-0     opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="p-6 border-b border-4 border-foreground relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-none brutal-shadow border ${provider.isActive && provider.isConfigured ? '   border-transparent brutal-shadow' : 'bg-muted border-2 border-foreground'}`}>
                      {/* We need to pass color white if active, else normal */}
                      <span className={provider.isActive && provider.isConfigured ? 'text-white' : ''}>
                        {getProviderIcon(provider.iconType)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl font-bold text-foreground font-black uppercase truncate">{provider.name}</CardTitle>
                      <CardDescription className="text-sm text-foreground opacity-70 font-bold mt-1 line-clamp-1">{provider.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    <Badge className={`px-2.5 py-1 text-xs font-semibold capitalize tracking-wider rounded-none ${getStatusColor(getProviderStatus(provider))} w-fit flex items-center gap-1.5`}>
                      {getStatusIcon(provider)}
                      {getProviderStatus(provider).replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-2 bg-background p-1.5 rounded-none border border-2 border-foreground">
                      <span className={`text-xs font-semibold px-2 ${!provider.isActive ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>OFF</span>
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
                        className="data-[state=checked]:bg-indigo-600"
                      />
                      <span className={`text-xs font-semibold px-2 ${provider.isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>ON</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`base-url-${provider.id}`}>Base URL</Label>
                    <Input
                      id={`base-url-${provider.id}`}
                      value={provider.baseUrl}
                      onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                      placeholder="API base URL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`api-key-${provider.id}`}>API Key</Label>
                    <div className="relative">
                      <Input
                        id={`api-key-${provider.id}`}
                        type={showApiKeys[provider.id] ? 'text' : 'password'}
                        value={getDisplayedApiKey(provider)}
                        onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value, dirtyApiKey: true })}
                        placeholder="Enter your API key"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => toggleApiKeyVisibility(provider.id)}
                      >
                        {showApiKeys[provider.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {provider.apiKey && !isValidApiKey(provider.apiKey, provider.type) && (
                      <div className="space-y-1">
                        <p className="text-xs text-red-500">
                          Invalid API key format for {provider.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Debug: Type={provider.type}, Length={provider.apiKey.length}, 
                          Starts with: {provider.apiKey.substring(0, 4)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`model-${provider.id}`}>Model</Label>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        className="h-6 text-xs px-2"
                        onClick={() => handleFetchModels(provider)}
                        disabled={fetchingModels[provider.id]}
                      >
                        {fetchingModels[provider.id] ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        Fetch Live
                      </Button>
                    </div>
                    <Select 
                      value={provider.model} 
                      onValueChange={(value) => updateProvider(provider.id, { model: value })}
                    >
                      <SelectTrigger id={`model-${provider.id}`}>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {provider.models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`max-tokens-${provider.id}`}>Max Tokens</Label>
                    <Input
                      id={`max-tokens-${provider.id}`}
                      type="number"
                      value={provider.maxTokens}
                      onChange={(e) => updateProvider(provider.id, { maxTokens: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`temperature-${provider.id}`}>Temperature</Label>
                    <Input
                      id={`temperature-${provider.id}`}
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={provider.temperature}
                      onChange={(e) => updateProvider(provider.id, { temperature: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                {provider.errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{provider.errorMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {provider.lastTested && (
                        <span>Last tested: {new Date(provider.lastTested).toLocaleString()}</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await saveProviders(providers)
                          toast({
                            title: 'Provider saved',
                            description: `${provider.name} configuration has been saved.`,
                          })
                        } catch (error) {
                          console.error('Failed to save provider:', error)
                          toast({
                            title: 'Failed to save provider',
                            description: `There was an error saving ${provider.name}. Please try again.`,
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                  
                  <ConnectionStatus
                    provider={{
                      id: provider.id,
                      name: provider.name,
                      type: provider.type,
                      apiKey: provider.apiKey,
                      model: provider.model,
                      baseUrl: provider.baseUrl
                    }}
                    onTestComplete={(result) => handleConnectionTest(provider.id, result)}
                  />
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 outline-none focus-visible:ring-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-background  border border-4 border-foreground brutal-shadow brutal-shadow dark:brutal-shadow rounded-none overflow-hidden hover:brutal-shadow transition-all duration-300 relative group flex flex-col h-full">
              <div className="absolute inset-0     opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="p-6 border-b border-4 border-foreground relative z-10 flex-none">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground font-black uppercase">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-none text-indigo-600 dark:text-indigo-400">
                    <Brain className="w-5 h-5" />
                  </div>
                  GLOBAL_AI_DIRECTIVES
                </CardTitle>
                <CardDescription className="text-foreground opacity-70 font-bold">
                  Configure default behavior for all AI providers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 relative z-10 flex-1">
                <div className="space-y-2">
                  <Label>Default System Prompt</Label>
                  <Textarea
                    placeholder="You are a helpful AI assistant that analyzes documents..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">
                    This prompt will be used for all AI interactions unless overridden
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Request Timeout (seconds)</Label>
                    <Input type="number" defaultValue="30" min="5" max="300" />
                  </div>
                  <div className="space-y-2">
                    <Label>Retry Attempts</Label>
                    <Input type="number" defaultValue="3" min="1" max="10" />
                  </div>
                </div>

                  <div className="flex items-center justify-between p-4 bg-background rounded-none border border-4 border-foreground">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground font-black uppercase">Au Responses</Label>
                      <p className="text-xs text-foreground opacity-70 font-bold">
                        Automatically save AI responses for future reference
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background rounded-none border border-4 border-foreground">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground font-black uppercase">Enable Response Caching</Label>
                      <p className="text-xs text-foreground opacity-70 font-bold">
                        Cache responses to reduce API calls for similar queries
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                  </div>
              </CardContent>
            </Card>

            <Card className="bg-background  border border-4 border-foreground brutal-shadow brutal-shadow dark:brutal-shadow rounded-none overflow-hidden hover:brutal-shadow transition-all duration-300 relative group flex flex-col h-full">
              <div className="absolute inset-0     opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="p-6 border-b border-4 border-foreground relative z-10 flex-none">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground font-black uppercase">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-none text-emerald-600 dark:text-emerald-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  SECURITY_PROTOCOLS
                </CardTitle>
                <CardDescription className="text-foreground opacity-70 font-bold">
                  Configure security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 relative z-10 flex-1">
                  <div className="flex items-center justify-between p-4 bg-background rounded-none border border-4 border-foreground">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground font-black uppercase">Encrypt API Keys</Label>
                      <p className="text-xs text-foreground opacity-70 font-bold">
                        API keys are encrypted before storage
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1">
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Enabled
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background rounded-none border border-4 border-foreground">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground font-black uppercase">Data Retention Period</Label>
                      <p className="text-xs text-foreground opacity-70 font-bold">
                        How long to keep AI responses and logs
                      </p>
                    </div>
                    <Select defaultValue="30">
                      <SelectTrigger className="w-[120px] bg-white dark:bg-slate-800 border-2 border-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-background rounded-none border border-4 border-foreground">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground font-black uppercase">Share Usage Analytics</Label>
                      <p className="text-xs text-foreground opacity-70 font-bold">
                        Help improve the service with anonymous usage data
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-emerald-600" />
                  </div>

                  <div className="space-y-2 p-4 bg-background rounded-none border border-4 border-foreground">
                    <Label className="text-sm font-semibold text-foreground font-black uppercase">Allowed IP Addresses (Optional)</Label>
                    <Input placeholder="192.168.1.0/24, 10.0.0.1" className="bg-white dark:bg-slate-800 border-2 border-foreground focus-visible:ring-emerald-500" />
                    <p className="text-xs text-foreground opacity-70 font-bold">
                      Restrict API access to specific IP ranges
                    </p>
                  </div>
                </CardContent>
              </Card>

            <Card className="bg-background  border border-4 border-foreground brutal-shadow brutal-shadow dark:brutal-shadow rounded-none overflow-hidden hover:brutal-shadow transition-all duration-300 relative group lg:col-span-2">
              <div className="absolute inset-0     opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="p-6 border-b border-4 border-foreground relative z-10 flex-none">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground font-black uppercase">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-none text-amber-600 dark:text-amber-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  PERFORMANCE_TUNING
                </CardTitle>
                <CardDescription className="text-foreground opacity-70 font-bold">
                  Optimize AI performance and resource usage
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 bg-background rounded-none border border-4 border-foreground">
                    <Label className="text-sm font-semibold text-foreground font-black uppercase">Concurrent Requests Limit</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Input type="number" defaultValue="5" min="1" max="20" className="w-24 bg-white dark:bg-slate-800 border-2 border-foreground focus-visible:ring-amber-500" />
                      <span className="text-sm text-foreground opacity-70 font-bold">requests per minute</span>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 bg-background rounded-none border border-4 border-foreground">
                    <Label className="text-sm font-semibold text-foreground font-black uppercase">Processing Priority</Label>
                    <Select defaultValue="balanced">
                      <SelectTrigger className="mt-2 bg-white dark:bg-slate-800 border-2 border-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="speed">Speed (Lower Latency)</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="quality">Quality (Higher Latency)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2 flex items-center justify-between p-4 bg-background rounded-none border border-4 border-foreground">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-semibold text-foreground font-black uppercase">Streaming Responses</Label>
                      <p className="text-xs text-foreground opacity-70 font-bold">
                        Show AI responses as they are generated for a faster perceived experience
                      </p>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background  border border-4 border-foreground brutal-shadow brutal-shadow dark:brutal-shadow rounded-none overflow-hidden hover:brutal-shadow transition-all duration-300 relative group flex flex-col h-full">
              <div className="absolute inset-0     opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="p-6 border-b border-4 border-foreground relative z-10 flex-none">
                <CardTitle className="flex items-center gap-3 text-lg font-bold text-foreground font-black uppercase">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-none text-rose-600 dark:text-rose-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  TELEMETRY_SYSTEMS
                </CardTitle>
                <CardDescription className="text-foreground opacity-70 font-bold">
                  Set up monitoring and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 relative z-10 flex-1">
                <div className="space-y-2 p-4 bg-background rounded-none border border-4 border-foreground">
                  <Label className="text-sm font-semibold text-foreground font-black uppercase">Cost Alert Threshold</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-medium text-foreground opacity-80 font-bold">$</span>
                    <Input type="number" defaultValue="50" min="1" className="w-24 bg-white dark:bg-slate-800 border-2 border-foreground focus-visible:ring-rose-500" />
                    <span className="text-sm text-foreground opacity-70 font-bold">per month</span>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-background rounded-none border border-4 border-foreground">
                  <Label className="text-sm font-semibold text-foreground font-black uppercase">Error Rate Alert</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Input type="number" defaultValue="10" min="1" max="100" className="w-24 bg-white dark:bg-slate-800 border-2 border-foreground focus-visible:ring-rose-500" />
                    <span className="text-sm text-foreground opacity-70 font-bold">% error rate</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-background rounded-none border border-4 border-foreground">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-semibold text-foreground font-black uppercase">Email Notifications</Label>
                    <p className="text-xs text-foreground opacity-70 font-bold">
                      Receive alerts via email
                    </p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-rose-600" />
                </div>

                <div className="flex items-center justify-between p-4 bg-background rounded-none border border-4 border-foreground">
                  <div className="space-y-0.5 pr-4">
                    <Label className="text-sm font-semibold text-foreground font-black uppercase">Daily Usage Reports</Label>
                    <p className="text-xs text-foreground opacity-70 font-bold">
                      Get daily summaries of API usage
                    </p>
                  </div>
                  <Switch className="data-[state=checked]:bg-rose-600" />
                </div>
              </CardContent>
            </Card>

          <Card className="   dark: dark: border border-blue-100 dark:border-blue-800/30 rounded-none overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground font-black uppercase">Save Advanced Settings</h3>
                  <p className="text-sm text-foreground opacity-80 font-bold mt-1">
                    Apply these settings to all AI providers and future interactions
                  </p>
                </div>
                <Button className="w-full sm:w-auto    hover: hover: text-white brutal-shadow brutal-shadow hover:brutal-shadow hover:brutal-shadow transition-all rounded-none font-medium px-6 py-2.5 h-auto">
                  <Save className="w-5 h-5 mr-2" />
                  Save All Settings
                </Button>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6 outline-none focus-visible:ring-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="bg-background  border border-4 border-foreground brutal-shadow brutal-shadow dark:brutal-shadow rounded-none overflow-hidden">
              <CardHeader className="p-6 sm:p-8 border-b border-4 border-foreground bg-foreground text-background">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold text-foreground    dark: dark:">
                  <div className="p-2.5    rounded-none brutal-shadow brutal-shadow">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  API_USAGE_METRICS
                </CardTitle>
                <CardDescription className="mt-2 text-base text-foreground opacity-80 font-bold">
                  Monitor your API usage, limits, and costs across different providers.
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