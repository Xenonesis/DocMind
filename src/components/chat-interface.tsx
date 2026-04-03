'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Trash2,
} from 'lucide-react'
import type { Document, ChatMessage, StreamDebugEntry, UploadResponse } from '@/types'
import { MessageBubble } from './chat/message-bubble'
import { ChatTypingSkeleton } from './chat/chat-typing-skeleton'
import { DocPicker } from './chat/doc-picker'
import { ChatEmptyState } from './chat/empty-state'
import { ChatInput } from './chat/chat-input'

interface ChatInterfaceProps {
  documents: Document[]
  selectedProvider?: string
  onDocumentsChanged?: () => Promise<void> | void
  initialQuery?: string
  initialSelectedText?: string
  initialDocumentId?: string
  autoSendInitial?: boolean
}

export function ChatInterface({
  documents,
  selectedProvider,
  onDocumentsChanged,
  initialQuery,
  initialSelectedText,
  initialDocumentId,
  autoSendInitial,
}: ChatInterfaceProps) {
  const streamDebugEnabled = process.env.NEXT_PUBLIC_STREAM_DEBUG === '1'
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamState, setStreamState] = useState<'idle' | 'streaming' | 'completed' | 'stopped'>('idle')
  const [activeStreamingMessageId, setActiveStreamingMessageId] = useState<string | null>(null)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [responseFeedback, setResponseFeedback] = useState<Record<string, 'up' | 'down'>>({})
  const [streamDebugEntries, setStreamDebugEntries] = useState<StreamDebugEntry[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [initialAskSent, setInitialAskSent] = useState(false)
  const [autoRegenerateOnDislike, setAutoRegenerateOnDislike] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const streamStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()
  const completedDocs = documents.filter(d => d.status === 'COMPLETED')

  // ── Scrolling & Cleanup ───────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, isStreaming, scrollToBottom])

  useEffect(() => {
    return () => {
      if (streamStateTimerRef.current) clearTimeout(streamStateTimerRef.current)
      streamAbortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { authenticatedRequest } = await import('@/lib/api-client')
        const prefs = await authenticatedRequest<{ auto_regenerate_on_dislike?: boolean }>('/api/settings/response-preferences')
        setAutoRegenerateOnDislike(prefs?.auto_regenerate_on_dislike !== false)
      } catch {
        setAutoRegenerateOnDislike(true)
      }
    }

    loadPreferences()
  }, [])

  const scheduleStreamStateReset = useCallback((state: 'completed' | 'stopped') => {
    setStreamState(state)
    if (streamStateTimerRef.current) clearTimeout(streamStateTimerRef.current)
    streamStateTimerRef.current = setTimeout(() => setStreamState('idle'), 1800)
  }, [])

  const addStreamDebugEntry = useCallback((message: string) => {
    if (!streamDebugEnabled) return
    setStreamDebugEntries(prev => [...prev.slice(-23), {
      id: Date.now() + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
    }])
  }, [streamDebugEnabled])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleDoc = (id: string) => {
    setSelectedDocIds(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  const handleFeedback = async (id: string, type: 'up' | 'down') => {
    setResponseFeedback(prev => ({ ...prev, [id]: type }))

    const assistantIndex = messages.findIndex(m => m.id === id)
    if (assistantIndex < 0) return

    const assistantMessage = messages[assistantIndex]
    const previousUserMessage = [...messages.slice(0, assistantIndex)].reverse().find(m => m.role === 'user')
    const queryText = previousUserMessage?.content || ''

    let feedbackReason = ''
    if (type === 'down') {
      const prompted = window.prompt('Tell DocMind what was wrong so it can improve the next response:', '')
      if (prompted === null) return
      feedbackReason = prompted.trim().slice(0, 500)
    }

    try {
      const { authenticatedFetch } = await import('@/lib/api-client')
      await authenticatedFetch('/api/chat/feedback', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: activeSessionId,
          appMessageId: id,
          feedbackType: type,
          feedbackReason,
          queryText,
          responseText: assistantMessage.content,
        }),
      })

      if (type === 'down' && queryText && autoRegenerateOnDislike) {
        toast({
          title: 'Thanks for the feedback',
          description: 'Generating an improved response using your feedback.',
        })
        await sendMessage(queryText, {
          improveFromFeedback: {
            feedbackReason,
            feedbackMessageId: id,
          },
        })
      } else if (type === 'down') {
        toast({
          title: 'Feedback saved',
          description: 'Auto-regeneration is disabled in AI Service Integration settings.',
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Feedback not saved',
        description: 'Could not store feedback. Please try again.',
      })
    }
  }

  const clearChat = () => {
    setMessages([])
    setResponseFeedback({})
    setActiveSessionId(null)
  }

  // ── SSE Streaming ─────────────────────────────────────────────────────────
  const sendMessage = async (
    overrideText?: string,
    options?: {
      selectedTextContext?: { text: string; documentId?: string }
      improveFromFeedback?: { feedbackReason?: string; feedbackMessageId?: string }
    }
  ) => {
    const text = (overrideText ?? input).trim()
    if (!text || isStreaming) return

    const assistantMessageId = `ai-${Date.now()}`

    const upsertAssistantMessage = (fields: Partial<ChatMessage> & { appendContent?: string }) => {
      setMessages(prev => {
        const index = prev.findIndex(msg => msg.id === assistantMessageId)
        if (index === -1) {
          return [...prev, {
            id: assistantMessageId, role: 'assistant',
            content: fields.content ?? fields.appendContent ?? '',
            timestamp: new Date(), provider: fields.provider, model: fields.model,
            docsUsed: fields.docsUsed, tokensUsed: fields.tokensUsed,
            references: fields.references, highlights: fields.highlights,
          } as ChatMessage]
        }
        const current = prev[index]
        const next = [...prev]
        next[index] = {
          ...current, ...fields,
          content: fields.content ?? (fields.appendContent ? current.content + fields.appendContent : current.content),
        }
        return next
      })
    }

    const parseSsePayload = (line: string) => {
      if (!line.startsWith('data:')) return null
      const raw = line.slice(5).trim()
      if (!raw) return null
      try { return JSON.parse(raw) } catch { return null }
    }

    setMessages(prev => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date() } as ChatMessage])
    setInput('')
    setIsStreaming(true)
    setStreamState('streaming')
    setActiveStreamingMessageId(assistantMessageId)
    if (streamStateTimerRef.current) clearTimeout(streamStateTimerRef.current)

    const abortController = new AbortController()
    streamAbortRef.current = abortController
    if (streamDebugEnabled) { setStreamDebugEntries([]); addStreamDebugEntry(`Request started (${assistantMessageId})`) }

    let wasAborted = false
    let finishedSuccessfully = false

    try {
      const { authenticatedFetch } = await import('@/lib/api-client')
      const response = await authenticatedFetch('/api/query', {
        method: 'POST',
        signal: abortController.signal,
        body: JSON.stringify({
          query: text,
          sessionId: activeSessionId || undefined,
          selectedTextContext: options?.selectedTextContext,
          improveFromFeedback: options?.improveFromFeedback,
          documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
          history: messages.slice(-8).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          provider: selectedProvider,
          stream: true,
        }),
      })

      if (!response.ok) {
        addStreamDebugEntry(`HTTP error ${response.status}`)
        const errorText = await response.text()
        let errorMessage = errorText || 'Something went wrong. Please try again.'
        try { const ej = JSON.parse(errorText); if (typeof ej?.error === 'string') errorMessage = ej.error } catch {}
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get('content-type') || ''
      addStreamDebugEntry(`Response content-type: ${contentType || 'unknown'}`)

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let finalPayload: any = null
        let pendingProvider: string | undefined
        let chunkCount = 0
        let totalChars = 0

        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const part of parts) {
            for (const line of part.split('\n')) {
              const event = parseSsePayload(line)
              if (!event) continue
              if (event.type === 'start') { if (typeof event.provider === 'string') { pendingProvider = event.provider; addStreamDebugEntry(`Stream start from provider: ${event.provider}`) }; continue }
              if (event.type === 'chunk') { if (typeof event.content === 'string') { chunkCount += 1; totalChars += event.content.length; upsertAssistantMessage({ appendContent: event.content, provider: pendingProvider }); if (chunkCount === 1 || chunkCount % 25 === 0) addStreamDebugEntry(`Chunks received: ${chunkCount}, chars: ${totalChars}`) }; continue }
              if (event.type === 'done' && event.payload) { finalPayload = event.payload; addStreamDebugEntry(`Done event received after ${chunkCount} chunks (${totalChars} chars)`) }
            }
          }
        }

        if (!finalPayload) throw new Error('Stream ended unexpectedly. Please try again.')

        const finalAnswer = typeof finalPayload?.response === 'string' ? finalPayload.response : finalPayload?.response?.answer || JSON.stringify(finalPayload?.response, null, 2)
        if (typeof finalPayload?.sessionId === 'string') {
          setActiveSessionId(finalPayload.sessionId)
        }
        upsertAssistantMessage({
          content: finalAnswer, provider: finalPayload?.provider, model: finalPayload?.model,
          docsUsed: finalPayload?.response?.relevantDocuments || [], tokensUsed: finalPayload?.usage?.totalTokens,
          references: finalPayload?.response?.references || [],
          highlights: finalPayload?.response?.highlights || [],
        })
        finishedSuccessfully = true
        return
      }

      addStreamDebugEntry('Fell back to JSON response mode')
      const result = await response.json() as any
      if (result?.error) { setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'error', content: result.error, timestamp: new Date() } as ChatMessage]); return }

      const answer = typeof result?.response === 'string' ? result.response : result?.response?.answer || JSON.stringify(result?.response, null, 2)
      if (typeof result?.sessionId === 'string') {
        setActiveSessionId(result.sessionId)
      }
      setMessages(prev => [...prev, {
        id: assistantMessageId, role: 'assistant', content: answer, timestamp: new Date(),
        provider: result?.provider,
        model: result?.model,
        docsUsed: result?.response?.relevantDocuments || [],
        references: result?.response?.references || [],
        highlights: result?.response?.highlights || [],
        tokensUsed: result?.usage?.totalTokens,
      } as ChatMessage])
      finishedSuccessfully = true
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError' || /abort/i.test(String(err?.message || ''))
      if (isAbort) { wasAborted = true; addStreamDebugEntry('Stream aborted by user') }
      else { addStreamDebugEntry(`Stream error: ${err?.message || 'unknown error'}`); setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'error', content: err?.message || 'Something went wrong. Please try again.', timestamp: new Date() } as ChatMessage]) }
    } finally {
      setIsStreaming(false); setActiveStreamingMessageId(null); streamAbortRef.current = null
      if (wasAborted) scheduleStreamStateReset('stopped')
      else if (finishedSuccessfully) { scheduleStreamStateReset('completed'); addStreamDebugEntry('Stream completed successfully') }
      else setStreamState('idle')
    }
  }

  useEffect(() => {
    if (!autoSendInitial || initialAskSent || isStreaming) return
    if (!initialQuery || !initialQuery.trim()) return

    if (initialDocumentId) {
      setSelectedDocIds(prev => prev.includes(initialDocumentId) ? prev : [...prev, initialDocumentId])
    }

    setInitialAskSent(true)
    sendMessage(initialQuery, {
      selectedTextContext: initialSelectedText
        ? {
            text: initialSelectedText,
            documentId: initialDocumentId,
          }
        : undefined,
    })
  }, [
    autoSendInitial,
    initialAskSent,
    isStreaming,
    initialQuery,
    initialSelectedText,
    initialDocumentId,
  ])

  const stopGenerating = () => { if (!isStreaming || !streamAbortRef.current) return; streamAbortRef.current.abort() }

  // ── File Upload ───────────────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsUploadingFiles(true)
    try {
      const { authenticatedFetch } = await import('@/lib/api-client')
      const uploadedDocIds: string[] = []
      for (const file of Array.from(files)) {
        const formData = new FormData(); formData.append('file', file)
        const response = await authenticatedFetch('/api/documents/upload', { method: 'POST', body: formData, headers: {} })
        if (!response.ok) { const errorText = await response.text(); throw new Error(errorText || `Failed to upload ${file.name}`) }
        const result = await response.json() as UploadResponse
        uploadedDocIds.push(result.id)
        const processorEndpoint = result.processingStrategy === 'node' ? '/api/process-document-fallback' : '/api/process-document'
        authenticatedFetch(processorEndpoint, { method: 'POST', body: JSON.stringify({ documentId: result.id }) })
          .then(async r => { if (!r.ok) throw new Error(await r.text() || `Processing failed for ${result.name}`) })
          .catch(e => console.error('Document processing error:', e))
      }
      await onDocumentsChanged?.()
      if (uploadedDocIds.length > 0) { setSelectedDocIds(prev => Array.from(new Set([...prev, ...uploadedDocIds]))); setShowDocPicker(true) }
      toast({ title: 'Upload started', description: `${uploadedDocIds.length} document${uploadedDocIds.length === 1 ? '' : 's'} uploaded and queued for processing.` })
    } catch (uploadError: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: uploadError?.message || 'Unable to upload document(s). Please try again.' })
    } finally {
      setIsUploadingFiles(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Derived State ─────────────────────────────────────────────────────────
  const isEmpty = messages.length === 0
  const hasActiveStreamingMessage = !!activeStreamingMessageId && messages.some(msg => msg.id === activeStreamingMessageId)
  const latestAssistantMessageId = [...messages].reverse().find(msg => msg.role === 'assistant')?.id || null
  const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')?.content || ''

  const handleRegenerate = () => { if (!lastUserMessage || isStreaming) return; sendMessage(lastUserMessage) }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AI Document Chat</p>
            <p className="text-xs text-muted-foreground">Ask anything about your uploaded documents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive h-8 rounded-lg" aria-label="Clear chat history">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowDocPicker(p => !p)} className="h-8 rounded-lg gap-1.5 text-xs">
            <Paperclip className="w-3.5 h-3.5" />
            {selectedDocIds.length > 0 ? `${selectedDocIds.length} doc${selectedDocIds.length > 1 ? 's' : ''} selected` : 'Select docs'}
            {showDocPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Document Picker */}
      <DocPicker
        show={showDocPicker}
        completedDocs={completedDocs}
        selectedDocIds={selectedDocIds}
        onToggleDoc={toggleDoc}
        onClearSelection={() => setSelectedDocIds([])}
      />

      {/* Messages / Empty State */}
      <div className="flex-1 min-h-0 overflow-y-auto px-1 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
        {isEmpty ? (
          <ChatEmptyState completedDocs={completedDocs} onSendMessage={sendMessage} />
        ) : (
          <div className="space-y-5 py-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onCopy={handleCopy}
                onFeedback={handleFeedback}
                feedback={responseFeedback[msg.id] || null}
                onRegenerate={handleRegenerate}
                canRegenerate={msg.id === latestAssistantMessageId && !isStreaming}
                copied={copied}
                showStreamingCursor={msg.id === activeStreamingMessageId && hasActiveStreamingMessage}
              />
            ))}
            <AnimatePresence>
              {isStreaming && !hasActiveStreamingMessage && <ChatTypingSkeleton />}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput
        input={input}
        onInputChange={setInput}
        isStreaming={isStreaming}
        completedDocs={completedDocs}
        selectedDocIds={selectedDocIds}
        streamState={streamState}
        isUploadingFiles={isUploadingFiles}
        streamDebugEnabled={streamDebugEnabled}
        streamDebugEntries={streamDebugEntries}
        onSendMessage={() => sendMessage()}
        onStopGenerating={stopGenerating}
        onFileSelect={handleFileSelect}
      />
    </div>
  )
}
