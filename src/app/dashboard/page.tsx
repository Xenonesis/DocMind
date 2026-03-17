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
          className="mb-8 sm:mb-10"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                  Dashboard Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Welcome back, {user.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
              <ThemeToggle />
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
              <Avatar className="w-10 h-10 border-2 border-white dark:border-slate-800 shadow-sm">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={handleLogout} className="text-sm font-semibold rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/20">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Uploads</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
                        {documents.length} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">files</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }}>
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/20">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Indexed Docs</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
                        {documents.filter(d => d.status === 'COMPLETED').length} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">ready</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300, delay: 0.2 }}>
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl overflow-hidden rounded-3xl sm:col-span-2 lg:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/20">
                      <Search className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">System Status</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm border border-green-200 dark:border-green-800/50">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          Operational
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-2 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-lg mb-8 max-w-fit mx-auto lg:mx-0">
              <TabsList className="bg-transparent h-auto p-0 flex gap-2 w-full justify-start overflow-x-auto hide-scrollbar">
                <TabsTrigger 
                  value="upload" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md rounded-xl py-3 px-5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md rounded-xl py-3 px-5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <FileText className="w-4 h-4" />
                  Docs
                </TabsTrigger>
                <TabsTrigger 
                  value="query" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md rounded-xl py-3 px-5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <MessageSquare className="w-4 h-4" />
                  Query
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md rounded-xl py-3 px-5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <BarChart3 className="w-4 h-4" />
                  Results
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md rounded-xl py-3 px-5 text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="upload" className="space-y-6 m-0" key="upload">
                <DocumentUpload onUpload={handleDocumentUpload} />
              </TabsContent>

              <TabsContent value="documents" className="m-0" key="documents">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <p className="text-slate-500 font-medium">Loading your documents...</p>
                  </div>
                ) : documents.length > 0 ? (
                  <DocumentList documents={documents} />
                ) : (
                  <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg text-center py-12">
                    <CardHeader>
                      <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-blue-500" />
                      </div>
                      <CardTitle className="text-2xl">No Documents Found</CardTitle>
                      <CardDescription className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Upload your first document to unlock DocMind's powerful AI analysis and semantic search capabilities.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => setActiveTab('upload')} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Document
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="query" className="space-y-6 m-0" key="query">
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

              <TabsContent value="results" className="space-y-6 m-0" key="results">
                <AnalysisResults />
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 m-0" key="settings">
                <AiApiSettings />
              </TabsContent>
            </motion.div>
          </Tabs>
        </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}