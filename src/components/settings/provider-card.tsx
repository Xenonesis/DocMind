'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Key,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Brain,
  Shield,
  Globe,
  Server,
  Eye,
  EyeOff,
} from 'lucide-react'
import { isValidApiKey } from '@/lib/crypto-utils'
import type { AIProvider } from '@/types'
import { getProviderStatus, getStatusColor } from './provider-config'

interface ProviderCardProps {
  provider: AIProvider
  testingProvider: string | null
  showApiKey: boolean
  fetchingModel: boolean
  onUpdate: (id: string, updates: Partial<AIProvider>) => void
  onAutoTestAndSave: (provider: AIProvider) => void
  onToggleActive: (provider: AIProvider, checked: boolean) => void
  onToggleApiKeyVisibility: (id: string) => void
}

function getProviderIcon(iconType: string) {
  switch (iconType) {
    case 'brain':
      return <Brain className="w-5 h-5" />
    case 'zap':
      return <Zap className="w-5 h-5" />
    case 'server':
      return <Server className="w-5 h-5" />
    case 'shield':
      return <Shield className="w-5 h-5" />
    case 'globe':
      return <Globe className="w-5 h-5" />
    default:
      return <Brain className="w-5 h-5" />
  }
}

function getStatusIcon(provider: AIProvider, testingProvider: string | null) {
  if (testingProvider === provider.id) return <Loader2 className="w-3.5 h-3.5 animate-spin" />
  if (provider.testStatus === 'success') return <CheckCircle className="w-3.5 h-3.5" />
  if (provider.testStatus === 'error') return <AlertCircle className="w-3.5 h-3.5" />
  return <Key className="w-3.5 h-3.5" />
}

export function ProviderCard({
  provider,
  testingProvider,
  showApiKey,
  fetchingModel,
  onUpdate,
  onAutoTestAndSave,
  onToggleActive,
  onToggleApiKeyVisibility,
}: ProviderCardProps) {
  const status = getProviderStatus(provider)
  const statusLabel = status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  const displayedApiKey = provider.apiKey || ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-sm border-border bg-card transition-shadow hover:shadow-md">
        <CardHeader className="p-6 border-b border-border/50 bg-background/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div
                className={`p-3 rounded-2xl shadow-sm border ${provider.isActive && provider.isConfigured ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-secondary/50 border-border/50 text-muted-foreground'}`}
              >
                {getProviderIcon(provider.iconType)}
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg font-semibold text-foreground truncate">
                  {provider.name}
                </CardTitle>
                <CardDescription className="text-sm mt-1 line-clamp-1">
                  {provider.description}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
              <Badge
                className={`px-2.5 py-1 text-xs font-medium tracking-wide shadow-none border ${getStatusColor(status)} flex items-center gap-1.5`}
              >
                {getStatusIcon(provider, testingProvider)}
                {statusLabel}
              </Badge>
              <div className="flex items-center gap-2 bg-secondary/40 p-1.5 rounded-full border border-border/50">
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold px-2 ${!provider.isActive ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}
                >
                  Off
                </span>
                <Switch
                  checked={provider.isActive}
                  onCheckedChange={(checked) => onToggleActive(provider, checked)}
                  disabled={!provider.isConfigured}
                />
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold px-2 ${provider.isActive ? 'text-primary' : 'text-muted-foreground/40'}`}
                >
                  On
                </span>
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
                <p className="text-xs text-muted-foreground mt-1">
                  This provider is pre-configured by DocScan. No setup needed — just toggle it on to
                  start using it for free.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor={`base-url-${provider.id}`}
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  Base URL
                </Label>
                <Input
                  id={`base-url-${provider.id}`}
                  value={provider.baseUrl}
                  onChange={(e) => onUpdate(provider.id, { baseUrl: e.target.value })}
                  onBlur={() => {
                    if (provider.baseUrl && provider.apiKey) onAutoTestAndSave(provider)
                  }}
                  placeholder="API base URL"
                  className="bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor={`api-key-${provider.id}`}
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id={`api-key-${provider.id}`}
                    type={showApiKey ? 'text' : 'password'}
                    value={displayedApiKey}
                    onChange={(e) =>
                      onUpdate(provider.id, { apiKey: e.target.value, dirtyApiKey: true })
                    }
                    onBlur={() => {
                      if (provider.baseUrl && provider.apiKey)
                        onAutoTestAndSave({ ...provider, apiKey: provider.apiKey })
                    }}
                    placeholder={
                      provider.maskedApiKey ||
                      (provider.hasStoredApiKey
                        ? 'API key configured (enter new key to replace)'
                        : 'Enter your API key')
                    }
                    className="pr-10 bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
                    onClick={() => onToggleApiKeyVisibility(provider.id)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {provider.apiKey &&
                  provider.dirtyApiKey &&
                  !isValidApiKey(provider.apiKey, provider.type) && (
                    <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Invalid required API key format
                    </p>
                  )}
                {fetchingModel && (
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
                  <Label
                    htmlFor={`model-${provider.id}`}
                    className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                  >
                    Model
                  </Label>
                </div>
                <Select
                  value={provider.model}
                  onValueChange={(value) => onUpdate(provider.id, { model: value })}
                >
                  <SelectTrigger
                    id={`model-${provider.id}`}
                    className="bg-background rounded-xl shadow-sm h-10"
                  >
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-64">
                    {provider.models.map((model) => (
                      <SelectItem key={model} value={model} className="py-2.5">
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!provider.id.startsWith('docscan-free') && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`max-tokens-${provider.id}`}
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Tokens
                    </Label>
                    <Input
                      id={`max-tokens-${provider.id}`}
                      type="number"
                      value={provider.maxTokens}
                      onChange={(e) =>
                        onUpdate(provider.id, { maxTokens: parseInt(e.target.value) })
                      }
                      className="bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`temperature-${provider.id}`}
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Creativity (Temp)
                    </Label>
                    <Input
                      id={`temperature-${provider.id}`}
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={provider.temperature}
                      onChange={(e) =>
                        onUpdate(provider.id, { temperature: parseFloat(e.target.value) })
                      }
                      className="bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label
                      htmlFor={`cost-per-1k-${provider.id}`}
                      className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Cost (USD / 1K tokens)
                    </Label>
                    <Input
                      id={`cost-per-1k-${provider.id}`}
                      type="number"
                      step="0.000001"
                      min="0"
                      value={provider.costPer1kTokens ?? ''}
                      onChange={(e) => {
                        const next = e.target.value.trim()
                        onUpdate(provider.id, {
                          costPer1kTokens: next === '' ? undefined : parseFloat(next),
                        })
                      }}
                      placeholder="Optional override for exact cost tracking"
                      className="bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground">
                      If set, Analytics Digest uses this exact price for this provider/model instead
                      of built-in estimates.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {provider.errorMessage && (
            <Alert
              variant="destructive"
              className="bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-400"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm font-medium ml-2">
                {provider.errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
