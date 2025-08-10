'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  X
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
          // Only consider configured if API key is present (no masked bullets)
          isConfigured: !!p.apiKey && typeof p.apiKey === 'string' && p.apiKey.length > 0 && !p.apiKey.includes('•')
        }
      })
      
      // Only show configured providers in the dropdown
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Query Input */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Natural Language Query
            </CardTitle>
            <CardDescription>
              Ask questions about your documents in plain English. Our AI will understand 
              the context and provide intelligent answers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => onTextareaChange(e.target.value)}
                placeholder="Ask anything about your documents... 
                Examples: 'What are the common reasons for claim denials?', 
                'Find all contracts with specific termination clauses', 
                'Show me documents related to compliance requirements'"
                className="min-h-[120px] resize-none pr-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSubmit()
                  }
                }}
              />
              {showMentionList && (
                <div className="absolute left-3 top-3 mt-6 w-[calc(100%-3rem)] z-10">
                  <Card className="shadow-lg border">
                    <CardContent className="p-2">
                      <div className="max-h-60 overflow-auto">
                        {filteredMentionDocs.length === 0 ? (
                          <div className="text-sm text-gray-500 p-2">No matching documents</div>
                        ) : (
                          filteredMentionDocs.map(doc => (
                            <button
                              key={doc.id}
                              className="w-full text-left px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                              onMouseDown={(e) => { e.preventDefault(); handleSelectMention(doc) }}
                            >
                              {doc.name}
                            </button>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <Button
                size="sm"
                className="absolute bottom-3 right-3"
                onClick={handleSubmit}
                disabled={isProcessing || !query.trim()}
              >
                {isProcessing ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {/* Selected documents chips */}
            {selectedDocumentIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedDocumentIds.map(id => {
                  const doc = completedDocuments.find(d => d.id === id)
                  if (!doc) return null
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {doc.name}
                      <button className="ml-1" onClick={() => removeSelectedDoc(id)} aria-label={`Remove ${doc.name}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>Press Ctrl/Cmd + Enter to submit</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs">Model:</span>
                  <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                    <SelectTrigger className="h-8 w-[220px]">
                      <SelectValue placeholder={currentProvider ? currentProvider.name : 'Select AI model'} />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Brain className="w-3 h-3" />
                  AI Powered
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Query Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Example Queries
            </CardTitle>
            <CardDescription>
              Click on any example to get started with common document analysis tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {queryExamples.map((example) => (
                <motion.div
                  key={example.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 text-left justify-start"
                    onClick={() => handleExampleClick(example)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {example.category}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{example.question}</p>
                      <p className="text-xs text-gray-500">{example.description}</p>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query History */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Query History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {isLoadingHistory ? (
                  <div className="text-center py-8">
                    <Clock className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
                    <p className="text-gray-500">Loading query history...</p>
                  </div>
                ) : queryHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No queries yet</h3>
                    <p className="text-gray-500">Start by asking a question about your documents.</p>
                  </div>
                ) : (
                  queryHistory.map((history) => (
                    <motion.div
                      key={history.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {getStatusIcon(history.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {history.query}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(history.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {history.results !== undefined && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {history.results} results found
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* AI Provider Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              AI Provider
            </CardTitle>
            <CardDescription>
              Current AI model being used for queries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentProvider ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getProviderIcon(currentProvider.type)}
                    <span className="font-medium">{currentProvider.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {currentProvider.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Model:</span>
                    <span className="font-mono text-xs">{currentProvider.model}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Type:</span>
                    <span className="capitalize">{currentProvider.type}</span>
                  </div>
                </div>
                {currentProvider.name.includes('Demo') && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Demo mode active. Configure a real AI provider in Settings for production use.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No AI provider configured</p>
                <Button variant="outline" size="sm" className="mt-2">
                  <Settings className="w-3 h-3 mr-1" />
                  Configure
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Semantic search</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Context understanding</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Pattern recognition</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Cross-document analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Risk assessment</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}