'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Square, Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { MessageHighlight, MessageReference } from '@/types'

interface PublicChatbotProps {
  slug: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  references?: MessageReference[]
  highlights?: MessageHighlight[]
  serverMessageId?: string
}

interface StreamDebugEntry {
  id: number
  timestamp: string
  message: string
}

export function PublicChatbot({ slug }: PublicChatbotProps) {
  const streamDebugEnabled = process.env.NEXT_PUBLIC_STREAM_DEBUG === '1'
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [streamState, setStreamState] = useState<'idle' | 'streaming' | 'completed' | 'stopped'>(
    'idle'
  )
  const [activeStreamingMessageId, setActiveStreamingMessageId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('Document Chatbot')
  const [query, setQuery] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [responseFeedback, setResponseFeedback] = useState<Record<string, 'up' | 'down'>>({})
  const [autoRegenerateOnDislike, setAutoRegenerateOnDislike] = useState(true)
  const [streamDebugEntries, setStreamDebugEntries] = useState<StreamDebugEntry[]>([])
  const streamAbortRef = useRef<AbortController | null>(null)
  const streamStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const storageKey = `docscan.public-chat.${slug}`
  const { toast } = useToast()

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    if (!supabase) return {}
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.access_token) {
        return { Authorization: `Bearer ${session.access_token}` }
      }
    } catch {
      // Ignore auth header failures for public chatbot usage.
    }
    return {}
  }

  const token = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    const hashToken = window.location.hash.startsWith('#token=')
      ? decodeURIComponent(window.location.hash.slice('#token='.length))
      : ''
    return hashToken || params.get('token') || ''
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { sessionId?: string; messages?: Message[] }
      if (parsed.sessionId) {
        setSessionId(parsed.sessionId)
      }
      if (Array.isArray(parsed.messages)) {
        setMessages(parsed.messages.slice(-20))
      }
    } catch {
      // Ignore local session parsing errors.
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ sessionId, messages }))
    } catch {
      // Ignore local session persistence failures.
    }
  }, [messages, sessionId, storageKey])

  useEffect(() => {
    return () => {
      if (streamStateTimerRef.current) {
        clearTimeout(streamStateTimerRef.current)
      }
      streamAbortRef.current?.abort()
    }
  }, [])

  const scheduleStreamStateReset = (state: 'completed' | 'stopped') => {
    setStreamState(state)
    if (streamStateTimerRef.current) {
      clearTimeout(streamStateTimerRef.current)
    }
    streamStateTimerRef.current = setTimeout(() => {
      setStreamState('idle')
    }, 1800)
  }

  const addStreamDebugEntry = (message: string) => {
    if (!streamDebugEnabled) return
    const entry: StreamDebugEntry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      message,
    }
    setStreamDebugEntries((prev) => [...prev.slice(-23), entry])
  }

  const parseSsePayload = (line: string) => {
    if (!line.startsWith('data:')) return null
    const raw = line.slice(5).trim()
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const upsertAssistantMessage = (
    assistantMessageId: string,
    fields: {
      content?: string
      appendContent?: string
      references?: MessageReference[]
      highlights?: MessageHighlight[]
      serverMessageId?: string | null
    }
  ) => {
    setMessages((prev) => {
      const index = prev.findIndex((msg) => msg.id === assistantMessageId)

      if (index === -1) {
        return [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: fields.content ?? fields.appendContent ?? '',
          },
        ]
      }

      const current = prev[index]
      const next = [...prev]
      next[index] = {
        ...current,
        references: fields.references ?? current.references,
        highlights: fields.highlights ?? current.highlights,
        serverMessageId: fields.serverMessageId || current.serverMessageId,
        content:
          fields.content ??
          (fields.appendContent ? current.content + fields.appendContent : current.content),
      }
      return next
    })
  }

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('Missing token. Please use a valid chatbot URL.')
        setLoading(false)
        return
      }

      try {
        const authHeaders = await getAuthHeader()
        const res = await fetch(`/api/chatbots/runtime/info/${slug}`, {
          headers: {
            ...authHeaders,
            'x-embed-token': token,
          },
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load chatbot')
        }
        setName(data.name || 'Document Chatbot')
        setAutoRegenerateOnDislike(data.autoRegenerateOnDislike !== false)
      } catch (e: any) {
        setError(e?.message || 'Failed to load chatbot')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [slug, token])

  const sendMessage = async (
    overrideText?: string,
    options?: {
      improveFromFeedback?: { feedbackReason?: string; feedbackMessageId?: string }
    }
  ) => {
    const trimmed = (overrideText ?? query).trim()
    if (!trimmed || sending || !token) return

    const userMessage: Message = { id: `u-${Date.now()}`, role: 'user', content: trimmed }
    const nextMessages = [...messages, userMessage]
    const assistantMessageId = `a-${Date.now()}`
    const abortController = new AbortController()
    streamAbortRef.current = abortController

    if (streamStateTimerRef.current) {
      clearTimeout(streamStateTimerRef.current)
    }

    setMessages(nextMessages)
    if (!overrideText) {
      setQuery('')
    }
    setSending(true)
    setStreamState('streaming')
    setActiveStreamingMessageId(assistantMessageId)

    if (streamDebugEnabled) {
      setStreamDebugEntries([])
      addStreamDebugEntry(`Request started (${assistantMessageId})`)
    }

    let wasAborted = false
    let finishedSuccessfully = false

    try {
      const authHeaders = await getAuthHeader()
      const res = await fetch('/api/chatbots/runtime/query', {
        method: 'POST',
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-embed-token': token,
          ...authHeaders,
        },
        body: JSON.stringify({
          slug,
          query: trimmed,
          sessionId: sessionId || undefined,
          improveFromFeedback: options?.improveFromFeedback,
          history: nextMessages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      })

      if (!res.ok) {
        addStreamDebugEntry(`HTTP error ${res.status}`)
        const errorText = await res.text()
        let errorMessage = errorText || 'Failed to get response'
        try {
          const errorJson = JSON.parse(errorText)
          if (typeof errorJson?.error === 'string') {
            errorMessage = errorJson.error
          }
        } catch {
          // Keep text fallback.
        }
        throw new Error(errorMessage)
      }

      const contentType = res.headers.get('content-type') || ''
      addStreamDebugEntry(`Response content-type: ${contentType || 'unknown'}`)

      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let finalPayload: any = null
        let chunkCount = 0
        let totalChars = 0

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const part of parts) {
            const lines = part.split('\n')
            for (const line of lines) {
              const event = parseSsePayload(line)
              if (!event) continue

              if (event.type === 'chunk' && typeof event.content === 'string') {
                chunkCount += 1
                totalChars += event.content.length
                upsertAssistantMessage(assistantMessageId, { appendContent: event.content })
                if (chunkCount === 1 || chunkCount % 25 === 0) {
                  addStreamDebugEntry(`Chunks received: ${chunkCount}, chars: ${totalChars}`)
                }
              }

              if (event.type === 'done' && event.payload) {
                finalPayload = event.payload
                addStreamDebugEntry(
                  `Done event received after ${chunkCount} chunks (${totalChars} chars)`
                )
              }
            }
          }
        }

        if (!finalPayload) {
          throw new Error('Stream ended unexpectedly. Please try again.')
        }

        setSessionId((prev) => finalPayload.sessionId || prev)
        upsertAssistantMessage(assistantMessageId, {
          content: finalPayload.answer || '',
          references: finalPayload.references || [],
          highlights: finalPayload.highlights || [],
          serverMessageId: finalPayload.messageId || null,
        })
        finishedSuccessfully = true
        return
      }

      addStreamDebugEntry('Fell back to JSON response mode')

      const data = await res.json()

      setSessionId((prev) => data.sessionId || prev)
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: data.answer || '',
          references: data.references || [],
          highlights: data.highlights || [],
          serverMessageId: data.messageId || undefined,
        },
      ])
      finishedSuccessfully = true
    } catch (e: any) {
      const isAbort = e?.name === 'AbortError' || /abort/i.test(String(e?.message || ''))
      if (isAbort) {
        wasAborted = true
        addStreamDebugEntry('Stream aborted by user')
      } else {
        addStreamDebugEntry(`Stream error: ${e?.message || 'unknown error'}`)
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: 'assistant',
            content: e?.message || 'Something went wrong',
          },
        ])
      }
    } finally {
      setSending(false)
      setActiveStreamingMessageId(null)
      streamAbortRef.current = null

      if (wasAborted) {
        scheduleStreamStateReset('stopped')
      } else if (finishedSuccessfully) {
        scheduleStreamStateReset('completed')
        addStreamDebugEntry('Stream completed successfully')
      } else {
        setStreamState('idle')
      }
    }
  }

  const stopGenerating = () => {
    if (!sending || !streamAbortRef.current) return
    streamAbortRef.current.abort()
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(id)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleFeedback = async (id: string, type: 'up' | 'down') => {
    setResponseFeedback((prev) => ({ ...prev, [id]: type }))

    const assistantMessage = messages.find((msg) => msg.id === id)
    const previousUserMessage = getPreviousUserMessage(id)
    let feedbackReason = ''

    if (type === 'down') {
      const prompted = window.prompt('What should DocMind improve in this response?', '')
      if (prompted === null) return
      feedbackReason = prompted.trim().slice(0, 500)
    }

    try {
      const authHeaders = await getAuthHeader()
      await fetch('/api/chatbots/runtime/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-embed-token': token,
          ...authHeaders,
        },
        body: JSON.stringify({
          slug,
          sessionId: sessionId || undefined,
          appMessageId: assistantMessage?.serverMessageId || id,
          feedbackType: type,
          feedbackReason,
          queryText: previousUserMessage,
          responseText: assistantMessage?.content || '',
        }),
      })
    } catch {
      // Best-effort feedback persistence for public mode.
    }

    if (type === 'down' && previousUserMessage && autoRegenerateOnDislike) {
      toast({
        title: 'Improving response',
        description: 'Using your feedback to generate a better answer.',
      })
      await sendMessage(previousUserMessage, {
        improveFromFeedback: {
          feedbackReason,
          feedbackMessageId: assistantMessage?.serverMessageId || id,
        },
      })
      return
    }

    toast({
      title: type === 'up' ? 'Thanks for the feedback' : 'Feedback noted',
      description:
        type === 'up'
          ? 'Glad this response was helpful.'
          : 'We will use this to improve responses.',
    })
  }

  const getPreviousUserMessage = (assistantMessageId: string) => {
    const assistantIndex = messages.findIndex((msg) => msg.id === assistantMessageId)
    if (assistantIndex <= 0) return ''
    for (let index = assistantIndex - 1; index >= 0; index -= 1) {
      if (messages[index].role === 'user') {
        return messages[index].content
      }
    }
    return ''
  }

  const latestAssistantMessageId =
    [...messages].reverse().find((msg) => msg.role === 'assistant')?.id || null

  const handleRegenerate = (assistantMessageId: string) => {
    if (sending || assistantMessageId !== latestAssistantMessageId) return
    const previousUserMessage = getPreviousUserMessage(assistantMessageId)
    if (!previousUserMessage) return
    sendMessage(previousUserMessage)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/20 p-4 md:p-8 animate-in fade-in duration-500">
        <div className="max-w-3xl mx-auto space-y-4">
          <Card className="shadow-sm border-border overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <CardHeader className="border-b border-border/50">
              <div className="h-6 w-48 bg-muted/80 rounded-md animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col gap-4">
                <div className="h-12 w-3/4 max-w-sm bg-muted/40 rounded-2xl rounded-bl-none animate-pulse self-start mr-12" />
                <div className="h-16 w-2/3 max-w-md bg-primary/20 rounded-2xl rounded-br-none animate-pulse self-end ml-12" />
                <div className="h-10 w-1/2 max-w-xs bg-muted/40 rounded-2xl rounded-bl-none animate-pulse self-start mr-12" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-border overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="h-10 w-full bg-muted/30 rounded-xl animate-pulse" />
                <div className="h-10 w-12 bg-primary/30 rounded-xl animate-pulse shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
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
              <p className="text-sm text-muted-foreground">
                Ask any question related to linked documents.
              </p>
            )}
            {messages.map((message) => (
              <div key={message.id} className="space-y-1">
                <div
                  className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-12'
                      : 'bg-background border mr-12'
                  }`}
                >
                  {message.content}
                  {sending && activeStreamingMessageId === message.id && (
                    <span className="inline-block animate-pulse ml-0.5">▍</span>
                  )}

                  {message.role === 'assistant' &&
                    message.highlights &&
                    message.highlights.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Important Text
                        </p>
                        {message.highlights.slice(0, 4).map((item, idx) => (
                          <div
                            key={`${message.id}-h-${idx}`}
                            className="rounded-md border border-amber-300/40 bg-amber-50/70 dark:bg-amber-900/20 px-2.5 py-1.5"
                          >
                            <p className="text-xs leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                  {message.role === 'assistant' &&
                    message.references &&
                    message.references.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          References
                        </p>
                        {message.references.slice(0, 3).map((ref, idx) => (
                          <div
                            key={`${message.id}-r-${idx}`}
                            className="rounded-md border border-border/70 bg-secondary/30 px-2.5 py-1.5"
                          >
                            <p className="text-[11px] font-medium flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {ref.documentName}
                            </p>
                            {ref.snippet && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {ref.snippet}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {message.role === 'assistant' && (
                  <div className="mr-12 px-1 flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="p-1 rounded text-muted-foreground/70 hover:text-foreground hover:bg-secondary"
                      aria-label="Copy assistant response"
                      title="Copy"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'up')}
                      className={`p-1 rounded hover:bg-secondary ${
                        responseFeedback[message.id] === 'up'
                          ? 'text-primary'
                          : 'text-muted-foreground/70 hover:text-foreground'
                      }`}
                      aria-label="Mark response as helpful"
                      title="Helpful"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'down')}
                      className={`p-1 rounded hover:bg-secondary ${
                        responseFeedback[message.id] === 'down'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground/70 hover:text-foreground'
                      }`}
                      aria-label="Mark response as unhelpful"
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRegenerate(message.id)}
                      disabled={sending || message.id !== latestAssistantMessageId}
                      className="p-1 rounded text-muted-foreground/70 hover:text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Regenerate response"
                      title="Regenerate"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                )}
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
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <Button onClick={() => (sending ? stopGenerating() : sendMessage())}>
                {sending ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            {streamState !== 'idle' && (
              <p
                className={`mt-2 text-xs font-medium ${
                  streamState === 'streaming'
                    ? 'text-primary'
                    : streamState === 'completed'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {streamState === 'streaming'
                  ? 'Generating response...'
                  : streamState === 'completed'
                    ? 'Response complete.'
                    : 'Generation stopped.'}
              </p>
            )}
            {streamDebugEnabled && (
              <Card className="mt-3 border-border/70 bg-secondary/20">
                <div className="px-3 py-2 border-b border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Stream Diagnostics ({streamDebugEntries.length})
                  </p>
                </div>
                <div className="max-h-36 overflow-y-auto px-3 py-2 space-y-1">
                  {streamDebugEntries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No stream events yet.</p>
                  ) : (
                    streamDebugEntries.map((entry) => (
                      <p key={entry.id} className="text-xs text-muted-foreground">
                        <span className="text-foreground/80">[{entry.timestamp}]</span>{' '}
                        {entry.message}
                      </p>
                    ))
                  )}
                </div>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
