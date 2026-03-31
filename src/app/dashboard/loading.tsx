import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6 md:p-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted/80 rounded-md animate-pulse" />
          <div className="h-4 w-64 bg-muted/50 rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-muted/30 rounded-xl animate-pulse hidden sm:block" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-card border border-border/50 rounded-xl animate-pulse shadow-sm" />
        ))}
      </div>
      <div className="h-96 bg-card border border-border/50 rounded-xl animate-pulse shadow-sm w-full mt-6" />
    </div>
  )
}
