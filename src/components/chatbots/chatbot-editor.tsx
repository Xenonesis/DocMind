'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, ShieldX } from 'lucide-react'
import type { ChatbotDetails, SecretItem } from '@/types'

interface DocumentItem {
  id: string
  name: string
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
}

interface ChatbotEditorProps {
  editingBotId: string
  details: ChatbotDetails
  apiKeys: SecretItem[]
  embedTokens: SecretItem[]
  allowedOriginsInput: string
  completedDocuments: DocumentItem[]
  updatingBot: boolean
  onDetailsChange: (details: ChatbotDetails) => void
  onAllowedOriginsChange: (value: string) => void
  onToggleEditDocSelection: (id: string) => void
  onSave: () => void
  onClose: () => void
  onRevokeApiKey: (botId: string, keyId: string) => void
  onRevokeEmbedToken: (botId: string, tokenId: string) => void
}

export function ChatbotEditor({
  editingBotId,
  details,
  apiKeys,
  embedTokens,
  allowedOriginsInput,
  completedDocuments,
  updatingBot,
  onDetailsChange,
  onAllowedOriginsChange,
  onToggleEditDocSelection,
  onSave,
  onClose,
  onRevokeApiKey,
  onRevokeEmbedToken,
}: ChatbotEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Edit Chatbot: {details.name}</CardTitle>
        <CardDescription>Update guardrails, limits, documents, and credential lifecycle from one place.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={details.name} onChange={(e) => onDetailsChange({ ...details, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={details.description || ''} onChange={(e) => onDetailsChange({ ...details, description: e.target.value })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>System Prompt</Label>
          <Textarea value={details.system_prompt || ''} onChange={(e) => onDetailsChange({ ...details, system_prompt: e.target.value })} rows={3} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Refusal Message</Label>
            <Textarea value={details.refusal_message || ''} onChange={(e) => onDetailsChange({ ...details, refusal_message: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Fallback Message</Label>
            <Textarea value={details.fallback_message || ''} onChange={(e) => onDetailsChange({ ...details, fallback_message: e.target.value })} rows={2} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Bot requests/min</Label>
            <Input type="number" value={details.requests_per_minute_bot} onChange={(e) => onDetailsChange({ ...details, requests_per_minute_bot: Number(e.target.value || 0) })} />
          </div>
          <div className="space-y-2">
            <Label>Per IP requests/min</Label>
            <Input type="number" value={details.requests_per_minute_ip} onChange={(e) => onDetailsChange({ ...details, requests_per_minute_ip: Number(e.target.value || 0) })} />
          </div>
          <div className="space-y-2">
            <Label>Bot requests/day</Label>
            <Input type="number" value={details.requests_per_day_bot} onChange={(e) => onDetailsChange({ ...details, requests_per_day_bot: Number(e.target.value || 0) })} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Allowed Origins (one per line)</Label>
          <Textarea value={allowedOriginsInput} onChange={(e) => onAllowedOriginsChange(e.target.value)} rows={3} placeholder="https://your-site.com" />
        </div>

        <div className="space-y-2">
          <Label>Linked Documents</Label>
          <div className="border rounded-lg p-3 max-h-44 overflow-y-auto space-y-2">
            {completedDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2">
                <Checkbox
                  checked={details.documentIds.includes(doc.id)}
                  onCheckedChange={() => onToggleEditDocSelection(doc.id)}
                />
                <span className="text-sm">{doc.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={details.is_active}
            onCheckedChange={(checked) => onDetailsChange({ ...details, is_active: checked === true })}
          />
          <span className="text-sm">Bot is active</span>
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave} disabled={updatingBot}>
            {updatingBot ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
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
                    <Button size="sm" variant="outline" onClick={() => onRevokeApiKey(editingBotId, item.id)}>
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
                    <Button size="sm" variant="outline" onClick={() => onRevokeEmbedToken(editingBotId, item.id)}>
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
  )
}
