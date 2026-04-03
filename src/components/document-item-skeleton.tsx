import { Skeleton } from '@/components/ui/skeleton'

export function DocumentItemSkeleton() {
  return (
    <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
  )
}
