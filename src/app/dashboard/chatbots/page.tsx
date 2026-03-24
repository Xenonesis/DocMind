'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bot, LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/lib/auth-context'
import { ChatbotManager } from '@/components/chatbot-manager'

export default function ChatbotsPage() {
  const { logout } = useAuth()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-secondary/20 text-foreground font-sans flex flex-col">
        <header className="bg-background border-b border-border px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-sm shrink-0 border border-primary/20 bg-background/50 flex items-center justify-center">
              <Image src="/logo.png" alt="DocMind Logo" fill sizes="40px" className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Chatbots
              </h1>
              <p className="text-sm text-muted-foreground">Manage chatbot creation, credentials, and integration setup.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full px-5 text-muted-foreground">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
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

        <main className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
          <ChatbotManager />
        </main>
      </div>
    </ProtectedRoute>
  )
}
