'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  Search, 
  FileText, 
  Brain, 
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Loader2
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

  useEffect(() => {
    // Auth context handles redirect
  }, [isAuthenticated, user])

  const fetchDocuments = async () => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest<Document[]>('/api/documents')
      setDocuments(data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleDocumentUpload = (newDocuments: Document[]) => {
    fetchDocuments()
    setActiveTab('documents')
    
    const refreshInterval = setInterval(() => {
      fetchDocuments()
    }, 2000)
    
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="font-medium text-sm">Authenticating...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-secondary/20 text-foreground font-sans flex flex-col">
        
        {/* Modern Header */}
        <header className="bg-background border-b border-border px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
              D
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <ThemeToggle />
            <Button 
              variant="outline"
              onClick={logout} 
              className="text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/10 transition-colors rounded-full px-5"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 flex flex-col">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-border bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Uploads</p>
                  <p className="text-3xl font-bold">{documents.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-border bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl text-primary">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Indexed Docs</p>
                  <p className="text-3xl font-bold">{documents.filter(d => d.status === 'COMPLETED').length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-border bg-card">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="bg-green-500/10 p-3 rounded-xl text-green-600 dark:text-green-400">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Status</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Online</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col space-y-6">
            <div className="bg-background rounded-2xl p-1.5 shadow-sm border border-border inline-flex w-fit">
              <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-1">
                {[
                  { id: 'upload', icon: Upload, label: 'Upload' },
                  { id: 'documents', icon: FileText, label: 'Documents' },
                  { id: 'query', icon: MessageSquare, label: 'Query' },
                  { id: 'results', icon: BarChart3, label: 'Analysis' },
                  { id: 'settings', icon: Settings, label: 'Settings' }
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id} 
                    className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-2.5 px-5 transition-all shadow-none"
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <Card className="flex-1 shadow-sm border-border bg-card overflow-hidden flex flex-col">
              <div className="p-6 h-full flex flex-col">
                <TabsContent value="upload" className="m-0 focus-visible:outline-none flex-1">
                  <DocumentUpload onUpload={handleDocumentUpload} />
                </TabsContent>

                <TabsContent value="documents" className="m-0 focus-visible:outline-none flex-1">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                      <p className="font-medium">Loading documents...</p>
                    </div>
                  ) : documents.length > 0 ? (
                    <DocumentList documents={documents} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border rounded-2xl bg-secondary/30">
                      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm mb-4 text-muted-foreground">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">No documents found</h3>
                      <p className="text-muted-foreground text-center max-w-sm mb-6">
                        Your workspace is empty. Upload your first document to begin processing and querying data.
                      </p>
                      <Button 
                        onClick={() => setActiveTab('upload')} 
                        className="rounded-full px-8 shadow-sm"
                      >
                        Upload Document
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="query" className="m-0 focus-visible:outline-none flex-1">
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

                <TabsContent value="results" className="m-0 focus-visible:outline-none flex-1">
                  <AnalysisResults />
                </TabsContent>

                <TabsContent value="settings" className="m-0 focus-visible:outline-none flex-1">
                  <AiApiSettings />
                </TabsContent>
              </div>
            </Card>
          </Tabs>

        </main>
      </div>
    </ProtectedRoute>
  )
}