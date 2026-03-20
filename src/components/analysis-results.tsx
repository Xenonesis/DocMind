'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Filter,
  Target,
  Lightbulb,
  RefreshCw,
  Inbox
} from 'lucide-react'

interface AnalysisResult {
  id: string
  type: 'INSIGHT' | 'RISK' | 'OPPORTUNITY' | 'COMPLIANCE'
  title: string
  description: string
  confidence: number
  document: {
    id: string
    name: string
    type: string
    category: string
  }
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

  const fetchAnalysisData = async () => {
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
  }

  useEffect(() => {
    fetchAnalysisData()
  }, [])

  const getTypeColor = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'RISK': return 'bg-rose-100/50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
      case 'INSIGHT': return 'bg-indigo-100/50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
      case 'OPPORTUNITY': return 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
      case 'COMPLIANCE': return 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
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

  const stats = {
    totalDocuments: documents.length,
    processedDocuments: documents.filter(d => d.status === 'COMPLETED').length,
    totalInsights: analysisStats?.total || 0,
    risksIdentified: analysisStats?.byType?.RISK || 0,
    opportunitiesFound: analysisStats?.byType?.OPPORTUNITY || 0,
    complianceIssues: analysisStats?.byType?.COMPLIANCE || 0
  }

  return (
    <div className="space-y-8 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Analysis & Insights</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Review detailed reports and system-generated metrics from your parsed documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-secondary rounded-xl text-muted-foreground">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processed</p>
              <p className="text-2xl font-semibold">
                {stats.processedDocuments}<span className="text-muted-foreground/50 text-base font-normal"> / {stats.totalDocuments}</span>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Key Insights</p>
              <p className="text-2xl font-semibold">{stats.totalInsights}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Risks Flagged</p>
              <p className="text-2xl font-semibold">{stats.risksIdentified}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analysis" className="flex-1 flex flex-col space-y-6">
        <div className="bg-background rounded-2xl p-1.5 shadow-sm border border-border inline-flex w-fit">
          <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-1">
            <TabsTrigger value="analysis" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground font-medium py-2 px-4 transition-all shadow-none text-muted-foreground border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm">
              Analysis Log
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground font-medium py-2 px-4 transition-all shadow-none text-muted-foreground border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm">
              Document Summary
            </TabsTrigger>
            <TabsTrigger value="trends" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground font-medium py-2 px-4 transition-all shadow-none text-muted-foreground border border-transparent data-[state=active]:border-border data-[state=active]:shadow-sm">
              Trends & Patterns
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analysis" className="m-0 flex-1 outline-none">
          <Card className="border border-border shadow-sm bg-card h-[600px] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-background/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-medium text-sm">Detailed Records</h3>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="h-8 rounded-lg font-medium text-xs">
                  <Filter className="w-3.5 h-3.5 mr-1.5" /> Filter
                </Button>
                <Button variant="outline" size="sm" className="h-8 rounded-lg font-medium text-xs">
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="divide-y divide-border/40">
                {analysisResults.map((result) => (
                  <div
                    key={result.id}
                    className={`p-5 hover:bg-secondary/20 transition-colors cursor-pointer group ${selectedAnalysis === result.id ? 'bg-secondary/30' : ''}`}
                    onClick={() => setSelectedAnalysis(selectedAnalysis === result.id ? null : result.id)}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                      <div className={`p-2.5 rounded-xl border border-border/50 shadow-sm ${getTypeColor(result.type)}`}>
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 space-y-2.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="font-semibold text-foreground truncate max-w-full">{result.title}</h4>
                          <Badge variant="secondary" className={`capitalize shadow-none border-none font-medium px-2 py-0.5 ${getTypeColor(result.type)}`}>
                            {result.type.toLowerCase()}
                          </Badge>
                          {result.severity && (
                            <Badge variant="outline" className="capitalize font-medium text-xs border-border text-muted-foreground bg-background">
                              {result.severity.toLowerCase()} Severity
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{result.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-xs font-medium text-muted-foreground pt-1">
                          <span className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" /> Confidence: <span className="text-foreground">{result.confidence}%</span>
                          </span>
                          <span className="text-border">•</span>
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> {result.documents.length} source file(s)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {selectedAnalysis === result.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 pt-5 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-8 ml-14">
                            <div>
                              <h5 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5" /> Referenced Files
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {result.documents.map((doc, index) => (
                                  <Badge key={index} variant="secondary" className="font-normal text-xs bg-background border-border shadow-sm">
                                    {doc}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                <Target className="w-3.5 h-3.5" /> Accuracy Metrics
                              </h5>
                              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-2 shadow-inner">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all duration-1000"
                                  style={{ width: `${result.confidence}%` }}
                                />
                              </div>
                              <p className="text-xs text-right font-medium text-muted-foreground">{result.confidence}% Model Confidence</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                
                {analysisResults.length === 0 && (
                  <div className="text-center py-20 bg-background/50 h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                      <Inbox className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No analysis logs</h3>
                    <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                      Run queries or upload documents to generate insights.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="m-0 outline-none">
          {isLoading ? (
            <Card className="border border-border shadow-sm py-24 flex flex-col items-center justify-center text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p className="font-medium text-sm">Gathering document summaries...</p>
            </Card>
          ) : documents.length === 0 ? (
            <Card className="border border-border shadow-sm py-24 flex flex-col items-center justify-center text-muted-foreground bg-background/50">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">No documents indexed</h3>
              <p className="text-sm">Upload files to view their analytical summaries.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {documents.map((doc) => (
                <Card key={doc.id} className="shadow-sm border-border hover:shadow-md transition-shadow group overflow-hidden flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate" title={doc.name}>{doc.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{doc.type} • {doc.category || 'Uncategorized'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
                      <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/30">
                        <p className="text-lg font-semibold text-foreground">{doc.analysisCount || 0}</p>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mt-0.5">Hits</p>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-lg bg-secondary/30">
                        <p className="text-lg font-semibold text-foreground">{doc.queryCount || 0}</p>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mt-0.5">Queries</p>
                      </div>
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-secondary/30">
                        {doc.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : 
                         doc.status === 'PROCESSING' ? <RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> : 
                         <Clock className="w-5 h-5 text-amber-500" />}
                         <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mt-1.5">{doc.status.toLowerCase()}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="m-0 outline-none">
          <Card className="border border-border shadow-sm">
            <CardHeader className="bg-background/50 border-b border-border/50 p-5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                System Patterns & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">Macro Trends</h3>
                  <div className="space-y-3">
                    <div className="p-4 flex gap-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg h-fit shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-base mb-0.5">Speed Delta: +23%</p>
                        <p className="text-sm text-muted-foreground leading-snug">Processing efficiency improved over the last 30 days due to vector cache optimization.</p>
                      </div>
                    </div>
                    <div className="p-4 flex gap-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-2.5 rounded-lg h-fit shadow-sm border border-rose-100 dark:border-rose-800/50">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-base mb-0.5">Risk Delta: +15%</p>
                        <p className="text-sm text-muted-foreground leading-snug">Compliance flag increase in the current epoch, primarily in HR documents.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">AI Directives</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                      <h4 className="font-semibold text-base mb-1.5 flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                        Patch Templates
                      </h4>
                      <p className="text-sm text-muted-foreground leading-snug">Review and standardize contract templates across all units to mitigate emerging liability vectors identified in recent uploads.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                      <h4 className="font-semibold text-base mb-1.5 flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                        Audit Schedule
                      </h4>
                      <p className="text-sm text-muted-foreground leading-snug">Enforce rigid 30-day compliance reviews to intercept rising anomaly trends detected within external communication logs.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}