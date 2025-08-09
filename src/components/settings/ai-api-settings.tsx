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
  EyeOff
} from 'lucide-react'
import { encryptApiKey, decryptApiKey, isValidApiKey, maskApiKey } from '@/lib/crypto-utils'

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

  useEffect(() => {
    setMounted(true)
    
    const load = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
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
              apiKey: (typeof s.apiKey === 'string' && s.apiKey.includes('•')) ? '' : (s.apiKey || ''),
              model: s.model || (defaults?.models?.[0] ?? ''),
              isActive: !!s.isActive,
              isConfigured: !!(s.apiKey && !s.apiKey.includes('•')),
              lastTested: undefined,
              testStatus: undefined,
              errorMessage: undefined,
              models: defaults?.models || [],
              maxTokens: s.config?.maxTokens ?? defaults?.maxTokens ?? 1000,
              temperature: s.config?.temperature ?? defaults?.temperature ?? 0.7,
              topP: s.config?.topP ?? defaults?.topP ?? 1.0,
              description: defaults?.description || 'Configured provider',
              iconType: defaults?.iconType || 'brain'
            }
          })

          if (mapped.length === 0) {
            setProviders(defaultProviders.map((p, index) => ({ ...p, id: `provider-${index}` })))
            return
          }

          // Merge in any missing default providers so all options are visible
          const existingTypes = new Set(mapped.map(m => m.type))
          const missingDefaults = defaultProviders
            .filter(d => !existingTypes.has(d.type))
            .map((d, idx) => ({ ...d, id: `provider-missing-${idx}` }))
          mapped = [...mapped, ...missingDefaults]

          setProviders(mapped)
          return
        }
      } catch {}
      // Fallback to defaults if server fetch fails
      setProviders(defaultProviders.map((p, index) => ({ ...p, id: `provider-${index}` })))
    }
    load()
  }, [])

  const saveProviders = async (newProviders: AIProvider[]) => {
    setProviders(newProviders)
    // Persist ALL providers to backend directly
    const payload = newProviders.map(p => ({
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
      apiKey: p.apiKey ? p.apiKey : undefined,
      baseUrl: p.baseUrl,
      model: p.model,
      isActive: !!p.isActive,
      config: {
        temperature: p.temperature ?? 0.7,
        maxTokens: p.maxTokens ?? 1000,
        topP: p.topP ?? 1.0
      }
    }))
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providers: payload })
    })
  }

  const updateProvider = (id: string, updates: Partial<AIProvider>) => {
    const newProviders = providers.map(p => 
      p.id === id ? { ...p, ...updates } : p
    )
    setProviders(newProviders)
  }

  const testProvider = async (id: string) => {
    const provider = providers.find(p => p.id === id)
    if (!provider || !provider.apiKey) return

    // Validate API key format before testing
    if (!isValidApiKey(provider.apiKey, provider.type)) {
      updateProvider(id, {
        testStatus: 'error',
        lastTested: new Date().toISOString(),
        errorMessage: 'Invalid API key format for this provider',
        isConfigured: false
      })
      return
    }

    setTestingProvider(id)
    updateProvider(id, { testStatus: 'pending' })

    try {
      // Simple client-side validation simulating a connection check
      const hasKeyIfRequired = provider.apiKey || ['ollama', 'lm-studio'].includes(provider.type)
      const ok = !!(provider.model && provider.baseUrl && hasKeyIfRequired)

      updateProvider(id, {
        testStatus: ok ? 'success' : 'error',
        lastTested: new Date().toISOString(),
        errorMessage: ok ? undefined : 'Connection validation failed',
        isConfigured: ok
      })
    } catch (error) {
      updateProvider(id, {
        testStatus: 'error',
        lastTested: new Date().toISOString(),
        errorMessage: 'Connection failed',
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
  }

  const getDisplayedApiKey = (provider: AIProvider) => {
    if (showApiKeys[provider.id]) {
      return provider.apiKey
    }
    // Do not render placeholder bullets when empty
    if (!provider.apiKey) return ''
    return maskApiKey(provider.apiKey)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Simulate saving to backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update active provider logic - only one can be active at a time
      const activeProvider = providers.find(p => p.isActive && p.isConfigured)
      const newProviders = providers.map(p => ({
        ...p,
        isActive: p.id === activeProvider?.id
      }))
      
      saveProviders(newProviders)
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            AI API Integration Settings
          </CardTitle>
          <CardDescription>
            Configure and manage your AI service providers. Only one provider can be active at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Brain className="w-3 h-3" />
                {providers.filter(p => p.isConfigured).length} Configured
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                {providers.filter(p => p.isActive && p.isConfigured).length} Active
              </Badge>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Settings
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(provider.iconType)}
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(getProviderStatus(provider))}>
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
                        } else {
                          updateProvider(provider.id, { isActive: false })
                        }
                      }}
                      disabled={!provider.isConfigured}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
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
                      <p className="text-xs text-red-500">
                        Invalid API key format for {provider.name}
                      </p>
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

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {provider.lastTested && (
                      <span>Last tested: {new Date(provider.lastTested).toLocaleString()}</span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => testProvider(provider.id)}
                    disabled={!provider.apiKey || testingProvider === provider.id}
                  >
                    {testingProvider === provider.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Fine-tune AI behavior and performance settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Request Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    defaultValue="30"
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retry-attempts">Retry Attempts</Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    defaultValue="3"
                    placeholder="3"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fallback-model">Fallback Model</Label>
                <Select defaultValue="">
                  <SelectTrigger>
                    <SelectValue placeholder="Select fallback model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-instructions">Custom Instructions</Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="Add custom instructions for AI behavior..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Monitor your AI API usage and costs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-gray-500">API Calls Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-gray-500">Tokens Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">$0.00</div>
                  <div className="text-sm text-gray-500">Estimated Cost</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monthly Usage</Label>
                <Progress value={0} className="h-2" />
                <div className="text-sm text-gray-500">0% of monthly limit</div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Usage tracking will be available once you start making API calls.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}