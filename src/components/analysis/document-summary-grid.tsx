'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle, RefreshCw, Clock } from 'lucide-react'
import type { DocumentSummary } from '@/types'

interface DocumentSummaryGridProps {
  documents: DocumentSummary[]
  isLoading: boolean
}

export function DocumentSummaryGrid({ documents, isLoading }: DocumentSummaryGridProps) {
  if (isLoading) {
    return (
      <Card className="border border-border shadow-sm py-24 flex flex-col items-center justify-center text-muted-foreground">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p className="font-medium text-sm">Loading document summaries...</p>
      </Card>
    )
  }

  if (documents.length === 0) {
    return (
      <Card className="border border-border shadow-sm py-24 flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold mb-1 text-foreground">No documents indexed</h3>
        <p className="text-sm">Upload files to view their summaries.</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <Card key={doc.id} className="shadow-sm border-border hover:shadow-md transition-shadow overflow-hidden">
          <div className="p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate text-sm" title={doc.name}>{doc.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{doc.type} · {doc.category || 'Uncategorized'}</p>
              </div>
              <Badge
                className={`shrink-0 text-xs capitalize border-none ${
                  doc.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                  doc.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                }`}
              >
                {doc.status === 'COMPLETED' ? '✓ Ready' : doc.status === 'PROCESSING' ? '⟳ Processing' : doc.status.toLowerCase()}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40">
              <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/40">
                <p className="text-base font-semibold">{doc.analysisCount || 0}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Analyses</p>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/40">
                <p className="text-base font-semibold">{doc.queryCount || 0}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">Queries</p>
              </div>
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-secondary/40">
                {doc.status === 'COMPLETED'
                  ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                  : doc.status === 'PROCESSING'
                  ? <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  : <Clock className="w-4 h-4 text-amber-500" />}
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{doc.status.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
