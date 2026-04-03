'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart3,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Target,
  Lightbulb,
  RefreshCw,
  Inbox,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { AnalysisResult, DocumentSummary } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────
export const getTypeColor = (type: AnalysisResult['type']) => {
  switch (type) {
    case 'RISK':
      return 'bg-rose-100/60 text-rose-700 dark:bg-rose-900/25 dark:text-rose-400'
    case 'INSIGHT':
      return 'bg-indigo-100/60 text-indigo-700 dark:bg-indigo-900/25 dark:text-indigo-400'
    case 'OPPORTUNITY':
      return 'bg-amber-100/60 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400'
    case 'COMPLIANCE':
      return 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400'
  }
}

export const getTypeIcon = (type: AnalysisResult['type']) => {
  switch (type) {
    case 'RISK':
      return <AlertTriangle className="w-4 h-4" />
    case 'INSIGHT':
      return <Lightbulb className="w-4 h-4" />
    case 'OPPORTUNITY':
      return <TrendingUp className="w-4 h-4" />
    case 'COMPLIANCE':
      return <CheckCircle className="w-4 h-4" />
  }
}

export const getSeverityColor = (severity?: string) => {
  switch (severity) {
    case 'HIGH':
      return 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
    case 'MEDIUM':
      return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    default:
      return 'text-muted-foreground border-border'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
interface AnalysisLogProps {
  analysisResults: AnalysisResult[]
  selectedAnalysis: string | null
  onSelectAnalysis: (id: string | null) => void
  isLoading: boolean
  isGenerating: boolean
  documents: DocumentSummary[]
  onExport: () => void
  onGenerateAnalysis: () => void
}

export function AnalysisLog({
  analysisResults,
  selectedAnalysis,
  onSelectAnalysis,
  isLoading,
  isGenerating,
  documents,
  onExport,
  onGenerateAnalysis,
}: AnalysisLogProps) {
  return (
    <Card className="border border-border shadow-sm bg-card overflow-hidden">
      <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-background/50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">
            Detailed Records
            {analysisResults.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({analysisResults.length})
              </span>
            )}
          </h3>
        </div>
        <div className="flex gap-2">
          {analysisResults.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-8 rounded-lg font-medium text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[480px]">
        <div className="divide-y divide-border/40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-primary" />
              <p className="text-sm font-medium">Loading analysis data...</p>
            </div>
          ) : analysisResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-8">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold mb-1">No analysis logs yet</h3>
              <p className="text-muted-foreground text-sm max-w-xs mb-5">
                Click <strong>"Run AI Analysis"</strong> above to generate structured insights from
                your uploaded documents.
              </p>
              <Button
                size="sm"
                onClick={onGenerateAnalysis}
                disabled={
                  isGenerating || documents.filter((d) => d.status === 'COMPLETED').length === 0
                }
                className="rounded-full gap-1.5 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {documents.filter((d) => d.status === 'COMPLETED').length === 0
                  ? 'Upload documents first'
                  : 'Generate Analysis'}
              </Button>
            </div>
          ) : (
            analysisResults.map((result) => (
              <div
                key={result.id}
                className={`p-5 hover:bg-secondary/20 transition-colors cursor-pointer ${selectedAnalysis === result.id ? 'bg-secondary/30' : ''}`}
                onClick={() => onSelectAnalysis(selectedAnalysis === result.id ? null : result.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2.5 rounded-xl border border-border/50 shadow-sm shrink-0 ${getTypeColor(result.type)}`}
                  >
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h4 className="font-semibold text-foreground text-sm">{result.title}</h4>
                      <Badge
                        variant="secondary"
                        className={`capitalize text-xs shadow-none border-none font-medium px-2 py-0.5 ${getTypeColor(result.type)}`}
                      >
                        {result.type.toLowerCase()}
                      </Badge>
                      {result.severity && result.severity !== 'LOW' && (
                        <Badge
                          variant="outline"
                          className={`capitalize text-xs font-medium ${getSeverityColor(result.severity)}`}
                        >
                          {result.severity.toLowerCase()} severity
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {result.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Confidence:{' '}
                        <span className="text-foreground ml-0.5">{result.confidence}%</span>
                      </span>
                      {result.documents.length > 0 && (
                        <>
                          <span className="text-border">•</span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {result.documents[0]}
                            {result.documents.length > 1 ? ` +${result.documents.length - 1}` : ''}
                          </span>
                        </>
                      )}
                      <span className="text-border">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(result.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-muted-foreground shrink-0">
                    {selectedAnalysis === result.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {selectedAnalysis === result.id && (
                  <div className="mt-4 pt-4 border-t border-border/50 ml-14 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> Referenced Documents
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {result.documents.length > 0 ? (
                          result.documents.map((d, i) => (
                            <Badge key={i} variant="secondary" className="text-xs font-normal">
                              {d}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No specific document
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Target className="w-3 h-3" /> Model Confidence
                      </h5>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700"
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                      <p className="text-xs text-right text-muted-foreground">
                        {result.confidence}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
