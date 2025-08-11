'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Upload, 
  Search, 
  FileText, 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  User
} from 'lucide-react'
import { DocumentUpload } from '@/components/document-upload'
import { QueryInterface } from '@/components/query-interface'
import { DocumentList } from '@/components/document-list'
import { AnalysisResults } from '@/components/analysis-results'
import { AiApiSettings } from '@/components/settings/ai-api-settings'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface Document {
  id: string
  name: string
  type: string
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
  uploadDate: string
  size: string
  category?: string
  tags?: string[]
  analysisCount?: number
  queryCount?: number
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState('documents')
  const [query, setQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const { user, logout, isAuthenticated } = useAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && user === null) {
      // Only redirect if we're sure the user is not authenticated
      // The auth context will handle the redirect
    }
  }, [isAuthenticated, user])

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest<Document[]>('/api/documents')
      setDocuments(data)
    } catch (error) {
      console.error('Error fetching documents:', error)
      // If authentication fails, the auth context will handle redirecting
      if (error instanceof Error && error.message.includes('authentication')) {
        // Authentication error, user will be redirected
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleDocumentUpload = (newDocuments: Document[]) => {
    // Refresh documents immediately and then periodically to catch status updates
    fetchDocuments()
    
    // Switch to documents tab to show the uploaded files
    setActiveTab('documents')
    
    // Set up periodic refresh for processing documents
    const refreshInterval = setInterval(() => {
      fetchDocuments()
    }, 2000)
    
    // Stop refreshing after 30 seconds
    setTimeout(() => {
      clearInterval(refreshInterval)
    }, 30000)
  }

  const handleQuerySubmit = async (payload?: { query: string; documentIds: string[]; provider?: string }) => {
    const finalQuery = payload?.query ?? query
    if (!finalQuery.trim()) return
    setIsProcessing(true)
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const result = await authenticatedRequest('/api/query', {
        method: 'POST',
        body: JSON.stringify({
          query: finalQuery,
          documentIds: payload?.documentIds ?? selectedDocumentIds,
          provider: payload?.provider ?? selectedProvider
        }),
      })
      if (result) {
        setActiveTab('results')
      }
    } catch (error) {
      console.error('Error submitting query:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'PROCESSING': return <Brain className="w-4 h-4 text-blue-500" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                  DocMind
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  Welcome back, {user.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
              <ThemeToggle />
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={handleLogout} size="sm" className="text-xs sm:text-sm">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Upload Documents</p>
                    <p className="font-semibold">{documents.length} files</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Processed</p>
                    <p className="font-semibold">
                      {documents.filter(d => d.status === 'COMPLETED').length} files
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Search className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Queries</p>
                    <p className="font-semibold">Semantic search ready</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              <TabsTrigger value="upload" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="query" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Query</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Results</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6" key="upload">
              <DocumentUpload onUpload={handleDocumentUpload} />
            </TabsContent>

            <TabsContent value="documents" key="documents">
              {isLoading ? (
                <div className="text-center p-8">
                  <p>Loading documents...</p>
                </div>
              ) : documents.length > 0 ? (
                <DocumentList documents={documents} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Documents Found</CardTitle>
                    <CardDescription>
                      Upload documents to get started with DocMind's intelligent processing.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setActiveTab('upload')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="query" className="space-y-6" key="query">
              <QueryInterface 
                query={query}
                setQuery={setQuery}
                isProcessing={isProcessing}
                documents={documents}
                onSubmit={({ query: q, documentIds, provider }) => {
                  setSelectedDocumentIds(documentIds)
                  setSelectedProvider(provider)
                  handleQuerySubmit({ query: q, documentIds, provider })
                }}
              />
            </TabsContent>

            <TabsContent value="results" className="space-y-6" key="results">
              <AnalysisResults />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6" key="settings">
              <AiApiSettings />
            </TabsContent>
          </Tabs>
        </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}