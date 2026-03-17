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
  Shield
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
      case 'google': return <Cloud className="w-4 h-4" />
      case 'mistral': return <Cloud className="w-4 h-4" />
      case 'lm-studio': return <Server className="w-4 h-4" />
      case 'ollama': return <Cpu className="w-4 h-4" />
      case 'open-router': return <Cloud className="w-4 h-4" />
      case 'openai': return <Brain className="w-4 h-4" />
      case 'anthropic': return <Shield className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
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
    <div className="max-w-[1200px] mx-auto space-y-8 font-mono">
      {/* Hero Section */}
      <div className="border-4 border-foreground bg-accent text-accent-foreground p-8 brutal-shadow">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 flex items-center gap-4">
          <Terminal className="w-12 h-12" />
          QUERY_ENGINE
        </h1>
        <p className="text-xl font-bold uppercase opacity-90 max-w-2xl">
          Execute natural language parameters against vectorized index.
        </p>
      </div>

      {/* No Providers Warning */}
      {providers.length === 0 && (
        <Alert className="border-4 border-destructive bg-destructive/10 text-destructive font-bold uppercase rounded-none brutal-shadow">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="ml-4">
            ERR_NO_PROVIDERS: Navigate to{' '}
            <a href="/settings" className="underline decoration-2">SYS_CONFIG</a>{' '}
            to assign LLM backend.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Query Interface */}
      <Card className="border-4 border-foreground bg-background rounded-none brutal-shadow">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => onTextareaChange(e.target.value)}
                  placeholder="[ ENTER QUERY STRING ] use @ to target specific nodes..."
                  className="min-h-[180px] text-lg font-bold border-4 border-foreground bg-background rounded-none p-6 focus-visible:ring-0 focus-visible:border-accent brutal-shadow-sm uppercase"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
                  }}
                />
                
                {/* Mention Dropdown */}
                {showMentionList && (
                  <div className="absolute left-0 top-full mt-2 w-full z-20 border-4 border-foreground bg-background brutal-shadow">
                    <div className="max-h-48 overflow-auto">
                      {filteredMentionDocs.length === 0 ? (
                        <div className="p-4 text-center font-bold opacity-50 uppercase">404_NOT_FOUND</div>
                      ) : (
                        filteredMentionDocs.map(doc => (
                          <button
                            key={doc.id}
                            className="w-full text-left px-4 py-3 hover:bg-foreground hover:text-background font-bold uppercase flex items-center gap-3 border-b-2 border-foreground/20 last:border-0"
                            onMouseDown={(e) => { e.preventDefault(); handleSelectMention(doc) }}
                          >
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{doc.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col gap-4">
                <Button
                  onClick={toggleVoiceRecognition}
                  variant="outline"
                  className={`h-16 md:h-1/2 rounded-none border-4 border-foreground uppercase font-black tracking-widest brutal-shadow ${isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-background hover:bg-accent hover:text-white'}`}
                >
                  {isListening ? <MicOff className="w-6 h-6 md:mr-2" /> : <Mic className="w-6 h-6 md:mr-2" />}
                  <span className="hidden md:inline">{isListening ? 'HALT' : 'AUDIO'}</span>
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing || !query.trim() || providers.length === 0}
                  className="h-16 md:h-1/2 flex-1 rounded-none border-4 border-foreground bg-foreground text-background hover:bg-accent hover:text-white font-black uppercase tracking-widest brutal-shadow disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-6 h-6 animate-spin md:mr-2" /> : <Send className="w-6 h-6 md:mr-2" />}
                  <span className="hidden md:inline">EXECUTE</span>
                </Button>
              </div>
            </div>

            {/* Selected Documents */}
            {selectedDocumentIds.length > 0 && (
              <div className="pt-6 border-t-4 border-foreground">
                <p className="text-sm font-black uppercase mb-3">TARGET_NODES:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDocumentIds.map(id => {
                    const doc = documents?.find(d => d.id === id)
                    if (!doc) return null
                    return (
                      <Badge key={id} className="rounded-none border-2 border-foreground bg-accent text-white font-bold px-3 py-1 flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        {doc.name}
                        <button onClick={() => removeSelectedDoc(id)} className="ml-2 hover:text-black">
                          <X className="w-4 h-4" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Provider Selection */}
            <div className="pt-6 border-t-4 border-foreground flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <Server className="w-6 h-6" />
                <Select
                  value={selectedProviderId || ''}
                  onValueChange={setSelectedProviderId}
                  disabled={providers.length === 0}
                >
                  <SelectTrigger className="w-full md:w-[300px] border-4 border-foreground rounded-none font-bold uppercase uppercase py-6 brutal-shadow-sm focus:ring-0">
                    <SelectValue placeholder="SELECT_BACKEND" />
                  </SelectTrigger>
                  <SelectContent className="border-4 border-foreground rounded-none font-mono uppercase font-bold">
                    {providers.map(p => (
                      <SelectItem key={p.id} value={p.id} className="flex items-center gap-2 py-3">
                        <span className="flex items-center gap-2">
                          {getProviderIcon(p.type)}
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm font-bold uppercase opacity-70">
                {isProcessing ? 'PROCESSING_QUERY...' : 'IDLE'} // CTRL+ENTER TO EXECUTE
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
