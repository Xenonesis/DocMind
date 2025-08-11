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
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            AI API Integration Settings
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Configure and manage your AI service providers. Only one provider can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <Brain className="w-3 h-3" />
                {providers.filter(p => p.isConfigured).length} Configured
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <CheckCircle className="w-3 h-3" />
                {providers.filter(p => p.isActive && p.isConfigured).length} Active
              </Badge>
            </div>
            <Button onClick={saveSettings} disabled={saving} size="sm" className="w-full sm:w-auto">
              {saving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />}
              <span className="text-sm">Save Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getProviderIcon(provider.iconType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base sm:text-lg truncate">{provider.name}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm line-clamp-2">{provider.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                    <Badge className={`${getStatusColor(getProviderStatus(provider))} text-xs w-fit`}>
                      {getStatusIcon(provider)}
                      <span className="ml-1 capitalize">
                        {getProviderStatus(provider).replace('_', ' ')}
                      </span>
                    </Badge>
                    <Switch
                      checked={provider.isActive}
                      onCheckedChange={(checked) => {
                        if (checked && provider.isConfigured) {
                          // Deactivate other providers locally; persisted on Save
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
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label htmlFor={`model-${provider.id}`}>Model</Label>
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
          ))}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Global AI Settings
                </CardTitle>
                <CardDescription>
                  Configure default behavior for all AI providers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save Responses</Label>
                    <p className="text-xs text-gray-500">
                      Automatically save AI responses for future reference
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Response Caching</Label>
                    <p className="text-xs text-gray-500">
                      Cache responses to reduce API calls for similar queries
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Privacy
                </CardTitle>
                <CardDescription>
                  Configure security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Encrypt API Keys</Label>
                    <p className="text-xs text-gray-500">
                      API keys are encrypted before storage
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data Retention Period</Label>
                    <p className="text-xs text-gray-500">
                      How long to keep AI responses and logs
                    </p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
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

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share Usage Analytics</Label>
                    <p className="text-xs text-gray-500">
                      Help improve the service with anonymous usage data
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-2">
                  <Label>Allowed IP Addresses (Optional)</Label>
                  <Input placeholder="192.168.1.0/24, 10.0.0.1" />
                  <p className="text-xs text-gray-500">
                    Restrict API access to specific IP ranges
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Performance Optimization
                </CardTitle>
                <CardDescription>
                  Optimize AI performance and resource usage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Concurrent Requests Limit</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue="5" min="1" max="20" className="w-20" />
                    <span className="text-sm text-gray-500">requests at once</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rate Limiting</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue="100" min="1" className="w-20" />
                      <span className="text-sm text-gray-500">requests per</span>
                    </div>
                    <Select defaultValue="hour">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minute">minute</SelectItem>
                        <SelectItem value="hour">hour</SelectItem>
                        <SelectItem value="day">day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Smart Model Selection</Label>
                    <p className="text-xs text-gray-500">
                      Automatically choose the best model for each task
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Failover to Backup Provider</Label>
                    <p className="text-xs text-gray-500">
                      Switch to another provider if primary fails
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Monitoring & Alerts
                </CardTitle>
                <CardDescription>
                  Set up monitoring and notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cost Alert Threshold</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">$</span>
                    <Input type="number" defaultValue="50" min="1" className="w-24" />
                    <span className="text-sm text-gray-500">per month</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Error Rate Alert</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" defaultValue="10" min="1" max="100" className="w-20" />
                    <span className="text-sm text-gray-500">% error rate</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-gray-500">
                      Receive alerts via email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Usage Reports</Label>
                    <p className="text-xs text-gray-500">
                      Get daily summaries of API usage
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Save Advanced Settings</h3>
                  <p className="text-sm text-gray-500">
                    Apply these settings to all AI providers and future interactions
                  </p>
                </div>
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Save All Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <ApiUsageTracker />
        </TabsContent>
      </Tabs>
    </div>
  )
}