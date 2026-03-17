'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Send, 
  Brain, 
  Search, 
  Clock, 
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
  Cpu,
  Cloud,
  Server,
  Shield,
  X,
  Sparkles,
  Zap,
  MessageCircle,
  Filter,
  History,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Star,
  BookOpen,
  Target,
  Layers,
  Globe,
  Mic,
  MicOff
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

interface QueryExample {
  id: string
  category: string
  question: string
  description: string
}

const queryExamples: QueryExample[] = [
  {
    id: '1',
    category: 'Claims Analysis',
    question: 'What are the common patterns in denied insurance claims?',
    description: 'Identify recurring issues in claim rejections'
  },
  {
    id: '2',
    category: 'Contract Review',
    question: 'Find all contracts with expiration dates in the next 30 days',
    description: 'Locate time-sensitive contractual obligations'
  },
  {
    id: '3',
    category: 'Policy Analysis',
    question: 'Compare coverage terms across different insurance policies',
    description: 'Analyze variations in policy conditions'
  },
  {
    id: '4',
    category: 'Risk Assessment',
    question: 'What are the high-risk clauses in our vendor contracts?',
    description: 'Identify potentially problematic contract terms'
  },
  {
    id: '5',
    category: 'Compliance',
    question: 'Show me documents that mention GDPR compliance requirements',
    description: 'Find regulatory compliance references'
  },
  {
    id: '6',
    category: 'Financial Analysis',
    question: 'Extract all payment terms and conditions from contracts',
    description: 'Analyze financial obligations across documents'
  }
]

interface QueryHistory {
  id: string
  query: string
  timestamp: string
  status: 'COMPLETED' | 'PROCESSING' | 'ERROR'
  results?: number
  response?: any
}

interface AIProvider {
  id: string
  name: string
  type: 'google' | 'mistral' | 'lm-studio' | 'ollama' | 'open-router' | 'openai' | 'anthropic' | 'custom'
  model: string
  isActive: boolean
  isConfigured: boolean
}

