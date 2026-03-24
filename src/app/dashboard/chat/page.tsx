'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import { Bot, LogOut, LayoutDashboard } from 'lucide-react'
import { ChatInterface } from '@/components/chat-interface'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

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

export default function ChatPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined)
  const [configuredProviders, setConfiguredProviders] = useState<{id: string, name: string}[]>([])
  const { user, logout } = useAuth()

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
    fetchDocuments()

    const fetchProviders = async () => {
      try {
        const { authenticatedRequest } = await import('@/lib/api-client')
        const [data, freeProviderRes] = await Promise.allSettled([
          authenticatedRequest('/api/settings'),
          fetch('/api/free-provider').then(r => r.ok ? r.json() : null)
        ])

        const provs: {id: string, name: string}[] = []

        if (freeProviderRes.status === 'fulfilled' && freeProviderRes.value) {
          const fps = Array.isArray(freeProviderRes.value) ? freeProviderRes.value : [freeProviderRes.value];
          fps.forEach((fp: any) => {
            provs.push({ id: fp.id, name: fp.name })
          })
        }

        let activeId: string | undefined = undefined

        if (data.status === 'fulfilled' && Array.isArray(data.value)) {
          data.value.forEach((p: any) => {
            if (p.apiKey || ['LM_STUDIO', 'OLLAMA'].includes(p.provider)) {
              const id = p.id || p.provider
              if (p.isActive) activeId = id
              provs.push({
                id,
                name: p.provider === 'GOOGLE_AI' ? 'Google Gemini'
                  : p.provider === 'OPENAI' ? 'OpenAI'
                  : p.provider === 'ANTHROPIC' ? 'Anthropic Claude'
                  : p.provider === 'MISTRAL' ? 'Mistral AI'
                  : p.provider === 'OPENROUTER' ? 'OpenRouter'
                  : p.provider === 'OPENAI_COMPATIBLE' ? 'Custom API'
                  : p.provider === 'GROQ' ? `DocScan ${p.model || 'model name'} from groq (free)`
                  : p.provider === 'OLLAMA' ? 'Ollama'
                  : p.provider === 'LM_STUDIO' ? 'LM Studio'
                  : p.provider
              })
            }
          })
        }
        setConfiguredProviders(provs)

        if (activeId && provs.some(p => p.id === activeId)) {
          setSelectedProvider(activeId)
        } else if (provs.length > 0) {
          setSelectedProvider(provs[0].id)
        }
      } catch (error) {
        console.error('Error fetching providers:', error)
      }
    }
    fetchProviders()
  }, [])

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

        <header className="bg-background border-b border-border px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-sm shrink-0 border border-primary/20 bg-background/50 flex items-center justify-center">
              <Image src="/logo.png" alt="DocMind Logo" fill sizes="40px" className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Chat</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {configuredProviders.length > 0 && (
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger className="w-[180px] h-9 bg-background/50 border-border text-xs rounded-full shadow-sm">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {configuredProviders.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs py-2">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full px-5 text-muted-foreground">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/chatbots">
              <Button variant="outline" className="rounded-full px-5 text-muted-foreground">
                <Bot className="w-4 h-4 mr-2" />
                Chatbots
              </Button>
            </Link>
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
