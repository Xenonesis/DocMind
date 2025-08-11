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
      setQuery(prev => prev + (prev ? ' ' : '') + transcript)
    }

    recognition.start()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 sm:space-y-4 py-4 sm:py-6 lg:py-8 px-4"
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ask Anything
          </h1>
        </div>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
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
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              No AI providers are configured. Please go to{' '}
              <a href="/settings" className="font-medium underline hover:no-underline">
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
        transition={{ delay: 0.1 }}
        className="relative px-4"
      >
        <Card className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-300">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Query Input Area */}
              <div className="relative">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="flex-1 relative w-full">
                    <Textarea
                      ref={textareaRef}
                      value={query}
                      onChange={(e) => onTextareaChange(e.target.value)}
                      placeholder="What would you like to know about your documents? Try asking something like 'What are the key risks in my contracts?' or 'Show me all compliance-related documents'..."
                      className="min-h-[120px] sm:min-h-[140px] text-base sm:text-lg border-0 shadow-none resize-none focus-visible:ring-0 placeholder:text-gray-400"
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
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                    <Button
                      onClick={toggleVoiceRecognition}
                      variant="outline"
                      size="sm"
                      className={`flex-1 sm:flex-none ${isListening ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
                    >
                      {isListening ? <MicOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Mic className="w-3 h-3 sm:w-4 sm:h-4" />}
                      <span className="ml-1 sm:hidden text-xs">{isListening ? 'Stop' : 'Voice'}</span>
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isProcessing || !query.trim() || providers.length === 0}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      size="sm"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      <span className="ml-1 sm:hidden text-xs">Send</span>
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
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Quick Start
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExamples(!showExamples)}
                  >
                    {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
                <CardDescription>
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
                              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 bg-white dark:bg-gray-800"
                              onClick={() => handleExampleClick(example)}
                            >
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <Badge variant="secondary" className="text-xs font-medium flex-shrink-0">
                                  {example.category}
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm leading-5 text-gray-900 dark:text-gray-100 break-words">
                                  {example.question}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-4 break-words">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />
                  AI Capabilities
                </CardTitle>
                <CardDescription>
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
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-green-500" />
                    Recent Queries
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
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
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {isLoadingHistory ? (
                            <div className="text-center py-8">
                              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-gray-400 mb-3" />
                              <p className="text-sm text-gray-500">Loading history...</p>
                            </div>
                          ) : queryHistory.length === 0 ? (
                            <div className="text-center py-8">
                              <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">No queries yet</h3>
                              <p className="text-sm text-gray-500">Your query history will appear here</p>
                            </div>
                          ) : (
                            queryHistory.map((history, index) => (
                              <motion.div
                                key={history.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-200"
                                onClick={() => setQuery(history.query)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">
                                    {getStatusIcon(history.status)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                      {history.query}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                      <p className="text-xs text-gray-500">
                                        {new Date(history.timestamp).toLocaleDateString()}
                                      </p>
                                      {history.results !== undefined && (
                                        <Badge variant="outline" className="text-xs">
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