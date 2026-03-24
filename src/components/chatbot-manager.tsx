'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Copy, KeyRound, Link2, Loader2, Pencil, Plus, RefreshCw, ShieldX, Trash2 } from 'lucide-react'

interface DocumentItem {
  id: string
  name: string
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
}

interface ChatbotItem {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  linkedDocumentCount: number
  hostedUrl: string
  created_at: string
}

interface ChatbotDetails {
  id: string
  name: string
  description: string | null
  slug: string
  system_prompt: string | null
  refusal_message: string
  fallback_message: string
  is_active: boolean
  allowed_origins: string[]
  requests_per_minute_bot: number
  requests_per_minute_ip: number
  requests_per_day_bot: number
  documentIds: string[]
}

interface SecretItem {
  id: string
  key_name?: string
  token_name?: string
  key_prefix?: string
  token_prefix?: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  last_used_at?: string | null
}

export function ChatbotManager() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [chatbots, setChatbots] = useState<ChatbotItem[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('Answer only using linked documents. Keep responses concise and clear.')
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [generatedToken, setGeneratedToken] = useState('')
  const [generatedApiKey, setGeneratedApiKey] = useState('')
  const [generatedSlug, setGeneratedSlug] = useState('')
  const [editingBotId, setEditingBotId] = useState<string | null>(null)
  const [updatingBot, setUpdatingBot] = useState(false)
  const [details, setDetails] = useState<ChatbotDetails | null>(null)
  const [apiKeys, setApiKeys] = useState<SecretItem[]>([])
  const [embedTokens, setEmbedTokens] = useState<SecretItem[]>([])
  const [allowedOriginsInput, setAllowedOriginsInput] = useState('')

  const completedDocuments = useMemo(
    () => documents.filter((doc) => doc.status === 'COMPLETED'),
    [documents]
  )

  const loadData = async () => {
    setLoading(true)
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const [bots, docs] = await Promise.all([
        authenticatedRequest<ChatbotItem[]>('/api/chatbots'),
        authenticatedRequest<DocumentItem[]>('/api/documents'),
      ])
      setChatbots(bots || [])
      setDocuments(docs || [])
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to load chatbot data',
        description: error?.message || 'Please refresh and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleDocSelection = (id: string) => {
    setSelectedDocumentIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Please enter chatbot name.' })
      return
    }

    if (selectedDocumentIds.length === 0) {
      toast({ variant: 'destructive', title: 'Documents required', description: 'Select at least one document.' })
      return
    }

    setSaving(true)
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      await authenticatedRequest('/api/chatbots', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          systemPrompt,
          documentIds: selectedDocumentIds,
        }),
      })

      setName('')
      setDescription('')
      setSelectedDocumentIds([])
      setGeneratedToken('')
      setGeneratedApiKey('')
      await loadData()

      toast({ title: 'Chatbot created', description: 'Your hosted URL and credentials can now be generated.' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to create chatbot', description: error?.message || 'Try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      await authenticatedRequest(`/api/chatbots/${id}`, { method: 'DELETE' })
      await loadData()
      toast({ title: 'Chatbot deleted' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error?.message || 'Try again.' })
    }
  }

  const openEditor = async (id: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const [botData, keysData, tokensData] = await Promise.all([
        authenticatedRequest<ChatbotDetails>(`/api/chatbots/${id}`),
        authenticatedRequest<SecretItem[]>(`/api/chatbots/${id}/credentials`),
        authenticatedRequest<SecretItem[]>(`/api/chatbots/${id}/embed-token`),
      ])

      setEditingBotId(id)
      setDetails(botData)
      setApiKeys(keysData || [])
      setEmbedTokens(tokensData || [])
      setAllowedOriginsInput(Array.isArray(botData.allowed_origins) ? botData.allowed_origins.join('\n') : '')
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load chatbot details', description: error?.message || 'Try again.' })
    }
  }

  const closeEditor = () => {
    setEditingBotId(null)
    setDetails(null)
    setApiKeys([])
    setEmbedTokens([])
    setAllowedOriginsInput('')
  }

  const handleSaveBot = async () => {
    if (!editingBotId || !details) return
    if (!details.name.trim()) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Please enter chatbot name.' })
      return
    }
    if (!Array.isArray(details.documentIds) || details.documentIds.length === 0) {
      toast({ variant: 'destructive', title: 'Documents required', description: 'Select at least one document.' })
      return
    }

    setUpdatingBot(true)
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const parsedOrigins = allowedOriginsInput
        .split('\n')
        .map((v) => v.trim())
        .filter(Boolean)

      await authenticatedRequest(`/api/chatbots/${editingBotId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: details.name,
          description: details.description || '',
          systemPrompt: details.system_prompt || '',
          refusalMessage: details.refusal_message,
          fallbackMessage: details.fallback_message,
          isActive: details.is_active,
          requestsPerMinuteBot: details.requests_per_minute_bot,
          requestsPerMinuteIp: details.requests_per_minute_ip,
          requestsPerDayBot: details.requests_per_day_bot,
          allowedOrigins: parsedOrigins,
          documentIds: details.documentIds,
        }),
      })

      await loadData()
      await openEditor(editingBotId)
      toast({ title: 'Chatbot updated' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to update chatbot', description: error?.message || 'Try again.' })
    } finally {
      setUpdatingBot(false)
    }
  }

  const revokeApiKey = async (botId: string, keyId: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      await authenticatedRequest(`/api/chatbots/${botId}/credentials?keyId=${encodeURIComponent(keyId)}`, {
        method: 'DELETE',
      })
      await openEditor(botId)
      toast({ title: 'API key revoked' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to revoke API key', description: error?.message || 'Try again.' })
    }
  }

  const revokeEmbedToken = async (botId: string, tokenId: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      await authenticatedRequest(`/api/chatbots/${botId}/embed-token?tokenId=${encodeURIComponent(tokenId)}`, {
        method: 'DELETE',
      })
      await openEditor(botId)
      toast({ title: 'Embed token revoked' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to revoke token', description: error?.message || 'Try again.' })
    }
  }

  const handleGenerateToken = async (id: string, slug: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest<{ token: string }>(`/api/chatbots/${id}/embed-token`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'dashboard-generated',
          expiresInDays: 30,
        }),
      })

      const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setGeneratedToken(`${appUrl}/bot/${slug}?token=${data.token}`)
      setGeneratedSlug(slug)
      toast({ title: 'Embed token generated', description: 'Share URL copied from panel below.' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Token generation failed', description: error?.message || 'Try again.' })
    }
  }

  const handleGenerateApiKey = async (id: string, slug: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest<{ apiKey: string }>(`/api/chatbots/${id}/credentials`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'dashboard-generated',
          rotate: false,
        }),
      })
      setGeneratedApiKey(data.apiKey)
      setGeneratedSlug(slug)
      toast({ title: 'API key generated', description: 'Store it safely. It is shown once.' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'API key generation failed', description: error?.message || 'Try again.' })
    }
  }

  const copyText = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    toast({ title: `${label} copied` })
  }

  const toggleEditDocumentSelection = (id: string) => {
    if (!details) return
    const set = new Set(details.documentIds || [])
    if (set.has(id)) {
      set.delete(id)
    } else {
      set.add(id)
    }
    setDetails({ ...details, documentIds: Array.from(set) })
  }

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading chatbots...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Custom Chatbot</CardTitle>
          <CardDescription>Link one or more processed documents and publish a hosted chatbot URL.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Chatbot Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contract Assistant" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Helps users understand contract clauses" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Guardrail System Prompt</Label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              placeholder="Rules this chatbot should follow"
            />
          </div>

          <div className="space-y-2">
            <Label>Linked Documents (Completed only)</Label>
            <div className="border rounded-lg p-3 max-h-52 overflow-y-auto space-y-2">
              {completedDocuments.length === 0 && (
                <p className="text-sm text-muted-foreground">No completed documents available yet.</p>
              )}
              {completedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedDocumentIds.includes(doc.id)}
                    onCheckedChange={() => toggleDocSelection(doc.id)}
                  />
                  <span className="text-sm">{doc.name}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleCreate} disabled={saving} className="rounded-full px-6">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Chatbot
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Your Chatbots</CardTitle>
            <CardDescription>Generate hosted URL, embed token, and API key for integrations.</CardDescription>
          </div>
          <Button variant="outline" onClick={loadData} className="rounded-full">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {chatbots.length === 0 && (
            <p className="text-sm text-muted-foreground">No chatbots created yet.</p>
          )}

          {chatbots.map((bot) => (
            <div key={bot.id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{bot.name}</h3>
                  <p className="text-xs text-muted-foreground">/bot/{bot.slug}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant={bot.is_active ? 'default' : 'outline'}>{bot.is_active ? 'Active' : 'Inactive'}</Badge>
                    <Badge variant="outline">{bot.linkedDocumentCount} docs</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(bot.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Button variant="outline" onClick={() => copyText(bot.hostedUrl, 'Hosted URL')}>
                  <Link2 className="w-4 h-4 mr-2" /> Copy Hosted URL
                </Button>
                <Button variant="outline" onClick={() => handleGenerateToken(bot.id, bot.slug)}>
                  <Copy className="w-4 h-4 mr-2" /> Generate Embed URL
                </Button>
                <Button variant="outline" onClick={() => handleGenerateApiKey(bot.id, bot.slug)}>
                  <KeyRound className="w-4 h-4 mr-2" /> Generate API Key
                </Button>
              </div>

              <div>
                <Button variant="secondary" onClick={() => openEditor(bot.id)}>
                  <Pencil className="w-4 h-4 mr-2" /> Configure Bot
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {editingBotId && details && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit Chatbot: {details.name}</CardTitle>
            <CardDescription>Update guardrails, limits, documents, and credential lifecycle from one place.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={details.description || ''} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>System Prompt</Label>
              <Textarea value={details.system_prompt || ''} onChange={(e) => setDetails({ ...details, system_prompt: e.target.value })} rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Refusal Message</Label>
                <Textarea value={details.refusal_message || ''} onChange={(e) => setDetails({ ...details, refusal_message: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Fallback Message</Label>
                <Textarea value={details.fallback_message || ''} onChange={(e) => setDetails({ ...details, fallback_message: e.target.value })} rows={2} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Bot requests/min</Label>
                <Input
                  type="number"
                  value={details.requests_per_minute_bot}
                  onChange={(e) => setDetails({ ...details, requests_per_minute_bot: Number(e.target.value || 0) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Per IP requests/min</Label>
                <Input
                  type="number"
                  value={details.requests_per_minute_ip}
                  onChange={(e) => setDetails({ ...details, requests_per_minute_ip: Number(e.target.value || 0) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bot requests/day</Label>
                <Input
                  type="number"
                  value={details.requests_per_day_bot}
                  onChange={(e) => setDetails({ ...details, requests_per_day_bot: Number(e.target.value || 0) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allowed Origins (one per line)</Label>
              <Textarea
                value={allowedOriginsInput}
                onChange={(e) => setAllowedOriginsInput(e.target.value)}
                rows={3}
                placeholder="https://your-site.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Linked Documents</Label>
              <div className="border rounded-lg p-3 max-h-44 overflow-y-auto space-y-2">
                {completedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={details.documentIds.includes(doc.id)}
                      onCheckedChange={() => toggleEditDocumentSelection(doc.id)}
                    />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={details.is_active}
                onCheckedChange={(checked) => setDetails({ ...details, is_active: checked === true })}
              />
              <span className="text-sm">Bot is active</span>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveBot} disabled={updatingBot}>
                {updatingBot ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
              <Button variant="outline" onClick={closeEditor}>Close</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Issued API Keys</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {apiKeys.length === 0 && <p className="text-xs text-muted-foreground">No API keys issued yet.</p>}
                  {apiKeys.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 border rounded p-2">
                      <div className="text-xs">
                        <div>{item.key_name || 'default'} ({item.key_prefix || 'n/a'})</div>
                        <div className="text-muted-foreground">{item.is_active ? 'active' : 'revoked'}</div>
                      </div>
                      {item.is_active && (
                        <Button size="sm" variant="outline" onClick={() => revokeApiKey(editingBotId, item.id)}>
                          <ShieldX className="w-3.5 h-3.5 mr-1" /> Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Issued Embed Tokens</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {embedTokens.length === 0 && <p className="text-xs text-muted-foreground">No embed tokens issued yet.</p>}
                  {embedTokens.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 border rounded p-2">
                      <div className="text-xs">
                        <div>{item.token_name || 'default'} ({item.token_prefix || 'n/a'})</div>
                        <div className="text-muted-foreground">{item.is_active ? 'active' : 'revoked'}</div>
                      </div>
                      {item.is_active && (
                        <Button size="sm" variant="outline" onClick={() => revokeEmbedToken(editingBotId, item.id)}>
                          <ShieldX className="w-3.5 h-3.5 mr-1" /> Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(generatedToken || generatedApiKey) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Generated Credentials</CardTitle>
            <CardDescription>Save these values securely. Sensitive values are shown only once.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {generatedToken && (
              <div className="space-y-2">
                <Label>Hosted URL with Embed Token</Label>
                <div className="flex gap-2">
                  <Input value={generatedToken} readOnly />
                  <Button variant="outline" onClick={() => copyText(generatedToken, 'Embed URL')}>Copy</Button>
                </div>
              </div>
            )}

            {generatedApiKey && (
              <div className="space-y-2">
                <Label>REST API Key</Label>
                <div className="flex gap-2">
                  <Input value={generatedApiKey} readOnly />
                  <Button variant="outline" onClick={() => copyText(generatedApiKey, 'API key')}>Copy</Button>
                </div>
              </div>
            )}

            {generatedApiKey && generatedSlug && (
              <div className="space-y-2">
                <Label>REST API Endpoint</Label>
                <div className="flex gap-2">
                  <Input value="/api/chatbots/runtime/query" readOnly />
                  <Button variant="outline" onClick={() => copyText('/api/chatbots/runtime/query', 'Endpoint')}>Copy</Button>
                </div>
                <Label className="text-xs text-muted-foreground">cURL Example</Label>
                <Textarea
                  readOnly
                  className="min-h-32 font-mono text-xs"
                  value={`curl -X POST "${typeof window !== 'undefined' ? window.location.origin : ''}/api/chatbots/runtime/query" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${generatedApiKey}" \\
  -d '{"slug":"${generatedSlug}","query":"Summarize key points from linked documents"}'`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
