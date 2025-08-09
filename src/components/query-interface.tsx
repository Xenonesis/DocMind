'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Server
} from 'lucide-react'

interface QueryInterfaceProps {
  query: string
  setQuery: (query: string) => void
  isProcessing: boolean
  onSubmit: () => void
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
  type: 'google' | 'mistral' | 'lm-studio' | 'ollama' | 'open-router' | 'custom'
  model: string
  isActive: boolean
  isConfigured: boolean
}

export function QueryInterface({ query, setQuery, isProcessing, onSubmit }: QueryInterfaceProps) {
  const [selectedExample, setSelectedExample] = useState<string | null>(null)
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [currentProvider, setCurrentProvider] = useState<AIProvider | null>(null)

  // Fetch query history from API
  const fetchQueryHistory = async () => {
    try {
      const response = await fetch('/api/query?limit=10')
      if (response.ok) {
        const data = await response.json()
        setQueryHistory(data || [])
      }
    } catch (error) {
      console.error('Error fetching query history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Fetch current AI provider from server
  const fetchCurrentProvider = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const active = data.find((p: any) => p.isActive && p.apiKey)
        if (active) {
          setCurrentProvider({
            id: active.id,
            name: `${active.provider} (${active.model})`,
            type: (active.provider || '').toString().toLowerCase() as any,
            model: active.model,
            isActive: true,
            isConfigured: true
          })
          return
        }
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
      onSubmit()
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
      default: return <Brain className="w-4 h-4 text-gray-500" />
    }
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>Press Ctrl/Cmd + Enter to submit</p>
              <Badge variant="outline" className="gap-1">
                <Brain className="w-3 h-3" />
                AI Powered
              </Badge>
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