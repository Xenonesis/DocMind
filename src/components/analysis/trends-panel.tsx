'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Zap } from 'lucide-react'
import type { AnalysisStats } from '@/types'

interface TrendsPanelProps {
  analysisStats: AnalysisStats | null
}

export function TrendsPanel({ analysisStats }: TrendsPanelProps) {
  const maxQueryCount = Math.max(...(analysisStats?.queriesPerDay?.map(d => d.count) || [1]), 1)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Query Activity Chart */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="p-5 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            Query Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {!analysisStats?.queriesPerDay || analysisStats.queriesPerDay.every(d => d.count === 0) ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              No query activity yet
            </div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {(analysisStats?.queriesPerDay || []).map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">{d.count || ''}</span>
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-all"
                    style={{ height: `${Math.max(4, (d.count / maxQueryCount) * 80)}px` }}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Breakdown */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="p-5 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            Insight Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {[
            { label: 'Insights', key: 'INSIGHT', color: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Risks', key: 'RISK', color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
            { label: 'Opportunities', key: 'OPPORTUNITY', color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
            { label: 'Compliance', key: 'COMPLIANCE', color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
          ].map(({ label, key, color, text }) => {
            const count = analysisStats?.byType?.[key] || 0
            const total = analysisStats?.total || 1
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-medium ${text}`}>{label}</span>
                  <span className="text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {!analysisStats?.total && (
            <p className="text-xs text-muted-foreground text-center pt-4">Run analysis to see breakdown</p>
          )}
        </CardContent>
      </Card>

      {/* Top Queried Documents */}
      <Card className="border border-border shadow-sm md:col-span-2">
        <CardHeader className="p-5 border-b border-border/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Most Referenced Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {!analysisStats?.topDocuments || analysisStats.topDocuments.every(d => d.queries === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Start querying documents to see which ones are most referenced.
            </p>
          ) : (
            <div className="space-y-3">
              {analysisStats.topDocuments.filter(d => d.queries > 0).map((doc, i) => {
                const maxQ = Math.max(...analysisStats.topDocuments.map(d => d.queries), 1)
                return (
                  <div key={doc.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium truncate">{doc.name}</span>
                        <span className="text-muted-foreground ml-2 shrink-0">{doc.queries} {doc.queries === 1 ? 'query' : 'queries'}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all duration-700"
                          style={{ width: `${(doc.queries / maxQ) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
