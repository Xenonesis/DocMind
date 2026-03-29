'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import {
  Send,
  Bot,
  User,
  FileText,
  Loader2,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Trash2,
  MessageSquare,
  BookOpen,
  Brain,
  Zap,
  AlertCircle,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Document {
  id: string
  name: string
  type: string
  status: string
  size: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: Date
  docsUsed?: string[]
  provider?: string
  model?: string
  tokensUsed?: number
}

interface ChatInterfaceProps {
  documents: Document[]
  selectedProvider?: string
  onDocumentsChanged?: () => Promise<void> | void
}

type UploadResponse = {
  id: string
  name: string
  type: string
  size: string
  status: 'PROCESSING'
  uploadDate: string
  downloadURL: string
  storageRef: string
  processingStrategy: 'go' | 'node'
}

const SUGGESTED_PROMPTS = [
  { icon: BookOpen, text: 'Summarize all my uploaded documents' },
  { icon: Brain, text: 'What are the key findings across my documents?' },
  { icon: Zap, text: 'Compare the main topics in these documents' },
  { icon: FileText, text: 'List all important dates and deadlines mentioned' },
]

function MessageBubble({
  message,
  onCopy,
  copied,
}: {
  message: ChatMessage
  onCopy: (id: string, text: string) => void
  copied: string | null
}) {
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
          ${isUser
            ? 'bg-primary text-primary-foreground'
            : isError
            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
            : 'bg-secondary border border-border text-foreground'
          }`}
      >
        {isUser ? <User className="w-4 h-4" /> : isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`group max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3.5 rounded-2xl text-sm leading-relaxed overflow-hidden
            ${isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : isError
              ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 rounded-bl-sm whitespace-pre-wrap'
              : 'bg-card border border-border text-foreground rounded-bl-sm shadow-sm'
            }`}
        >
          {isUser || isError ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-muted-foreground/60">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {message.provider && (
            <Badge 
              variant="outline" 
              className={`text-[10px] h-4 px-1.5 font-normal ${
                message.provider?.includes('(free)') 
                ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5' 
                : 'border-border/50 text-muted-foreground/70'
              }`}
            >
              {message.provider}
            </Badge>
          )}

          {message.docsUsed && message.docsUsed.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal border-border/50 text-muted-foreground/70 gap-1">
              <FileText className="w-2.5 h-2.5" />
              {message.docsUsed.length} doc{message.docsUsed.length !== 1 ? 's' : ''}
            </Badge>
          )}

          {!isUser && !isError && (
            <button
              onClick={() => onCopy(message.id, message.content)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground/50 hover:text-muted-foreground"
              aria-label="Copy assistant response"
            >
              {copied === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-3 items-end"
      role="status"
      aria-live="polite"
    >
      <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shadow-sm">
        <Bot className="w-4 h-4 text-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function ChatInterface({ documents, selectedProvider, onDocumentsChanged }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [showDocPicker, setShowDocPicker] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const completedDocs = documents.filter(d => d.status === 'COMPLETED')

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming, scrollToBottom])

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleDoc = (id: string) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || isStreaming) return

    const assistantMessageId = `ai-${Date.now()}`

    const upsertAssistantMessage = (
      fields: Partial<ChatMessage> & { appendContent?: string }
    ) => {
      setMessages(prev => {
        const index = prev.findIndex(msg => msg.id === assistantMessageId)

        if (index === -1) {
          const newMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: fields.content ?? fields.appendContent ?? '',
            timestamp: new Date(),
            provider: fields.provider,
            model: fields.model,
            docsUsed: fields.docsUsed,
            tokensUsed: fields.tokensUsed,
          }
          return [...prev, newMessage]
        }

        const current = prev[index]
        const updated: ChatMessage = {
          ...current,
          ...fields,
          content: fields.content ?? (fields.appendContent ? current.content + fields.appendContent : current.content),
        }

        const next = [...prev]
        next[index] = updated
        return next
      })
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

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)

    try {
      const { authenticatedFetch } = await import('@/lib/api-client')
      const response = await authenticatedFetch('/api/query', {
        method: 'POST',
        body: JSON.stringify({
          query: text,
          documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
          history: messages.slice(-8).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
          provider: selectedProvider,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = errorText || 'Something went wrong. Please try again.'
        try {
          const errorJson = JSON.parse(errorText)
          if (typeof errorJson?.error === 'string') {
            errorMessage = errorJson.error
          }
        } catch {
          // Keep raw error text fallback.
        }
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let finalPayload: any = null
        let pendingProvider: string | undefined

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

              if (event.type === 'start') {
                if (typeof event.provider === 'string') {
                  pendingProvider = event.provider
                }
                continue
              }

              if (event.type === 'chunk') {
                if (typeof event.content === 'string') {
                  upsertAssistantMessage({ appendContent: event.content, provider: pendingProvider })
                }
                continue
              }

              if (event.type === 'done' && event.payload) {
                finalPayload = event.payload
              }
            }
          }
        }

        if (!finalPayload) {
          throw new Error('Stream ended unexpectedly. Please try again.')
        }

        const finalAnswer =
          typeof finalPayload?.response === 'string'
            ? finalPayload.response
            : finalPayload?.response?.answer || JSON.stringify(finalPayload?.response, null, 2)

        upsertAssistantMessage({
          content: finalAnswer,
          provider: finalPayload?.provider,
          model: finalPayload?.model,
          docsUsed: finalPayload?.response?.relevantDocuments || [],
          tokensUsed: finalPayload?.usage?.totalTokens,
        })

        return
      }

      const result = await response.json() as any

      if (result?.error) {
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          role: 'error',
          content: result.error,
          timestamp: new Date(),
        }])
        return
      }

      const answer =
        typeof result?.response === 'string'
          ? result.response
          : result?.response?.answer || JSON.stringify(result?.response, null, 2)

      const assistantMsg: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
        provider: result?.provider,
        model: result?.model,
        docsUsed: result?.response?.relevantDocuments || [],
        tokensUsed: result?.usage?.totalTokens,
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'error',
        content: err?.message || 'Something went wrong. Please try again.',
        timestamp: new Date(),
      }])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const openUploadPicker = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingFiles(true)

    try {
      const { authenticatedFetch } = await import('@/lib/api-client')
      const uploadedDocIds: string[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await authenticatedFetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          headers: {}
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || `Failed to upload ${file.name}`)
        }

        const result = await response.json() as UploadResponse
        uploadedDocIds.push(result.id)

        const processorEndpoint = result.processingStrategy === 'node'
          ? '/api/process-document-fallback'
          : '/api/process-document'

        authenticatedFetch(processorEndpoint, {
          method: 'POST',
          body: JSON.stringify({ documentId: result.id })
        }).then(async (processorResponse) => {
          if (!processorResponse.ok) {
            const errorText = await processorResponse.text()
            throw new Error(errorText || `Processing failed for ${result.name}`)
          }
        }).catch((processingError) => {
          console.error('Document processing error:', processingError)
        })
      }

      await onDocumentsChanged?.()
      if (uploadedDocIds.length > 0) {
        setSelectedDocIds(prev => Array.from(new Set([...prev, ...uploadedDocIds])))
        setShowDocPicker(true)
      }

      toast({
        title: 'Upload started',
        description: `${uploadedDocIds.length} document${uploadedDocIds.length === 1 ? '' : 's'} uploaded and queued for processing.`
      })
    } catch (uploadError: any) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: uploadError?.message || 'Unable to upload document(s). Please try again.'
      })
    } finally {
      setIsUploadingFiles(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full min-h-0">

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
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDocPicker(p => !p)}
            className="h-8 rounded-lg gap-1.5 text-xs"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {selectedDocIds.length > 0 ? `${selectedDocIds.length} doc${selectedDocIds.length > 1 ? 's' : ''} selected` : 'Select docs'}
            {showDocPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showDocPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4 shrink-0"
          >
            <Card className="p-3 border-border bg-secondary/20">
              <p className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider">
                {completedDocs.length === 0 ? 'No processed documents yet' : 'Filter context to specific documents (optional)'}
              </p>
              {completedDocs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {completedDocs.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => toggleDoc(doc.id)}
                      aria-label={`${selectedDocIds.includes(doc.id) ? 'Deselect' : 'Select'} document ${doc.name}`}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors
                        ${selectedDocIds.includes(doc.id)
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                        }`}
                    >
                      <FileText className="w-3 h-3" />
                      <span className="max-w-[160px] truncate">{doc.name}</span>
                      {selectedDocIds.includes(doc.id) && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                  {selectedDocIds.length > 0 && (
                    <button
                      onClick={() => setSelectedDocIds([])}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">Upload and process documents first to use them as context.</p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pr-2 scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-border">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5">
              <MessageSquare className="w-8 h-8 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Start a conversation</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm">
              Ask questions about your documents and get AI-powered insights instantly. 
              {completedDocs.length > 0 && <span className="block mt-1 text-primary/80">Using DocScan Glm-5 (free) automatically if no provider is set.</span>}
              {completedDocs.length === 0 && ' Upload a document first to get started.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p.text)}
                  disabled={completedDocs.length === 0}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background hover:bg-secondary/40 hover:border-primary/30 transition-all text-left group disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <p.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onCopy={handleCopy} copied={copied} />
            ))}
            {isStreaming && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 shrink-0">
        {selectedDocIds.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <Paperclip className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">
              Searching in {selectedDocIds.length} selected document{selectedDocIds.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        <div className="flex gap-3 items-end">
          <div className="relative flex-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.json,.xml,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={completedDocs.length === 0 ? 'Upload a document first to start chatting...' : 'Ask anything about your documents… (Enter to send)'}
              disabled={isStreaming || completedDocs.length === 0}
              aria-label="Ask a question about your documents"
              aria-busy={isStreaming}
              className="resize-none min-h-[56px] max-h-[200px] rounded-2xl bg-secondary/30 border-border/50 shadow-inner pl-14 pr-14 py-4 text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background transition-all"
              rows={1}
              style={{ height: 'auto' }}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 200) + 'px'
                }}
            />
            <Button
              onClick={openUploadPicker}
              disabled={isUploadingFiles}
              size="icon"
              variant="ghost"
              className="absolute left-2 bottom-2 h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
              aria-label="Upload documents"
            >
              {isUploadingFiles ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isStreaming || completedDocs.length === 0}
              size="icon"
              className={`absolute right-2 bottom-2 h-10 w-10 rounded-xl shadow-sm transition-all ${input.trim() ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground'}`}
              aria-label="Send message"
            >
              {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
          AI can make mistakes. Verify important information from your documents directly.
        </p>
      </div>
    </div>
  )
}
