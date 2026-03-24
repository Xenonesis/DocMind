'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Send } from 'lucide-react'

interface PublicChatbotProps {
  slug: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function PublicChatbot({ slug }: PublicChatbotProps) {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('Document Chatbot')
  const [query, setQuery] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])

  const token = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    return params.get('token') || ''
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('Missing token. Please use a valid chatbot URL.')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/chatbots/runtime/info/${slug}?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load chatbot')
        }
        setName(data.name || 'Document Chatbot')
      } catch (e: any) {
        setError(e?.message || 'Failed to load chatbot')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug, token])

  const sendMessage = async () => {
    const trimmed = query.trim()
    if (!trimmed || sending || !token) return

    const userMessage: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setQuery('')
    setSending(true)

    try {
      const res = await fetch('/api/chatbots/runtime/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-embed-token': token,
        },
        body: JSON.stringify({
          slug,
          query: trimmed,
          sessionId: sessionId || undefined,
          history: nextMessages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to get response')
      }

      setSessionId(data.sessionId || sessionId)
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: data.answer || '' }])
    } catch (e: any) {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: e?.message || 'Something went wrong' }])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Chatbot Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/20 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Ask any question related to linked documents.</p>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-12'
                    : 'bg-background border mr-12'
                }`}
              >
                {message.content}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about your documents..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <Button onClick={sendMessage} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
