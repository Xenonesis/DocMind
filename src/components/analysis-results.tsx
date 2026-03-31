'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import type { AnalysisResult, AnalysisStats, DocumentSummary } from '@/types'
import { AnalysisLog } from './analysis/analysis-log'
import { DocumentSummaryGrid } from './analysis/document-summary-grid'
import { TrendsPanel } from './analysis/trends-panel'

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

  useEffect(() => { fetchAnalysisData() }, [fetchAnalysisData])

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
    } catch {
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

  const stats = {
    processedDocuments: analysisStats?.completedDocuments ?? documents.filter(d => d.status === 'COMPLETED').length,
    totalDocuments: analysisStats?.totalDocuments ?? documents.length,
    totalInsights: analysisStats?.byType?.INSIGHT || 0,
    risksIdentified: analysisStats?.byType?.RISK || 0,
    totalQueries: analysisStats?.totalQueries || 0,
  }

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
          <Button variant="outline" size="sm" onClick={fetchAnalysisData} disabled={isLoading} className="rounded-full h-9 px-4 text-xs">
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
            <div className="p-2.5 bg-secondary rounded-xl text-muted-foreground shrink-0"><FileText className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Processed</p>
              <p className="text-xl font-semibold">{stats.processedDocuments}<span className="text-muted-foreground/50 text-sm font-normal">/{stats.totalDocuments}</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0"><Lightbulb className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Key Insights</p>
              <p className="text-xl font-semibold">{stats.totalInsights}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 dark:text-rose-400 shrink-0"><AlertTriangle className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Risks Flagged</p>
              <p className="text-xl font-semibold">{stats.risksIdentified}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0"><MessageSquare className="w-5 h-5" /></div>
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
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-medium py-2 px-4 transition-all shadow-none">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="analysis" className="m-0 outline-none">
          <AnalysisLog
            analysisResults={analysisResults}
            selectedAnalysis={selectedAnalysis}
            onSelectAnalysis={setSelectedAnalysis}
            isLoading={isLoading}
            isGenerating={isGenerating}
            documents={documents}
            onExport={handleExport}
            onGenerateAnalysis={handleGenerateAnalysis}
          />
        </TabsContent>

        <TabsContent value="documents" className="m-0 outline-none">
          <DocumentSummaryGrid documents={documents} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="trends" className="m-0 outline-none">
          <TrendsPanel analysisStats={analysisStats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}