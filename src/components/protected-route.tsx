'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full p-8 animate-in fade-in duration-500">
          <div className="h-12 w-12 bg-primary/20 rounded-2xl animate-pulse flex items-center justify-center">
            <div className="h-6 w-6 bg-primary/40 rounded-full animate-ping" />
          </div>
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="h-5 w-32 bg-muted/80 rounded-md animate-pulse" />
            <div className="h-3 w-48 bg-muted/50 rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}