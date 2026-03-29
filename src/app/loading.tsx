import { Loader2 } from 'lucide-react'

export default function RootLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex items-center gap-3 text-sm text-muted-foreground" role="status" aria-live="polite">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading application...
      </div>
    </main>
  )
}
