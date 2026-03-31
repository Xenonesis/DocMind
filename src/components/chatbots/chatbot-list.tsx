'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, KeyRound, Link2, Pencil, PlayCircle, RefreshCw, Trash2 } from 'lucide-react'
import type { ChatbotItem } from '@/types'

interface ChatbotListProps {
  chatbots: ChatbotItem[]
  onRefresh: () => void
  onDelete: (id: string) => void
  onCopyHostedUrl: (url: string) => void
  onGenerateToken: (id: string, slug: string) => void
  onGenerateApiKey: (id: string, slug: string) => void
  onTryLive: (id: string, slug: string, name: string) => void
  onOpenEditor: (id: string) => void
}

export function ChatbotList({
  chatbots,
  onRefresh,
  onDelete,
  onCopyHostedUrl,
  onGenerateToken,
  onGenerateApiKey,
  onTryLive,
  onOpenEditor,
}: ChatbotListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Your Chatbots</CardTitle>
          <CardDescription>Generate hosted URL, embed token, and API key for integrations.</CardDescription>
        </div>
        <Button variant="outline" onClick={onRefresh} className="rounded-full">
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
              <Button variant="ghost" size="icon" onClick={() => onDelete(bot.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <Button variant="outline" onClick={() => onCopyHostedUrl(bot.hostedUrl)}>
                <Link2 className="w-4 h-4 mr-2" /> Copy Hosted URL
              </Button>
              <Button variant="outline" onClick={() => onGenerateToken(bot.id, bot.slug)}>
                <Copy className="w-4 h-4 mr-2" /> Generate Embed URL
              </Button>
              <Button variant="outline" onClick={() => onGenerateApiKey(bot.id, bot.slug)}>
                <KeyRound className="w-4 h-4 mr-2" /> Generate API Key
              </Button>
            </div>

            <div>
              <Button variant="secondary" onClick={() => onTryLive(bot.id, bot.slug, bot.name)}>
                <PlayCircle className="w-4 h-4 mr-2" /> Generate and Try Live
              </Button>
            </div>

            <div>
              <Button variant="secondary" onClick={() => onOpenEditor(bot.id)}>
                <Pencil className="w-4 h-4 mr-2" /> Configure Bot
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
