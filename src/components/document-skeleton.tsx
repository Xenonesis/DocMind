import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

export function DocumentSkeleton() {
  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-7 w-32" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-full sm:w-[180px] rounded-xl" />
        <Skeleton className="h-10 w-full sm:w-[180px] rounded-xl" />
      </div>

      {/* Document List Skeleton */}
      <ScrollArea className="flex-1 border border-border/50 rounded-2xl bg-card shadow-sm overflow-hidden h-[500px]">
        <div className="divide-y divide-border/40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full md:w-auto">
                <Skeleton className="h-6 w-24 rounded-full" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