export function QueryInterface({ query, setQuery, isProcessing, documents = [], onSubmit }: QueryInterfaceProps) {
  const [selectedExample, setSelectedExample] = useState<string | null>(null)
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [currentProvider, setCurrentProvider] = useState<AIProvider | null>(null)
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>('')

  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [showExamples, setShowExamples] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Fetch query history from API
  const fetchQueryHistory = async () => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest('/api/query?limit=10')
      setQueryHistory(data || [])
    } catch (error) {
      console.error('Error fetching query history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Fetch current AI provider from server
  const fetchCurrentProvider = async () => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest('/api/settings')
      
      // Map providers; allow selection of any configured or local provider
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
          // Consider configured if API key is present (including masked keys)
          isConfigured: !!p.apiKey && typeof p.apiKey === 'string' && p.apiKey.length > 0
        }
      })
      
      // Show all configured providers (removed test/demo filtering)
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
    fetchQueryHistory()
    fetchCurrentProvider()
  }, [])

  const handleExampleClick = (example: QueryExample) => {
    setQuery(example.question)
    setSelectedExample(example.id)
  }

  const handleSubmit = () => {
    if (query.trim()) {
      onSubmit({ query, documentIds: selectedDocumentIds, provider: selectedProviderId || undefined })
      // Refresh history after submission
      setTimeout(() => fetchQueryHistory(), 1000)
    }
  }

  const getStatusIcon = (status: QueryHistory['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'PROCESSING': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google': return <Cloud className="w-4 h-4 text-blue-500" />
      case 'mistral': return <Cloud className="w-4 h-4 text-orange-500" />
      case 'lm-studio': return <Server className="w-4 h-4 text-green-500" />
      case 'ollama': return <Cpu className="w-4 h-4 text-purple-500" />
      case 'open-router': return <Cloud className="w-4 h-4 text-indigo-500" />
      case 'openai': return <Brain className="w-4 h-4 text-emerald-500" />
      case 'anthropic': return <Shield className="w-4 h-4 text-yellow-600" />
      default: return <Brain className="w-4 h-4 text-gray-500" />
    }
  }

  // Mention helpers
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
    // Move cursor to just after inserted text
    const newPos = start + text.length
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = newPos
      el.focus()
    })
  }

  const onTextareaChange = (value: string) => {
    setQuery(value)
    // Detect mention trigger '@'
    const el = textareaRef.current
    const caret = el ? el.selectionStart : value.length
    const before = value.slice(0, caret)
    const lastAt = before.lastIndexOf('@')
    if (lastAt >= 0) {
      const afterAt = before.slice(lastAt + 1)
      // Stop mention if whitespace or newline before caret without any text
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
    // Replace the current '@query' with '@DocName'
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

  // Filter examples based on search
  const filteredExamples = useMemo(() => {
    if (!searchFilter.trim()) return queryExamples
    const filter = searchFilter.toLowerCase()
    return queryExamples.filter(example => 
      example.question.toLowerCase().includes(filter) ||
      example.category.toLowerCase().includes(filter) ||
      example.description.toLowerCase().includes(filter)
    )
  }, [searchFilter])

  // Voice recognition (if supported)
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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="text-center space-y-4 py-8 sm:py-12 px-4 relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }} 
            className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl sm:rounded-3xl shadow-lg shadow-blue-500/20"
          >
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 tracking-tight">
            Ask DocMind
          </h1>
        </div>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
          Transform your documents into intelligent conversations. Ask questions in natural language and get instant, contextual answers.
        </p>
      </motion.div>

      {/* No Providers Warning */}
      {providers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 mb-6"
        >
          <Alert className="border-orange-200/50 bg-orange-50/80 dark:border-orange-900/50 dark:bg-orange-950/80 backdrop-blur-md rounded-2xl shadow-sm">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200 ml-2 font-medium">
              No AI providers are configured. Please go to{' '}
              <a href="/settings" className="font-bold underline decoration-2 underline-offset-4 hover:text-orange-900 dark:hover:text-orange-100 transition-colors">
                Settings
              </a>{' '}
              to configure at least one AI provider before asking questions.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Main Query Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
        className="relative px-4"
      >
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-[2rem] overflow-hidden group transition-all duration-500 hover:shadow-blue-500/10 dark:hover:shadow-blue-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardContent className="p-6 sm:p-8 lg:p-10 relative z-10">
            <div className="space-y-4 sm:space-y-6">
              {/* Query Input Area */}
              <div className="relative">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-1 relative w-full group/input">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-25 group-hover/input:opacity-50 transition duration-500"></div>
                    <Textarea
                      ref={textareaRef}
                      value={query}
                      onChange={(e) => onTextareaChange(e.target.value)}
                      placeholder="What would you like to know about your documents? Try asking something like 'What are the key risks in my contracts?' or 'Show me all compliance-related documents'..."
                      className="relative min-h-[140px] sm:min-h-[160px] text-base sm:text-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl shadow-inner resize-none focus-visible:ring-2 focus-visible:ring-blue-500/50 placeholder:text-slate-400 p-5 transition-all duration-300"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          handleSubmit()
                        }
                      }}
                    />
                    
                    {/* Mention Dropdown */}
                    <AnimatePresence>
                      {showMentionList && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute left-0 top-full mt-2 w-full z-20"
                        >
                          <Card className="shadow-xl border-2">
                            <CardContent className="p-2 sm:p-3">
                              <div className="max-h-48 overflow-auto space-y-1">
                                {filteredMentionDocs.length === 0 ? (
                                  <div className="text-xs sm:text-sm text-gray-500 p-2 sm:p-3 text-center">
                                    No matching documents found
                                  </div>
                                ) : (
                                  filteredMentionDocs.map(doc => (
                                    <button
                                      key={doc.id}
                                      className="w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2"
                                      onMouseDown={(e) => { e.preventDefault(); handleSelectMention(doc) }}
                                    >
                                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                                      <span className="truncate text-xs sm:text-sm">{doc.name}</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-col gap-3 w-full sm:w-auto relative z-10">
                    <Button
                      onClick={toggleVoiceRecognition}
                      variant="outline"
                      size="icon"
                      className={`h-12 w-full sm:w-12 rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md ${isListening ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 animate-pulse' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800'}`}
                      aria-label="Voice input"
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      <span className="ml-2 sm:hidden font-medium">{isListening ? 'Stop Listening' : 'Voice Input'}</span>
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isProcessing || !query.trim() || providers.length === 0}
                      className="h-12 w-full sm:w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                      aria-label="Send query"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      <span className="ml-2 sm:hidden font-medium">Send Query</span>
                    </Button>
                  </div>
                </div>

                {/* Selected Documents */}
                <AnimatePresence>
                  {selectedDocumentIds.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Focusing on {selectedDocumentIds.length} document{selectedDocumentIds.length > 1 ? 's' : ''}:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocumentIds.map(id => {
                          const doc = completedDocuments.find(d => d.id === id)
                          if (!doc) return null
                          return (
                            <motion.div
                              key={id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1">
                                <FileText className="w-3 h-3" />
                                <span className="max-w-32 truncate">{doc.name}</span>
                                <button 
                                  onClick={() => removeSelectedDoc(id)} 
                                  className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                                  aria-label={`Remove ${doc.name}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            </motion.div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Ctrl/Cmd + Enter to send</span>
                      <span className="sm:hidden">Ctrl+Enter to send</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Type @ to mention documents</span>
                      <span className="sm:hidden">@ to mention docs</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder={providers.length === 0 ? "No AI Models Configured" : "Select AI Model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.length === 0 ? (
                          <SelectItem value="no-providers" disabled>
                            <div className="flex items-center gap-2 text-gray-500">
                              <AlertCircle className="w-4 h-4" />
                              <span>Configure AI providers in Settings</span>
                            </div>
                          </SelectItem>
                        ) : (
                          providers.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                {getProviderIcon(p.type)}
                                <span className="truncate">{p.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    <Badge variant="outline" className="gap-1 text-xs w-fit">
                      <Brain className="w-3 h-3" />
                      AI Powered
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 px-4">
        {/* Quick Start & Examples */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 relative z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-md shadow-yellow-500/20">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">Quick Start</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExamples(!showExamples)}
                    className="hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full w-8 h-8 p-0"
                  >
                    {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
                <CardDescription className="mt-2 text-slate-600 dark:text-slate-400 relative z-10">
                  Get started with these common queries or explore example questions
                </CardDescription>
              </CardHeader>
              
              <AnimatePresence>
                {showExamples && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <CardContent className="space-y-4">
                      {/* Search Examples */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search examples..."
                          value={searchFilter}
                          onChange={(e) => setSearchFilter(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Example Categories */}
                      <div className="space-y-3">
                        {filteredExamples.map((example) => (
                          <motion.div
                            key={example.id}
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.995 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="w-full"
                          >
                            <div 
                              className="group p-5 border border-slate-200 dark:border-slate-700/60 rounded-2xl cursor-pointer shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md relative overflow-hidden"
                              onClick={() => handleExampleClick(example)}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
                              <div className="relative z-10 flex items-start justify-between gap-3 mb-4">
                                <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex-shrink-0 border-0">
                                  {example.category}
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-0.5" />
                              </div>
                              <div className="relative z-10 space-y-2">
                                <h4 className="font-bold text-sm sm:text-base leading-snug text-slate-900 dark:text-white break-words group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                  {example.question}
                                </h4>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                                  {example.description}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {filteredExamples.length === 0 && (
                        <div className="text-center py-8">
                          <Search className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500">No examples match your search</p>
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* AI Capabilities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 relative z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                <CardTitle className="flex items-center gap-3 text-xl font-bold relative z-10">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-md shadow-purple-500/20">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">AI Capabilities</span>
                </CardTitle>
                <CardDescription className="mt-2 text-slate-600 dark:text-slate-400 relative z-10">
                  Powered by advanced language models for intelligent document analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Search, label: 'Semantic Search', desc: 'Find meaning, not just keywords' },
                    { icon: Brain, label: 'Context Understanding', desc: 'Comprehends document relationships' },
                    { icon: Target, label: 'Pattern Recognition', desc: 'Identifies trends and anomalies' },
                    { icon: Shield, label: 'Risk Assessment', desc: 'Highlights potential issues' },
                    { icon: BookOpen, label: 'Cross-Document Analysis', desc: 'Connects information across files' },
                    { icon: Globe, label: 'Multi-Language Support', desc: 'Works with various languages' }
                  ].map((capability, index) => (
                    <motion.div
                      key={capability.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
                        <capability.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{capability.label}</p>
                        <p className="text-xs text-gray-500">{capability.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Query History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 relative z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-md shadow-green-500/20">
                      <History className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">Recent Queries</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-full w-8 h-8 p-0"
                  >
                    {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {(showHistory || queryHistory.length === 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <CardContent className="p-0 sm:p-4">
                      <ScrollArea className="h-[350px]">
                        <div className="space-y-3 pr-4">
                          {isLoadingHistory ? (
                            <div className="text-center py-10">
                              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-4" />
                              <p className="font-medium text-slate-500 dark:text-slate-400">Loading history...</p>
                            </div>
                          ) : queryHistory.length === 0 ? (
                            <div className="text-center py-12 px-4 backdrop-blur-sm bg-white/30 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 mx-2 mt-2">
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <MessageCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                              </div>
                              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">No queries yet</h3>
                              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Your query history will appear here once you start asking questions.</p>
                            </div>
                          ) : (
                            queryHistory.map((history, index) => (
                              <motion.div
                                key={history.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group p-4 border border-slate-200 dark:border-slate-700/60 rounded-2xl hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all duration-300 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md relative overflow-hidden"
                                onClick={() => setQuery(history.query)}
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500" />
                                <div className="flex items-start gap-4 relative z-10">
                                  <div className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-inner group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                                    {getStatusIcon(history.status)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {history.query}
                                    </p>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(history.timestamp).toLocaleDateString()}
                                      </p>
                                      {history.results !== undefined && (
                                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                          {history.results} results
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigator.clipboard.writeText(history.query)
                                    }}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* AI Provider Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-500" />
                  AI Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentProvider ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getProviderIcon(currentProvider.type)}
                        <div>
                          <p className="font-medium text-sm">{currentProvider.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{currentProvider.type}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    
                    {currentProvider.name.includes('Demo') && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Demo Mode</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                              Configure a production AI provider in Settings for full functionality.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-3">No AI provider configured</p>
                    <Button variant="outline" size="sm">
                      <Settings className="w-3 h-3 mr-2" />
                      Configure Now
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}