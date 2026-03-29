import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or may have moved.
        </p>
        <Button asChild className="w-full rounded-xl">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </main>
  )
}
