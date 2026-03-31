'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus } from 'lucide-react'

interface DocumentItem {
  id: string
  name: string
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
}

interface CreateChatbotFormProps {
  name: string
  description: string
  systemPrompt: string
  selectedDocumentIds: string[]
  completedDocuments: DocumentItem[]
  saving: boolean
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onSystemPromptChange: (v: string) => void
  onToggleDocSelection: (id: string) => void
  onCreate: () => void
}

export function CreateChatbotForm({
  name,
  description,
  systemPrompt,
  selectedDocumentIds,
  completedDocuments,
  saving,
  onNameChange,
  onDescriptionChange,
  onSystemPromptChange,
  onToggleDocSelection,
  onCreate,
}: CreateChatbotFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Custom Chatbot</CardTitle>
        <CardDescription>Link one or more processed documents and publish a hosted chatbot URL.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Chatbot Name</Label>
            <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Contract Assistant" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="Helps users understand contract clauses" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Guardrail System Prompt</Label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => onSystemPromptChange(e.target.value)}
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
                  onCheckedChange={() => onToggleDocSelection(doc.id)}
                />
                <span className="text-sm">{doc.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={onCreate} disabled={saving} className="rounded-full px-6">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Create Chatbot
        </Button>
      </CardContent>
    </Card>
  )
}
