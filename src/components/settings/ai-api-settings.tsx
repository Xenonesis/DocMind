'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  CheckCircle,
  Loader2,
  Save,
  Brain,
  Activity,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { AIProvider } from '@/types'
import {
  defaultProviders,
  mapServerDataToProvider,
  serializeProviderPayload,
} from './provider-config'
import { ProviderCard } from './provider-card'
import { AdvancedSettings } from './advanced-settings'
import { ApiUsageTracker } from '@/components/features/api-usage-tracker'

export function AiApiSettings() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({})
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')
  const { toast } = useToast()

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)

    const load = async () => {
      try {
        const { authenticatedRequest } = await import('@/lib/api-client')
        const [data, freeProviderRes] = await Promise.allSettled([
          authenticatedRequest('/api/settings'),
          fetch('/api/free-provider').then(r => r.ok ? r.json() : null)
        ])
        const settingsData = data.status === 'fulfilled' ? data.value : []
        const freeConfig = freeProviderRes.status === 'fulfilled' ? freeProviderRes.value : null

        let mapped: AIProvider[] = (settingsData as any[]).map((s: any, i: number) => mapServerDataToProvider(s, i))

        if (freeConfig) {
          const configs = Array.isArray(freeConfig) ? freeConfig : [freeConfig]
          for (const config of [...configs].reverse()) {
            const existingIndex = mapped.findIndex(m => m.baseUrl === config.baseUrl && m.type === config.type)
            if (existingIndex >= 0) {
              const savedModel = mapped[existingIndex].model
              const isModelValid = config.models.length === 0 || config.models.includes(savedModel)
              mapped[existingIndex] = {
                ...mapped[existingIndex],
                id: config.id,
                apiKey: config.apiKey,
                isConfigured: true,
                hasStoredApiKey: true,
                model: isModelValid ? savedModel : config.model,
                models: config.models.length > 0 ? config.models : mapped[existingIndex].models,
              }
            } else {
              mapped = [{ ...config, dirtyApiKey: false }, ...mapped]
            }
          }
        }

        const existingTypes = new Set(mapped.map(m => m.type))
        const missingDefaults = defaultProviders
          .filter(d => !existingTypes.has(d.type))
          .map((d, idx) => ({ ...d, id: `provider-missing-${idx}` }))
        mapped = [...mapped, ...missingDefaults]

        if (mapped.length === 0) {
          mapped = defaultProviders.map((p, i) => ({ ...p, id: `provider-${i}` }))
        }

        setProviders(mapped)
        const active = mapped.find(p => p.isActive)
        setSelectedProviderId(active?.id || mapped[0]?.id || '')

        // Background test all configured providers
        Promise.all(mapped.map(async (p) => {
          if (!p.apiKey && !['ollama', 'lm-studio'].includes(p.type) && !p.id.startsWith('docscan-free')) return
          try {
            const { authenticatedRequest: ar } = await import('@/lib/api-client')
            setProviders(prev => prev.map(pp => pp.id === p.id ? { ...pp, testStatus: 'pending' } : pp))
            const [testResult, modelsResult] = await Promise.allSettled([
              ar('/api/test-connection', { method: 'POST', body: JSON.stringify({ provider: p }) }),
              ar('/api/models', { method: 'POST', body: JSON.stringify({ provider: p }) })
            ])
            const ok = testResult.status === 'fulfilled' && testResult.value.success
            const newModels = modelsResult.status === 'fulfilled' && modelsResult.value?.models?.length > 0 ? modelsResult.value.models : p.models
            setProviders(prev => prev.map(pp => pp.id === p.id ? {
              ...pp,
              models: newModels,
              testStatus: ok ? 'success' : 'error',
              lastTested: new Date().toISOString(),
              errorMessage: ok ? undefined : (testResult.status === 'fulfilled' ? testResult.value.error : 'Connection fail'),
              isConfigured: ok || pp.isConfigured,
            } : pp))
          } catch {}
        }))

        if ((settingsData as any[]).length > 0) {
          toast({ title: 'Settings loaded', description: `Loaded ${(settingsData as any[]).length} AI provider configuration(s).` })
        }
      } catch (error) {
        console.warn('Failed to load settings from server:', error)
        setProviders(defaultProviders.map((p, i) => ({ ...p, id: `provider-${i}` })))
        toast({ title: 'Failed to load settings', description: 'Using default provider configurations.', variant: 'destructive' })
      }
    }
    load()
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveProviders = async (newProviders: AIProvider[]) => {
    setProviders(newProviders)
    const filteredToSave = newProviders.filter(p =>
      p.isConfigured || p.dirtyApiKey || ['ollama', 'lm-studio'].includes(p.type)
    )
    const payload = filteredToSave.map(serializeProviderPayload)
    const { authenticatedRequest } = await import('@/lib/api-client')
    await authenticatedRequest('/api/settings', { method: 'POST', body: JSON.stringify({ providers: payload }) })
    const refreshed = await authenticatedRequest('/api/settings')
    setProviders((refreshed as any[]).map((s: any, i: number) => mapServerDataToProvider(s, i)))
  }

  const updateProvider = (id: string, updates: Partial<AIProvider>) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const activeProvider = providers.find(p => p.isActive && p.isConfigured)
      const newProviders = providers.map(p => ({ ...p, isActive: p.id === activeProvider?.id }))
      await saveProviders(newProviders)
      toast({ title: 'Settings updated', description: 'Your AI provider settings have been updated successfully.' })
    } catch {
      toast({ title: 'Failed to update settings', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ── Auto-test ─────────────────────────────────────────────────────────────
  const autoTestAndSave = async (provider: AIProvider) => {
    if (!provider.apiKey && !['ollama', 'lm-studio'].includes(provider.type) && !provider.id.startsWith('docscan-free')) return
    setTestingProvider(provider.id)
    updateProvider(provider.id, { testStatus: 'pending' })
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const [testResult, modelsResult] = await Promise.allSettled([
        authenticatedRequest('/api/test-connection', { method: 'POST', body: JSON.stringify({ provider }) }),
        authenticatedRequest('/api/models', { method: 'POST', body: JSON.stringify({ provider }) })
      ])
      const ok = testResult.status === 'fulfilled' && testResult.value.success
      const newModels = modelsResult.status === 'fulfilled' && modelsResult.value?.models?.length > 0 ? modelsResult.value.models : provider.models

      if (ok) {
        toast({ title: 'Provider Checked', description: `${provider.name} is working correctly. Auto-saved.` })
        setProviders(prev => {
          const updated = prev.map(p => p.id === provider.id ? { ...p, models: newModels, testStatus: 'success' as const, lastTested: new Date().toISOString(), errorMessage: undefined, isConfigured: true } : p)
          const payload = updated.filter(p => p.isConfigured || p.dirtyApiKey || ['ollama', 'lm-studio'].includes(p.type)).map(serializeProviderPayload)
          authenticatedRequest('/api/settings', { method: 'POST', body: JSON.stringify({ providers: payload }) }).catch(console.error)
          return updated
        })
      } else {
        const errorMsg = testResult.status === 'fulfilled' ? testResult.value.error : 'Connection failed'
        updateProvider(provider.id, { testStatus: 'error', lastTested: new Date().toISOString(), errorMessage: errorMsg, isConfigured: false })
        toast({ title: 'Connection failed', description: errorMsg || 'Please double check your API key & Base URL.', variant: 'destructive' })
      }
    } catch (error: any) {
      updateProvider(provider.id, { testStatus: 'error', lastTested: new Date().toISOString(), errorMessage: error.message || 'Connection test failed', isConfigured: false })
    } finally {
      setTestingProvider(null)
    }
  }

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }))
    const provider = providers.find(p => p.id === id)
    if (provider) {
      toast({ title: 'API Key visibility changed', description: `API key for ${provider.name} is now ${showApiKeys[id] ? 'hidden' : 'visible'}.` })
    }
  }

  const handleToggleActive = (provider: AIProvider, checked: boolean) => {
    if (checked && provider.isConfigured) {
      const newProviders = providers.map(p => ({ ...p, isActive: p.id === provider.id }))
      setProviders(newProviders)
      toast({ title: 'Provider activated', description: `${provider.name} is now the active AI provider.` })
    } else {
      updateProvider(provider.id, { isActive: false })
      toast({ title: 'Provider deactivated', description: `${provider.name} has been deactivated.` })
    }
  }

  if (!mounted) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Card className="shadow-sm border-border bg-card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          <CardHeader className="p-6 md:p-8 bg-background border-b border-border/50">
            <div className="h-8 w-64 bg-muted/80 rounded-md animate-pulse mb-2" />
            <div className="h-4 w-full max-w-md bg-muted/50 rounded-md animate-pulse" />
          </CardHeader>
          <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-secondary/10">
            <div className="flex gap-3">
              <div className="h-8 w-24 bg-muted/40 rounded-full animate-pulse" />
              <div className="h-8 w-24 bg-muted/40 rounded-full animate-pulse" />
            </div>
            <div className="h-10 w-36 bg-muted/60 rounded-md animate-pulse" />
          </CardContent>
        </Card>
        
        <div className="h-10 w-64 bg-muted/40 rounded-2xl animate-pulse mb-6" />
        
        <div className="space-y-4">
           <div className="h-4 w-48 bg-muted/60 rounded-md animate-pulse" />
           <div className="h-12 w-full bg-muted/30 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
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

      {/* Tabs */}
      <Tabs defaultValue="providers" className="space-y-6">
        <div className="bg-background rounded-2xl p-1.5 shadow-sm border border-border inline-flex w-fit">
          <TabsList className="bg-transparent h-auto p-0 flex gap-1">
            <TabsTrigger value="providers" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground font-medium py-2 px-6 transition-all shadow-none text-muted-foreground border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm">Providers</TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground font-medium py-2 px-6 transition-all shadow-none text-muted-foreground border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm">Advanced</TabsTrigger>
            <TabsTrigger value="usage" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground font-medium py-2 px-6 transition-all shadow-none text-muted-foreground border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm">Usage</TabsTrigger>
          </TabsList>
        </div>

        {/* Providers Tab */}
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
            <ProviderCard
              key={provider.id}
              provider={provider}
              testingProvider={testingProvider}
              showApiKey={!!showApiKeys[provider.id]}
              fetchingModel={!!fetchingModels[provider.id]}
              onUpdate={updateProvider}
              onAutoTestAndSave={autoTestAndSave}
              onToggleActive={handleToggleActive}
              onToggleApiKeyVisibility={toggleApiKeyVisibility}
            />
          ))}
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6 m-0 outline-none">
          <AdvancedSettings />
        </TabsContent>

        {/* Usage Tab */}
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