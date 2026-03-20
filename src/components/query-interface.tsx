'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Send, 
  Brain,
  Search,
  AlertCircle,
  Settings,
  Server,
  X,
  Mic,
  MicOff,
  RefreshCw,
  FileText,
  Terminal,
  Clock,
  CheckCircle,
  Cpu,
  Cloud,
  Shield,
  MessageSquare
} from 'lucide-react'

interface QueryInterfaceProps {
  query: string
  setQuery: (query: string) => void
  isProcessing: boolean
  documents?: Array<{
    id: string
    name: string
    status?: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
  }>
  onSubmit: (payload: { query: string; documentIds: string[]; provider?: string }) => void
}

interface AIProvider {
  id: string
  name: string
  type: string
  model: string
  isActive: boolean
  isConfigured: boolean
}

export function QueryInterface({ query, setQuery, isProcessing, documents = [], onSubmit }: QueryInterfaceProps) {
  const [currentProvider, setCurrentProvider] = useState<AIProvider | null>(null)
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')

  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const fetchCurrentProvider = async () => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest('/api/settings')
      
      const mapped: AIProvider[] = data.map((p: any) => {
        const raw = (p.provider || '').toString()
        const lower = raw.toLowerCase()
        const type = lower === 'openrouter' ? 'open-router' : (lower as any)
        return {
          id: p.id,
          name: `${p.provider} (${p.model || ''})`,
          type,
          model: p.model || '',
          isActive: !!p.isActive,
          isConfigured: !!p.apiKey && typeof p.apiKey === 'string' && p.apiKey.length > 0
        }
      })
      
      const configuredProviders = mapped.filter(p => p.isConfigured)
      setProviders(configuredProviders)
      const active = configuredProviders.find((p: any) => p.isActive)
      if (active) {
        setCurrentProvider({
          id: active.id,
          name: active.name,
          type: active.type,
          model: active.model,
          isActive: true,
          isConfigured: true
        })
        setSelectedProviderId(active.id)
        return
      }
      
      setCurrentProvider(null)
    } catch (error) {
      console.error('Error fetching current provider:', error)
    }
  }

  useEffect(() => {
    fetchCurrentProvider()
  }, [])

  const handleSubmit = () => {
    if (query.trim()) {
      onSubmit({ query, documentIds: selectedDocumentIds, provider: selectedProviderId || undefined })
    }
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google': return <Cloud className="w-4 h-4 text-blue-500" />
      case 'mistral': return <Cloud className="w-4 h-4 text-orange-500" />
      case 'lm-studio': return <Server className="w-4 h-4 text-slate-500" />
      case 'ollama': return <Cpu className="w-4 h-4 text-slate-500" />
      case 'open-router': return <Cloud className="w-4 h-4 text-indigo-500" />
      case 'openai': return <Brain className="w-4 h-4 text-emerald-500" />
      case 'anthropic': return <Shield className="w-4 h-4 text-rose-500" />
      default: return <Brain className="w-4 h-4 text-primary" />
    }
  }

  const completedDocuments = useMemo(() => (documents || []).filter(d => d.status ? d.status === 'COMPLETED' : true), [documents])
  const filteredMentionDocs = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase()
    if (!q) return completedDocuments.slice(0, 8)
    return completedDocuments.filter(d => d.name.toLowerCase().includes(q)).slice(0, 8)
  }, [mentionQuery, completedDocuments])

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newValue = query.substring(0, start) + text + query.substring(end)
    setQuery(newValue)
    const newPos = start + text.length
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = newPos
      el.focus()
    })
  }

  const onTextareaChange = (value: string) => {
    setQuery(value)
    const el = textareaRef.current
    const caret = el ? el.selectionStart : value.length
    const before = value.slice(0, caret)
    const lastAt = before.lastIndexOf('@')
    if (lastAt >= 0) {
      const afterAt = before.slice(lastAt + 1)
      if (/^[^\s@]{0,64}$/.test(afterAt)) {
        setShowMentionList(true)
        setMentionQuery(afterAt)
        return
      }
    }
    setShowMentionList(false)
    setMentionQuery('')
  }

  const handleSelectMention = (doc: { id: string; name: string }) => {
    const el = textareaRef.current
    if (!el) return
    const caret = el.selectionStart
    const before = query.slice(0, caret)
    const lastAt = before.lastIndexOf('@')
    if (lastAt >= 0) {
      const beforeAt = query.slice(0, lastAt)
      const afterCaret = query.slice(caret)
      const insertText = `@${doc.name} `
      setQuery(beforeAt + insertText + afterCaret)
      setSelectedDocumentIds(prev => Array.from(new Set([...prev, doc.id])))
      requestAnimationFrame(() => {
        const pos = (beforeAt + insertText).length
        el.selectionStart = el.selectionEnd = pos
        el.focus()
      })
    } else {
      insertAtCursor(`@${doc.name} `)
      setSelectedDocumentIds(prev => Array.from(new Set([...prev, doc.id])))
    }
    setShowMentionList(false)
    setMentionQuery('')
  }

  const removeSelectedDoc = (docId: string) => {
    setSelectedDocumentIds(prev => prev.filter(id => id !== docId))
  }

  const toggleVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(query + (query ? ' ' : '') + transcript)
    }

    recognition.start()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Query Engine</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Ask questions, summarize, or extract data from your documents using AI.
          </p>
        </div>
      </div>

      {providers.length === 0 && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2 font-medium">
            No active AI models found. Please configure a provider in <a href="/dashboard" onClick={(e) => { e.preventDefault(); document.getElementById('tab-settings')?.click() }} className="underline underline-offset-2">Settings</a> to enable querying.
          </AlertDescription>
        </Alert>
      )}

      <Card className="flex-1 shadow-sm border-border bg-card flex flex-col overflow-visible">
        <CardContent className="p-6 flex flex-col h-full gap-6">
          <div className="flex-1 relative flex flex-col">
            <div className="relative flex-1 rounded-2xl border border-border bg-background focus-within:ring-1 focus-within:ring-primary focus-within:border-primary shadow-sm transition-all overflow-hidden flex flex-col">
              <Textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => onTextareaChange(e.target.value)}
                placeholder="Ask anything... (use @ to target specific documents)"
                className="flex-1 min-h-[220px] text-base border-0 focus-visible:ring-0 resize-none p-5 bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
                }}
              />
              
              {/* Controls inside textarea bottom */}
              <div className="flex items-center justify-between p-3 bg-secondary/20 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={toggleVoiceRecognition}
                    variant="ghost"
                    size="icon"
                    className={`rounded-full hover:bg-secondary transition-colors ${isListening ? 'text-destructive bg-destructive/10 animate-pulse' : 'text-muted-foreground'}`}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                  <Tooltip text="Tip: Press Ctrl+Enter to submit instantly" />
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing || !query.trim() || providers.length === 0}
                  className="rounded-full px-6 font-medium shadow-sm"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit Query
                </Button>
              </div>
            </div>
            
            {/* Mention Dropdown */}
            {showMentionList && (
              <div className="absolute left-4 bottom-16 mb-2 w-80 z-20 border border-border bg-card rounded-xl shadow-lg overflow-hidden">
                <div className="bg-secondary/50 px-3 py-2 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Documents
                </div>
                <div className="max-h-48 overflow-auto py-1">
                  {filteredMentionDocs.length === 0 ? (
                    <div className="px-4 py-3 text-center text-sm text-muted-foreground">No documents found</div>
                  ) : (
                    filteredMentionDocs.map(doc => (
                      <button
                        key={doc.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/80 flex items-center gap-2.5 transition-colors"
                        onMouseDown={(e) => { e.preventDefault(); handleSelectMention(doc) }}
                      >
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            {/* Selected Documents */}
            {selectedDocumentIds.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Targeting:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDocumentIds.map(id => {
                    const doc = documents?.find(d => d.id === id)
                    if (!doc) return null
                    return (
                      <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1 rounded-full font-medium gap-1 flex items-center shadow-sm border border-border/50 bg-background hover:bg-secondary/80">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span className="max-w-[150px] truncate">{doc.name}</span>
                        <button 
                          onClick={() => removeSelectedDoc(id)} 
                          className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Provider Selection */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2 rounded-lg bg-secondary/50 text-muted-foreground">
                  <Cpu className="w-4 h-4" />
                </div>
                <Select
                  value={selectedProviderId || ''}
                  onValueChange={setSelectedProviderId}
                  disabled={providers.length === 0}
                >
                  <SelectTrigger className="w-full sm:w-[280px] bg-background border-border shadow-sm rounded-xl h-10 text-sm focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border">
                    {providers.map(p => (
                      <SelectItem key={p.id} value={p.id} className="py-2">
                        <div className="flex items-center gap-2.5">
                          {getProviderIcon(p.type)}
                          <span className="font-medium text-sm">{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                {isProcessing ? (
                  <><RefreshCw className="w-3 h-3 animate-spin"/> Processing...</>
                ) : (
                  <><CheckCircle className="w-3 h-3 text-green-500"/> System Ready</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="text-xs text-muted-foreground hidden sm:block">
      {text}
    </span>
  )
}
