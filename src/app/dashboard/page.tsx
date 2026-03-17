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
  User,
  TerminalSquare
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

  const handleLogout = () => {
    logout()
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-mono uppercase">
        <div className="text-center flex flex-col items-center gap-4">
          <TerminalSquare className="w-12 h-12 animate-pulse" />
          <p>Authenticating_System_Access...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground font-sans">
        
        {/* Brutalist Top Nav */}
        <header className="border-b-4 border-foreground bg-background px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-50 brutal-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center font-black text-2xl">
              DM
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">CONTROL_PANEL</h1>
              <p className="font-mono text-sm uppercase opacity-70">
                USR: {user.name} // AUTH: VERIFIED
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <ThemeToggle />
            <Button 
              onClick={handleLogout} 
              className="font-black uppercase tracking-widest bg-destructive text-destructive-foreground hover:bg-foreground hover:text-background rounded-none brutal-shadow border-2 border-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              TERMINATE
            </Button>
          </div>
        </header>

        <main className="p-6 max-w-[1600px] mx-auto space-y-8 mt-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-4 border-foreground bg-accent text-accent-foreground p-6 brutal-shadow flex items-start gap-4">
              <Upload className="w-8 h-8" />
              <div>
                <p className="font-mono text-sm uppercase font-bold">TOTAL_UPLOADS</p>
                <p className="text-5xl font-black">{documents.length}</p>
              </div>
            </div>
            
            <div className="border-4 border-foreground bg-background p-6 brutal-shadow flex items-start gap-4">
              <Brain className="w-8 h-8" />
              <div>
                <p className="font-mono text-sm uppercase font-bold">INDEXED_DOCS</p>
                <p className="text-5xl font-black">{documents.filter(d => d.status === 'COMPLETED').length}</p>
              </div>
            </div>
            
            <div className="border-4 border-foreground bg-background p-6 brutal-shadow flex items-start gap-4">
              <Search className="w-8 h-8" />
              <div>
                <p className="font-mono text-sm uppercase font-bold">SYS_STATUS</p>
                <div className="mt-2 inline-flex items-center gap-2 border-2 border-foreground px-3 py-1 font-mono text-sm font-bold bg-green-500 text-black">
                  <span className="w-2 h-2 bg-black animate-ping"></span>
                  OPERATIONAL
                </div>
              </div>
            </div>
          </div>

          {/* Main Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="border-4 border-foreground bg-background brutal-shadow p-2">
              <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-2 w-full justify-start rounded-none">
                {[
                  { id: 'upload', icon: Upload, label: 'UPLOAD_DOC' },
                  { id: 'documents', icon: FileText, label: 'FILE_ARCHIVE' },
                  { id: 'query', icon: MessageSquare, label: 'QUERY_ENGINE' },
                  { id: 'results', icon: BarChart3, label: 'ANALYSIS_OUT' },
                  { id: 'settings', icon: Settings, label: 'SYS_CONFIG' }
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id} 
                    className="rounded-none border-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background font-mono uppercase font-bold py-3 px-6 transition-none"
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="border-4 border-foreground bg-background brutal-shadow p-6 min-h-[500px]">
              <TabsContent value="upload" className="m-0 focus-visible:outline-none h-full">
                <DocumentUpload onUpload={handleDocumentUpload} />
              </TabsContent>

              <TabsContent value="documents" className="m-0 focus-visible:outline-none h-full">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 font-mono uppercase">
                    <TerminalSquare className="w-12 h-12 animate-spin mb-4" />
                    <p>Fetching_Archive_Data...</p>
                  </div>
                ) : documents.length > 0 ? (
                  <DocumentList documents={documents} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-foreground">
                    <FileText className="w-16 h-16 mb-4 opacity-50" />
                    <h3 className="text-2xl font-black uppercase mb-2">VAULT_EMPTY</h3>
                    <p className="font-mono text-center max-w-md opacity-70 mb-6">
                      No documents found in system index. Initialize upload to begin processing.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('upload')} 
                      className="font-black uppercase tracking-widest rounded-none brutal-shadow border-2 border-foreground"
                    >
                      INIT_UPLOAD
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="query" className="m-0 focus-visible:outline-none h-full">
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

              <TabsContent value="results" className="m-0 focus-visible:outline-none h-full">
                <AnalysisResults />
              </TabsContent>

              <TabsContent value="settings" className="m-0 focus-visible:outline-none h-full">
                <AiApiSettings />
              </TabsContent>
            </div>
          </Tabs>

        </main>
      </div>
    </ProtectedRoute>
  )
}