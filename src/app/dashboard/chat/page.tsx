'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bot, LayoutDashboard } from 'lucide-react'
import { ChatInterface } from '@/components/chat-interface'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard-header'
import { useProviders } from '@/hooks/use-providers'
import type { Document } from '@/types'

export default function ChatPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const { user, logout } = useAuth()
  const { configuredProviders, selectedProvider, setSelectedProvider } = useProviders({ user })

  const fetchDocuments = async () => {
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest<Document[]>('/api/documents')
      setDocuments(data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  useEffect(() => {
    if (!user) return
    fetchDocuments()
  }, [user])

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
      <div className="h-screen overflow-hidden bg-secondary/20 text-foreground font-sans flex flex-col">
        <DashboardHeader
          title="Chat"
          userName={user.name}
          configuredProviders={configuredProviders}
          selectedProvider={selectedProvider}
          onSelectedProviderChange={setSelectedProvider}
          onLogout={logout}
          navItems={
            <>
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-full text-muted-foreground h-9 px-3 sm:px-5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Dashboard</span>
                </Button>
              </Link>
              <Link href="/dashboard/chatbots">
                <Button variant="outline" className="rounded-full text-muted-foreground h-9 px-3 sm:px-5">
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Chatbots</span>
                </Button>
              </Link>
            </>
          }
        />

        <main className="flex-1 min-h-0 p-6 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col">
          <div className="flex-1 min-h-0 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 h-full min-h-0 flex flex-col">
              <ChatInterface
                documents={documents}
                selectedProvider={selectedProvider}
                onDocumentsChanged={fetchDocuments}
              />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
