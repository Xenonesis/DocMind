import { Loader2 } from 'lucide-react'

export default function RootLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full p-8 animate-in fade-in duration-500">
        <div className="h-12 w-12 bg-primary/20 rounded-2xl animate-pulse flex items-center justify-center">
          <div className="h-6 w-6 bg-primary/40 rounded-full animate-ping" />
        </div>
        <div className="space-y-2 w-full flex flex-col items-center">
          <div className="h-5 w-32 bg-muted/80 rounded-md animate-pulse" />
          <div className="h-3 w-48 bg-muted/50 rounded-md animate-pulse" />
        </div>
      </div>
    </main>
  )
}
