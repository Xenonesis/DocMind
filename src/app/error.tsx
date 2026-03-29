'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global render error:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              We hit an unexpected issue while rendering this page.
            </p>
            <Button onClick={reset} className="w-full rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
          </div>
        </main>
      </body>
    </html>
  )
}
