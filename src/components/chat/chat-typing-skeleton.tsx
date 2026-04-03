import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export function ChatTypingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-3 items-end"
      role="status"
      aria-live="polite"
    >
      <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shadow-sm">
        <Bot className="w-4 h-4 text-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex-1 max-w-[80%]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-3 w-12 rounded-full" />
        </div>
      </div>
    </motion.div>
  )
}
