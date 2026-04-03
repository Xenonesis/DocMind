'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import {
  Upload,
  FileText,
  BarChart3,
  Settings,
  Loader2,
  MessageSquare,
  Bot
} from 'lucide-react'
import { DocumentUpload } from '@/components/document-upload'
import { DocumentList } from '@/components/document-list'
import { DocumentSkeleton } from '@/components/document-skeleton'
import { AnalysisResults } from '@/components/analysis-results'
import { AiApiSettings } from '@/components/settings/ai-api-settings'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardHeader } from '@/components/dashboard-header'
import { useProviders } from '@/hooks/use-providers'
import type { Document } from '@/types'

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeTab, setActiveTab] = useState('upload')
  const [isLoading, setIsLoading] = useState(true)
  const { user, logout } = useAuth()
  const { configuredProviders, selectedProvider, setSelectedProvider } = useProviders({ user })

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
    if (!user) return
    fetchDocuments()
  }, [user])

  useEffect(() => {
    const hasProcessingDocuments = documents.some(doc =>
      doc.status === 'UPLOADING' || doc.status === 'PROCESSING'
    )
    if (!hasProcessingDocuments) return
    const interval = setInterval(() => { fetchDocuments() }, 2500)
    return () => clearInterval(interval)
  }, [documents])

  const handleDocumentUpload = (_newDocuments: Document[]) => {
    fetchDocuments()
    setActiveTab('documents')
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
        <DashboardHeader
          title="Dashboard"
          userName={user.name}
          configuredProviders={configuredProviders}
          selectedProvider={selectedProvider}
          onSelectedProviderChange={setSelectedProvider}
          onLogout={logout}
          navItems={
            <>
              <Link href="/dashboard/chat">
                <Button className="rounded-full shadow-sm gap-2 h-9 px-3 sm:px-5">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Open Chat</span>
                </Button>
              </Link>
              <Link href="/dashboard/chatbots">
                <Button variant="outline" className="rounded-full shadow-sm gap-2 text-muted-foreground h-9 px-3 sm:px-5">
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline">Manage Chatbots</span>
                </Button>
              </Link>
            </>
          }
        />

        <main className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto w-full space-y-6 sm:space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-background rounded-2xl p-1.5 shadow-sm border border-border w-full overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 flex gap-1 w-max min-w-full sm:w-fit">
                {[
                  { id: 'upload', icon: Upload, label: 'Upload' },
                  { id: 'documents', icon: FileText, label: 'Documents' },
                  { id: 'results', icon: BarChart3, label: 'Analysis' },
                  { id: 'settings', icon: Settings, label: 'Settings' }
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-2 px-3 sm:px-5 transition-all shadow-none flex-1 sm:flex-none text-sm"
                  >
                    <tab.icon className="w-4 h-4 mr-1.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <Card className="shadow-sm border-border bg-card">
              <div className="p-6">
                <TabsContent value="upload" className="m-0 focus-visible:outline-none flex-1">
                  <DocumentUpload onUpload={handleDocumentUpload} />
                </TabsContent>

                <TabsContent value="documents" className="m-0 focus-visible:outline-none flex-1">
                  {isLoading ? (
                    <DocumentSkeleton />
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
                      <Button onClick={() => setActiveTab('upload')} className="rounded-full px-8 shadow-sm">
                        Upload Document
                      </Button>
                    </div>
                  )}
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
