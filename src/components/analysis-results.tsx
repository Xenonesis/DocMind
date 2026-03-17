'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Share,
  RefreshCw,
  Eye,
  Filter,
  Search,
  Target,
  Lightbulb,
  Users,
  Calendar,
  TerminalSquare
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

  // Fetch analysis data from API
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
      case 'RISK': return 'bg-destructive text-destructive-foreground border-4 border-foreground'
      case 'INSIGHT': return 'bg-accent text-white border-4 border-foreground'
      case 'OPPORTUNITY': return 'bg-green-500 text-black border-4 border-foreground'
      case 'COMPLIANCE': return 'bg-purple-500 text-white border-4 border-foreground'
    }
  }

  const getTypeIcon = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'RISK': return <AlertTriangle className="w-5 h-5" />
      case 'INSIGHT': return <Lightbulb className="w-5 h-5" />
      case 'OPPORTUNITY': return <TrendingUp className="w-5 h-5" />
      case 'COMPLIANCE': return <CheckCircle className="w-5 h-5" />
    }
  }

  // Calculate stats from real data
  const stats = {
    totalDocuments: documents.length,
    processedDocuments: documents.filter(d => d.status === 'COMPLETED').length,
    totalInsights: analysisStats?.total || 0,
    risksIdentified: analysisStats?.byType?.RISK || 0,
    opportunitiesFound: analysisStats?.byType?.OPPORTUNITY || 0,
    complianceIssues: analysisStats?.byType?.COMPLIANCE || 0
  }

  return (
    <div className="space-y-8 font-mono">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-4 border-foreground bg-background p-6 brutal-shadow flex items-start gap-4">
          <FileText className="w-8 h-8" />
          <div>
            <p className="font-mono text-sm uppercase font-bold">DOCS_PROCESSED</p>
            <p className="text-4xl font-black mt-2">
              {stats.processedDocuments}<span className="text-xl opacity-50">/{stats.totalDocuments}</span>
            </p>
          </div>
        </div>
        
        <div className="border-4 border-foreground bg-accent text-white p-6 brutal-shadow flex items-start gap-4">
          <Lightbulb className="w-8 h-8" />
          <div>
            <p className="font-mono text-sm uppercase font-bold">INSIGHTS_FOUND</p>
            <p className="text-4xl font-black mt-2">
              {stats.totalInsights}
            </p>
          </div>
        </div>
        
        <div className="border-4 border-destructive bg-destructive/10 text-destructive p-6 brutal-shadow flex items-start gap-4">
          <AlertTriangle className="w-8 h-8" />
          <div>
            <p className="font-mono text-sm uppercase font-bold">RISKS_FLAGGED</p>
            <p className="text-4xl font-black mt-2">
              {stats.risksIdentified}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-8">
        <div className="border-4 border-foreground bg-background brutal-shadow p-2">
          <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-2 w-full justify-start rounded-none">
            <TabsTrigger value="analysis" className="rounded-none border-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background font-mono uppercase font-bold py-3 px-6 transition-none">
              ANALYSIS_LOG
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-none border-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background font-mono uppercase font-bold py-3 px-6 transition-none">
              DOC_SUMMARY
            </TabsTrigger>
            <TabsTrigger value="trends" className="rounded-none border-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background font-mono uppercase font-bold py-3 px-6 transition-none">
              TRENDS_PATTERNS
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analysis" className="space-y-6 outline-none">
          <Card className="border-4 border-foreground bg-background rounded-none brutal-shadow">
            <CardHeader className="p-6 border-b-4 border-foreground bg-foreground text-background">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  ANALYSIS_RECORDS
                </CardTitle>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-none border-4 border-background bg-foreground text-background hover:bg-background hover:text-foreground font-bold uppercase">
                    <Filter className="w-4 h-4 mr-2" /> FILTER
                  </Button>
                  <Button variant="outline" className="rounded-none border-4 border-background bg-foreground text-background hover:bg-background hover:text-foreground font-bold uppercase">
                    <Download className="w-4 h-4 mr-2" /> EXPORT
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="divide-y-4 divide-foreground">
                  {analysisResults.map((result) => (
                    <div
                      key={result.id}
                      className="group flex flex-col p-6 bg-background hover:bg-foreground/5 cursor-pointer transition-none border-b-4 border-foreground last:border-0"
                      onClick={() => setSelectedAnalysis(selectedAnalysis === result.id ? null : result.id)}
                    >
                      <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
                        <div className={`p-4 border-4 border-foreground brutal-shadow-sm ${
                          result.type === 'RISK' ? 'bg-destructive text-destructive-foreground' :
                          result.type === 'INSIGHT' ? 'bg-accent text-white' :
                          result.type === 'OPPORTUNITY' ? 'bg-green-500 text-black' :
                          'bg-purple-500 text-white'
                        }`}>
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-black uppercase">{result.title}</h3>
                            <Badge className={`rounded-none px-3 py-1 font-bold ${getTypeColor(result.type)}`}>
                              {result.type}
                            </Badge>
                            {result.severity && (
                              <Badge className="rounded-none px-3 py-1 font-bold uppercase border-2 border-foreground bg-background text-foreground">
                                {result.severity}_SEV
                              </Badge>
                            )}
                          </div>
                          <p className="text-base font-medium opacity-80">{result.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm font-bold uppercase pt-2">
                            <span className="flex items-center gap-2 bg-foreground text-background px-2 py-1">
                              <Target className="w-4 h-4" /> CONF: {result.confidence}%
                            </span>
                            <span className="flex items-center gap-2 border-2 border-foreground px-2 py-1">
                              <FileText className="w-4 h-4" /> {result.documents.length} DOCS
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {selectedAnalysis === result.id && (
                        <div className="mt-6 pt-6 border-t-4 border-dashed border-foreground grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-black uppercase mb-4 flex items-center gap-2 text-lg">
                              <FileText className="w-5 h-5" /> RELATED_NODES
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {result.documents.map((doc, index) => (
                                <span key={index} className="border-2 border-foreground px-3 py-1 text-sm font-bold bg-background">
                                  {doc}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-black uppercase mb-4 flex items-center gap-2 text-lg">
                              <Target className="w-5 h-5" /> CONFIDENCE_METRIC
                            </h4>
                            <div className="border-4 border-foreground bg-background w-full h-8 relative brutal-shadow-sm">
                              <div 
                                className="absolute top-0 left-0 h-full bg-accent transition-all duration-1000 border-r-4 border-foreground"
                                style={{ width: `${result.confidence}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center font-black mix-blend-difference text-white">
                                {result.confidence}% MATCH
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 outline-none">
          <Card className="border-4 border-foreground bg-background rounded-none brutal-shadow">
            <CardHeader className="p-6 border-b-4 border-foreground bg-accent text-white">
              <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                <FileText className="w-6 h-6" />
                NODE_SUMMARY
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-10 h-10 mx-auto animate-spin mb-4" />
                  <p className="font-bold uppercase">FETCHING_NODE_DATA...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-16 border-4 border-dashed border-foreground">
                  <TerminalSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-black uppercase mb-2">NO_NODES_INDEXED</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border-4 border-foreground bg-background p-6 brutal-shadow hover:-translate-y-1 transition-transform group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-black uppercase truncate group-hover:text-accent transition-colors" title={doc.name}>{doc.name}</h3>
                          <p className="text-sm font-bold opacity-70 mt-1">{doc.type} // {doc.category || 'UNCATEGORIZED'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-t-4 border-foreground pt-4 mt-4">
                        <div className="text-center">
                          <p className="text-2xl font-black">{doc.analysisCount || 0}</p>
                          <p className="text-[10px] font-bold uppercase mt-1">HITS</p>
                        </div>
                        <div className="text-center border-x-4 border-foreground">
                          <p className="text-2xl font-black">{doc.queryCount || 0}</p>
                          <p className="text-[10px] font-bold uppercase mt-1">QUERIES</p>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          {doc.status === 'COMPLETED' ? <CheckCircle className="w-6 h-6 text-green-500" /> : 
                           doc.status === 'PROCESSING' ? <RefreshCw className="w-6 h-6 animate-spin text-blue-500" /> : 
                           <Clock className="w-6 h-6 text-amber-500" />}
                           <p className="text-[10px] font-bold uppercase mt-2 text-center">{doc.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 outline-none">
          <Card className="border-4 border-foreground bg-background rounded-none brutal-shadow">
            <CardHeader className="p-6 border-b-4 border-foreground bg-destructive text-destructive-foreground">
              <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                SYSTEM_TRENDS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-2xl font-black uppercase border-b-4 border-foreground pb-2">MACRO_PATTERNS</h3>
                  <div className="space-y-4">
                    <div className="border-4 border-foreground p-4 flex gap-4 brutal-shadow-sm">
                      <div className="bg-green-500 p-3 border-4 border-foreground h-fit">
                        <TrendingUp className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <p className="font-black uppercase text-lg">SPEED_DELTA: +23%</p>
                        <p className="font-bold opacity-70">Processing efficiency improvement over 30d</p>
                      </div>
                    </div>
                    <div className="border-4 border-foreground p-4 flex gap-4 brutal-shadow-sm">
                      <div className="bg-destructive p-3 border-4 border-foreground text-destructive-foreground h-fit">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black uppercase text-lg">RISK_DELTA: +15%</p>
                        <p className="font-bold opacity-70">Compliance flag increase in current epoch</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-2xl font-black uppercase border-b-4 border-foreground pb-2">AI_DIRECTIVES</h3>
                  <div className="space-y-4">
                    <div className="border-4 border-foreground p-4 brutal-shadow-sm hover:bg-accent hover:text-white transition-colors cursor-pointer">
                      <p className="font-black uppercase text-lg mb-2">&gt; PATCH_TEMPLATES</p>
                      <p className="font-bold opacity-80">Review and standardize contract templates across all units to mitigate emerging liability vectors.</p>
                    </div>
                    <div className="border-4 border-foreground p-4 brutal-shadow-sm hover:bg-accent hover:text-white transition-colors cursor-pointer">
                      <p className="font-black uppercase text-lg mb-2">&gt; AUDIT_SCHEDULE</p>
                      <p className="font-bold opacity-80">Enforce rigid 30-day compliance reviews to intercept rising anomaly trends.</p>
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