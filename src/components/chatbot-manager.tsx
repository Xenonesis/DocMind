'use client'

import { useEffect, useMemo, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import type { ChatbotItem, ChatbotDetails, SecretItem } from '@/types'
import { CreateChatbotForm } from './chatbots/create-chatbot-form'
import { ChatbotList } from './chatbots/chatbot-list'
import { ChatbotEditor } from './chatbots/chatbot-editor'
import { CredentialsPanel } from './chatbots/credentials-panel'

interface DocumentItem {
  id: string
  name: string
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
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
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewName, setPreviewName] = useState('')
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

  // ── Data Loading ──────────────────────────────────────────────────────────
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
      toast({ variant: 'destructive', title: 'Failed to load chatbot data', description: error?.message || 'Please refresh and try again.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // ── Create / Delete ───────────────────────────────────────────────────────
  const toggleDocSelection = (id: string) => {
    setSelectedDocumentIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleCreate = async () => {
    if (!name.trim()) { toast({ variant: 'destructive', title: 'Name required', description: 'Please enter chatbot name.' }); return }
    if (selectedDocumentIds.length === 0) { toast({ variant: 'destructive', title: 'Documents required', description: 'Select at least one document.' }); return }
    setSaving(true)
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      await authenticatedRequest('/api/chatbots', { method: 'POST', body: JSON.stringify({ name, description, systemPrompt, documentIds: selectedDocumentIds }) })
      setName(''); setDescription(''); setSelectedDocumentIds([]); setGeneratedToken(''); setGeneratedApiKey(''); setPreviewUrl(''); setPreviewName('')
      await loadData()
      toast({ title: 'Chatbot created', description: 'Your hosted URL and credentials can now be generated.' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to create chatbot', description: error?.message || 'Try again.' })
    } finally { setSaving(false) }
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

  // ── Editor ────────────────────────────────────────────────────────────────
  const openEditor = async (id: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const [botData, keysData, tokensData] = await Promise.all([
        authenticatedRequest<ChatbotDetails>(`/api/chatbots/${id}`),
        authenticatedRequest<SecretItem[]>(`/api/chatbots/${id}/credentials`),
        authenticatedRequest<SecretItem[]>(`/api/chatbots/${id}/embed-token`),
      ])
      setEditingBotId(id); setDetails(botData); setApiKeys(keysData || []); setEmbedTokens(tokensData || [])
      setAllowedOriginsInput(Array.isArray(botData.allowed_origins) ? botData.allowed_origins.join('\n') : '')
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to load chatbot details', description: error?.message || 'Try again.' })
    }
  }

  const closeEditor = () => { setEditingBotId(null); setDetails(null); setApiKeys([]); setEmbedTokens([]); setAllowedOriginsInput('') }

  const handleSaveBot = async () => {
    if (!editingBotId || !details) return
    if (!details.name.trim()) { toast({ variant: 'destructive', title: 'Name required', description: 'Please enter chatbot name.' }); return }
    if (!Array.isArray(details.documentIds) || details.documentIds.length === 0) { toast({ variant: 'destructive', title: 'Documents required', description: 'Select at least one document.' }); return }
    setUpdatingBot(true)
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const parsedOrigins = allowedOriginsInput.split('\n').map((v) => v.trim()).filter(Boolean)
      await authenticatedRequest(`/api/chatbots/${editingBotId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: details.name, description: details.description || '', systemPrompt: details.system_prompt || '',
          refusalMessage: details.refusal_message, fallbackMessage: details.fallback_message, isActive: details.is_active,
          requestsPerMinuteBot: details.requests_per_minute_bot, requestsPerMinuteIp: details.requests_per_minute_ip,
          requestsPerDayBot: details.requests_per_day_bot, allowedOrigins: parsedOrigins, documentIds: details.documentIds,
        }),
      })
      await loadData(); await openEditor(editingBotId)
      toast({ title: 'Chatbot updated' })
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to update chatbot', description: error?.message || 'Try again.' })
    } finally { setUpdatingBot(false) }
  }

  // ── Credentials ───────────────────────────────────────────────────────────
  const revokeApiKey = async (botId: string, keyId: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      await authenticatedRequest(`/api/chatbots/${botId}/credentials?keyId=${encodeURIComponent(keyId)}`, { method: 'DELETE' })
      await openEditor(botId); toast({ title: 'API key revoked' })
    } catch (error: any) { toast({ variant: 'destructive', title: 'Failed to revoke API key', description: error?.message || 'Try again.' }) }
  }

  const revokeEmbedToken = async (botId: string, tokenId: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      await authenticatedRequest(`/api/chatbots/${botId}/embed-token?tokenId=${encodeURIComponent(tokenId)}`, { method: 'DELETE' })
      await openEditor(botId); toast({ title: 'Embed token revoked' })
    } catch (error: any) { toast({ variant: 'destructive', title: 'Failed to revoke token', description: error?.message || 'Try again.' }) }
  }

  const handleGenerateToken = async (id: string, slug: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest<{ token: string }>(`/api/chatbots/${id}/embed-token`, { method: 'POST', body: JSON.stringify({ name: 'dashboard-generated', expiresInDays: 30 }) })
      const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setGeneratedToken(`${appUrl}/bot/${slug}#token=${encodeURIComponent(data.token)}`); setGeneratedSlug(slug)
      toast({ title: 'Embed token generated', description: 'Share URL copied from panel below.' })
    } catch (error: any) { toast({ variant: 'destructive', title: 'Token generation failed', description: error?.message || 'Try again.' }) }
  }

  const handleTryLive = async (id: string, slug: string, botName: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest<{ token: string }>(`/api/chatbots/${id}/embed-token`, { method: 'POST', body: JSON.stringify({ name: 'dashboard-live-preview', expiresInDays: 30 }) })
      const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${appUrl}/bot/${slug}#token=${encodeURIComponent(data.token)}`
      setGeneratedToken(url); setGeneratedSlug(slug); setPreviewUrl(url); setPreviewName(botName)
      toast({ title: 'Live preview ready', description: 'Test the chatbot below before embedding it on your website.' })
    } catch (error: any) { toast({ variant: 'destructive', title: 'Live preview failed', description: error?.message || 'Try again.' }) }
  }

  const handleGenerateApiKey = async (id: string, slug: string) => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest<{ apiKey: string }>(`/api/chatbots/${id}/credentials`, { method: 'POST', body: JSON.stringify({ name: 'dashboard-generated', rotate: false }) })
      setGeneratedApiKey(data.apiKey); setGeneratedSlug(slug)
      toast({ title: 'API key generated', description: 'Store it safely. It is shown once.' })
    } catch (error: any) { toast({ variant: 'destructive', title: 'API key generation failed', description: error?.message || 'Try again.' }) }
  }

  const copyText = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    toast({ title: `${label} copied` })
  }

  const toggleEditDocumentSelection = (id: string) => {
    if (!details) return
    const set = new Set(details.documentIds || [])
    if (set.has(id)) set.delete(id); else set.add(id)
    setDetails({ ...details, documentIds: Array.from(set) })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading chatbots...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <CreateChatbotForm
        name={name}
        description={description}
        systemPrompt={systemPrompt}
        selectedDocumentIds={selectedDocumentIds}
        completedDocuments={completedDocuments}
        saving={saving}
        onNameChange={setName}
        onDescriptionChange={setDescription}
        onSystemPromptChange={setSystemPrompt}
        onToggleDocSelection={toggleDocSelection}
        onCreate={handleCreate}
      />

      <ChatbotList
        chatbots={chatbots}
        onRefresh={loadData}
        onDelete={handleDelete}
        onCopyHostedUrl={(url) => copyText(url, 'Hosted URL')}
        onGenerateToken={handleGenerateToken}
        onGenerateApiKey={handleGenerateApiKey}
        onTryLive={handleTryLive}
        onOpenEditor={openEditor}
      />

      {editingBotId && details && (
        <ChatbotEditor
          editingBotId={editingBotId}
          details={details}
          apiKeys={apiKeys}
          embedTokens={embedTokens}
          allowedOriginsInput={allowedOriginsInput}
          completedDocuments={completedDocuments}
          updatingBot={updatingBot}
          onDetailsChange={setDetails}
          onAllowedOriginsChange={setAllowedOriginsInput}
          onToggleEditDocSelection={toggleEditDocumentSelection}
          onSave={handleSaveBot}
          onClose={closeEditor}
          onRevokeApiKey={revokeApiKey}
          onRevokeEmbedToken={revokeEmbedToken}
        />
      )}

      <CredentialsPanel
        generatedToken={generatedToken}
        generatedApiKey={generatedApiKey}
        generatedSlug={generatedSlug}
        previewUrl={previewUrl}
        previewName={previewName}
        onCopyText={copyText}
      />
    </div>
  )
}
