'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  MessageSquare,
  Zap
} from 'lucide-react'

interface AnalysisResult {
  id: string
  type: 'INSIGHT' | 'RISK' | 'OPPORTUNITY' | 'COMPLIANCE'
  title: string
  description: string
  confidence: number
  document: { id: string; name: string; type: string; category: string } | null
  documents: string[]
  timestamp: string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH'
  metadata: any
}

interface AnalysisStats {
  total: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  averageConfidence: number
  recentCount: number
  totalDocuments: number
  completedDocuments: number
  totalQueries: number
  topDocuments: { id: string; name: string; queries: number }[]
  queriesPerDay: { date: string; count: number }[]
}

interface DocumentSummary {
  id: string
  name: string
  type: string
  category: string
  status: string
  analysisCount: number
  queryCount: number
  uploadDate: string
}

export function AnalysisResults() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [analysisStats, setAnalysisStats] = useState<AnalysisStats | null>(null)
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateMsg, setGenerateMsg] = useState('')

  const fetchAnalysisData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { authenticatedFetch } = await import('@/lib/api-client')
      const [analysisResponse, documentsResponse] = await Promise.all([
        authenticatedFetch('/api/analysis'),
        authenticatedFetch('/api/documents')
      ])

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json()
        setAnalysisResults(analysisData.analyses || [])
        setAnalysisStats(analysisData.stats || null)
      }

      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json()
        setDocuments(documentsData || [])
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalysisData()
  }, [fetchAnalysisData])

  const handleGenerateAnalysis = async () => {
    setIsGenerating(true)
    setGenerateMsg('Running AI analysis on your documents...')
    try {
      const { authenticatedFetch } = await import('@/lib/api-client')
      const resp = await authenticatedFetch('/api/analysis/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      const data = await resp.json()
      if (resp.ok) {
        setGenerateMsg(`✅ Generated ${data.count} insights! Refreshing...`)
        await fetchAnalysisData()
      } else {
        setGenerateMsg(`❌ ${data.error || 'Analysis failed'}`)
      }
    } catch (err) {
      setGenerateMsg('❌ Network error. Please try again.')
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerateMsg(''), 4000)
    }
  }

  const handleExport = () => {
    const csv = [
      ['Type', 'Title', 'Description', 'Confidence', 'Severity', 'Documents', 'Date'].join(','),
      ...analysisResults.map(r => [
        r.type, `"${r.title}"`, `"${r.description.replace(/"/g, '""')}"`,
        r.confidence + '%', r.severity || 'LOW', `"${r.documents.join('; ')}"`,
        new Date(r.timestamp).toLocaleDateString()
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'analysis-export.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeColor = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'RISK': return 'bg-rose-100/60 text-rose-700 dark:bg-rose-900/25 dark:text-rose-400'
      case 'INSIGHT': return 'bg-indigo-100/60 text-indigo-700 dark:bg-indigo-900/25 dark:text-indigo-400'
      case 'OPPORTUNITY': return 'bg-amber-100/60 text-amber-700 dark:bg-amber-900/25 dark:text-amber-400'
      case 'COMPLIANCE': return 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400'
    }
  }

  const getTypeIcon = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'RISK': return <AlertTriangle className="w-4 h-4" />
      case 'INSIGHT': return <Lightbulb className="w-4 h-4" />
      case 'OPPORTUNITY': return <TrendingUp className="w-4 h-4" />
      case 'COMPLIANCE': return <CheckCircle className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'HIGH': return 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
      case 'MEDIUM': return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      default: return 'text-muted-foreground border-border'
    }
  }

  const stats = {
    processedDocuments: analysisStats?.completedDocuments ?? documents.filter(d => d.status === 'COMPLETED').length,
    totalDocuments: analysisStats?.totalDocuments ?? documents.length,
    totalInsights: analysisStats?.byType?.INSIGHT || 0,
    risksIdentified: analysisStats?.byType?.RISK || 0,
    totalQueries: analysisStats?.totalQueries || 0,
    avgConfidence: analysisStats?.averageConfidence || 0,
  }

  const maxQueryCount = Math.max(...(analysisStats?.queriesPerDay?.map(d => d.count) || [1]), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Analysis & Insights</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            AI-generated insights from your documents · {analysisResults.length} results
          </p>
        </div>
        <div className="flex items-center gap-2">
          {generateMsg && (
            <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full">{generateMsg}</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalysisData}
            disabled={isLoading}
            className="rounded-full h-9 px-4 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateAnalysis}
            disabled={isGenerating || documents.filter(d => d.status === 'COMPLETED').length === 0}
            className="rounded-full h-9 px-4 text-xs gap-1.5"
          >
            {isGenerating
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...</>
              : <><Sparkles className="w-3.5 h-3.5" /> Run AI Analysis</>
            }
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-secondary rounded-xl text-muted-foreground shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Processed</p>
              <p className="text-xl font-semibold">
                {stats.processedDocuments}<span className="text-muted-foreground/50 text-sm font-normal">/{stats.totalDocuments}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Key Insights</p>
              <p className="text-xl font-semibold">{stats.totalInsights}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Risks Flagged</p>
              <p className="text-xl font-semibold">{stats.risksIdentified}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Queries</p>
              <p className="text-xl font-semibold">{stats.totalQueries}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <div className="bg-background rounded-2xl p-1.5 shadow-sm border border-border inline-flex w-fit">
          <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-1">
            {[
              { value: 'analysis', label: 'Analysis Log' },
              { value: 'documents', label: 'Document Summary' },
              { value: 'trends', label: 'Trends & Patterns' },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-2 px-4 transition-all shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Analysis Log Tab */}
        <TabsContent value="analysis" className="m-0 outline-none">
          <Card className="border border-border shadow-sm bg-card overflow-hidden">
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-background/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">
                  Detailed Records
                  {analysisResults.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">({analysisResults.length})</span>
                  )}
                </h3>
              </div>
              <div className="flex gap-2">
                {analysisResults.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExport} className="h-8 rounded-lg font-medium text-xs">
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
                      Click <strong>"Run AI Analysis"</strong> above to generate structured insights from your uploaded documents.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleGenerateAnalysis}
                      disabled={isGenerating || documents.filter(d => d.status === 'COMPLETED').length === 0}
                      className="rounded-full gap-1.5 text-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {documents.filter(d => d.status === 'COMPLETED').length === 0
                        ? 'Upload documents first'
                        : 'Generate Analysis'}
                    </Button>
                  </div>
                ) : (
                  analysisResults.map((result) => (
                    <div
                      key={result.id}
                      className={`p-5 hover:bg-secondary/20 transition-colors cursor-pointer ${selectedAnalysis === result.id ? 'bg-secondary/30' : ''}`}
                      onClick={() => setSelectedAnalysis(selectedAnalysis === result.id ? null : result.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2.5 rounded-xl border border-border/50 shadow-sm shrink-0 ${getTypeColor(result.type)}`}>
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h4 className="font-semibold text-foreground text-sm">{result.title}</h4>
                            <Badge variant="secondary" className={`capitalize text-xs shadow-none border-none font-medium px-2 py-0.5 ${getTypeColor(result.type)}`}>
                              {result.type.toLowerCase()}
                            </Badge>
                            {result.severity && result.severity !== 'LOW' && (
                              <Badge variant="outline" className={`capitalize text-xs font-medium ${getSeverityColor(result.severity)}`}>
                                {result.severity.toLowerCase()} severity
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{result.description}</p>
                          <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Confidence: <span className="text-foreground ml-0.5">{result.confidence}%</span>
                            </span>
                            {result.documents.length > 0 && (
                              <>
                                <span className="text-border">•</span>
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {result.documents[0]}{result.documents.length > 1 ? ` +${result.documents.length - 1}` : ''}
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
                          {selectedAnalysis === result.id
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {selectedAnalysis === result.id && (
                        <div className="mt-4 pt-4 border-t border-border/50 ml-14 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                              <FileText className="w-3 h-3" /> Referenced Documents
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {result.documents.length > 0
                                ? result.documents.map((d, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs font-normal">{d}</Badge>
                                ))
                                : <span className="text-xs text-muted-foreground">No specific document</span>
                              }
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
                            <p className="text-xs text-right text-muted-foreground">{result.confidence}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Document Summary Tab */}
        <TabsContent value="documents" className="m-0 outline-none">
          {isLoading ? (
            <Card className="border border-border shadow-sm py-24 flex flex-col items-center justify-center text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p className="font-medium text-sm">Loading document summaries...</p>
            </Card>
          ) : documents.length === 0 ? (
            <Card className="border border-border shadow-sm py-24 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold mb-1 text-foreground">No documents indexed</h3>
              <p className="text-sm">Upload files to view their summaries.</p>
            </Card>
          ) : (
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
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="m-0 outline-none">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}