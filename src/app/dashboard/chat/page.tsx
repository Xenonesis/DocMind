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
      <div className="h-screen w-full flex bg-secondary/20 font-sans animate-in fade-in duration-500 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-[300px] bg-background border-r border-border flex flex-col hidden lg:flex shrink-0">
          <div className="p-4 border-b border-border h-[73px] flex items-center">
             <div className="h-10 w-full bg-muted/30 rounded-xl animate-pulse" />
          </div>
          <div className="flex-1 p-4 space-y-3 mt-4">
            <div className="h-4 w-24 bg-muted/60 mb-6 rounded-md animate-pulse px-2" />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 w-full bg-muted/20 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        {/* Main chat skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-[73px] bg-background border-b border-border flex items-center justify-between px-6 shrink-0 z-10">
            <div className="h-8 w-48 bg-muted/40 rounded-md animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="h-10 w-32 bg-muted/30 rounded-full animate-pulse hidden sm:block" />
              <div className="h-10 w-10 bg-muted/40 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex-1 p-6 md:p-8 flex flex-col">
            <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col p-6">
              <div className="flex-1 overflow-y-auto space-y-8 mt-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 bg-primary/20 rounded-xl shrink-0 animate-pulse" />
                  <div className="space-y-3 flex-1">
                    <div className="h-24 w-full max-w-2xl bg-muted/30 rounded-2xl animate-pulse shadow-sm" />
                    <div className="h-16 w-3/4 max-w-xl bg-muted/20 rounded-2xl animate-pulse shadow-sm" />
                  </div>
                </div>
                <div className="flex flex-row-reverse gap-4">
                  <div className="h-10 w-10 bg-secondary rounded-xl shrink-0 animate-pulse border border-border/50" />
                  <div className="h-16 w-1/2 max-w-md bg-primary/10 rounded-2xl animate-pulse shadow-sm" />
                </div>
              </div>
              <div className="h-16 w-full bg-muted/10 border border-border/50 rounded-2xl mt-6 animate-pulse" />
            </div>
          </div>
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
