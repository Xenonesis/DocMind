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
  Calendar
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
      case 'RISK': return 'bg-red-100 text-red-800 border-red-200'
      case 'INSIGHT': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'OPPORTUNITY': return 'bg-green-100 text-green-800 border-green-200'
      case 'COMPLIANCE': return 'bg-purple-100 text-purple-800 border-purple-200'
    }
  }

  const getTypeIcon = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'RISK': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'INSIGHT': return <Lightbulb className="w-4 h-4 text-blue-500" />
      case 'OPPORTUNITY': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'COMPLIANCE': return <CheckCircle className="w-4 h-4 text-purple-500" />
    }
  }

  const getSeverityColor = (severity?: AnalysisResult['severity']) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-green-500'
      default: return 'bg-gray-500'
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
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Documents Processed</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                  {stats.processedDocuments}<span className="text-lg text-slate-400 dark:text-slate-500">/{stats.totalDocuments}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Insights Found</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                  {stats.totalInsights}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <CardContent className="p-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Risks Identified</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400">
                  {stats.risksIdentified}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-8">
        <TabsList className="grid w-full sm:w-[600px] grid-cols-3 mx-auto bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-slate-200/50 dark:border-slate-700/50">
          <TabsTrigger value="analysis" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 font-medium transition-all duration-300">Analysis Results</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 font-medium transition-all duration-300">Document Summary</TabsTrigger>
          <TabsTrigger value="trends" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 font-medium transition-all duration-300">Trends & Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6 outline-none focus-visible:ring-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-[2rem] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="p-6 sm:p-8 border-b border-slate-200/50 dark:border-slate-700/50 relative z-10 bg-white/40 dark:bg-slate-900/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      Analysis Results
                    </CardTitle>
                    <CardDescription className="mt-2 text-base text-slate-600 dark:text-slate-400">
                      AI-powered insights and findings from your documents
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <Filter className="w-4 h-4 mr-2 text-slate-500 hover:text-blue-500" />
                      <span className="font-medium">Filter</span>
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <Download className="w-4 h-4 mr-2 text-slate-500 hover:text-green-500" />
                      <span className="font-medium">Export</span>
                    </Button>
                  </div>
                </div>
            </CardHeader>
              <CardContent className="p-0 sm:p-4">
                <ScrollArea className="h-[600px] px-4 sm:px-6 py-6">
                  <div className="space-y-4 pr-4">
                    {analysisResults.map((result) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-lg hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer overflow-hidden z-10"
                        onClick={() => setSelectedAnalysis(selectedAnalysis === result.id ? null : result.id)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 w-full">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`mt-1 p-2.5 rounded-xl border shadow-sm ${
                            result.type === 'RISK' ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50' :
                            result.type === 'INSIGHT' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50' :
                            result.type === 'OPPORTUNITY' ? 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800/50' :
                            'bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800/50'
                          }`}>
                            {getTypeIcon(result.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">{result.title}</h3>
                              <Badge className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getTypeColor(result.type)}`}>
                                {result.type}
                              </Badge>
                              {result.severity && (
                                <Badge variant="outline" className={`px-2 py-0.5 text-[10px] uppercase font-bold border-2 ${
                                  result.severity === 'HIGH' ? 'border-red-500 text-red-600 dark:text-red-400' :
                                  result.severity === 'MEDIUM' ? 'border-amber-500 text-amber-600 dark:text-amber-400' :
                                  'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {result.severity} Risk
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{result.description}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-500">
                              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                <Target className="w-3.5 h-3.5 text-slate-400" />
                                <span>Confidence: <span className="text-slate-700 dark:text-slate-300">{result.confidence}%</span></span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span><span className="text-slate-700 dark:text-slate-300">{result.documents.length}</span> doc(s)</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{new Date(result.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-auto sm:ml-0 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {selectedAnalysis === result.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50 overflow-hidden relative z-10 w-full"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-5 border border-slate-100 dark:border-slate-700/30">
                              <div>
                                <h4 className="font-semibold text-sm mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  Related Documents
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {result.documents.map((doc, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs font-medium px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-shadow cursor-default">
                                      {doc}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                  <Target className="w-4 h-4 text-slate-400" />
                                  Confidence Score
                                </h4>
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500 font-medium">Model Certainty</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{result.confidence}%</span>
                                  </div>
                                  <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                    <motion.div 
                                      className={`h-full rounded-full ${
                                        result.confidence >= 90 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                                        result.confidence >= 70 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                        result.confidence >= 50 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                                        'bg-gradient-to-r from-red-400 to-rose-500'
                                      }`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${result.confidence}%` }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

        <TabsContent value="documents" className="space-y-6 outline-none focus-visible:ring-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-[2rem] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="p-6 sm:p-8 border-b border-slate-200/50 dark:border-slate-700/50 relative z-10 bg-white/40 dark:bg-slate-900/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      Document Analysis Summary
                    </CardTitle>
                    <CardDescription className="mt-2 text-base text-slate-600 dark:text-slate-400">
                      Overview of insights and findings per document
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {isLoading ? (
                    <div className="col-span-full text-center py-12">
                      <RefreshCw className="w-10 h-10 mx-auto animate-spin text-indigo-500 mb-4" />
                      <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Loading document analysis...</p>
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="col-span-full text-center py-16 px-4 backdrop-blur-sm bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner transform rotate-3">
                        <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No documents found</h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Upload some documents to see their detailed analysis results and insights.</p>
                    </div>
                  ) : (
                    documents.map((doc, index) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="pr-4">
                              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{doc.name}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <Badge variant="secondary" className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-none">
                                  {doc.type}
                                </Badge>
                                <span>•</span>
                                <span className="truncate max-w-[120px]">{doc.category || 'Uncategorized'}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group-hover:shadow-sm">
                              <Eye className="w-5 h-5" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6 mt-auto bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <div className="text-center group/stat">
                              <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 group-hover/stat:scale-110 transition-transform">
                                {doc.analysisCount || 0}
                              </div>
                              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Analyses</div>
                            </div>
                            <div className="text-center group/stat border-x border-slate-200 dark:border-slate-700/50 px-2">
                              <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 group-hover/stat:scale-110 transition-transform">
                                {doc.queryCount || 0}
                              </div>
                              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">Queries</div>
                            </div>
                            <div className="text-center flex flex-col items-center justify-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner ${
                                doc.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : 
                                doc.status === 'PROCESSING' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50' : 
                                'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                              }`}>
                                {doc.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5" /> : 
                                 doc.status === 'PROCESSING' ? <RefreshCw className="w-5 h-5 animate-spin" /> : 
                                 <Clock className="w-5 h-5" />}
                              </div>
                              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">Status</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 outline-none focus-visible:ring-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-[2rem] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="p-6 sm:p-8 border-b border-slate-200/50 dark:border-slate-700/50 relative z-10 bg-white/40 dark:bg-slate-900/40">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                      <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      Trends & Patterns
                    </CardTitle>
                    <CardDescription className="mt-2 text-base text-slate-600 dark:text-slate-400">
                      Emerging patterns and trends identified across your documents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-500" />
                      Key Trends
                    </h3>
                    <div className="space-y-4">
                      <motion.div whileHover={{ scale: 1.02 }} className="flex items-start gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all">
                        <div className="mt-1 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Processing efficiency improving</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">23% faster processing over last month</p>
                        </div>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.02 }} className="flex items-start gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all">
                        <div className="mt-1 p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Compliance issues increasing</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">15% more issues detected this quarter</p>
                        </div>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.02 }} className="flex items-start gap-4 p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all">
                        <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Document volume growing</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">45% more documents processed</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-500" />
                      Recommendations
                    </h3>
                    <div className="space-y-4">
                      <motion.div whileHover={{ scale: 1.02 }} className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 shadow-sm">
                        <p className="text-base font-bold text-blue-800 dark:text-blue-300 mb-1">
                          Update compliance templates
                        </p>
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                          Review and standardize contract templates across all departments to mitigate emerging risks.
                        </p>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.02 }} className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 shadow-sm">
                        <p className="text-base font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                          Implement automated processing
                        </p>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                          Leverage AI for document classification to handle the growing volume more efficiently.
                        </p>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.02 }} className="p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-2xl border border-purple-100/50 dark:border-purple-800/30 shadow-sm">
                        <p className="text-base font-bold text-purple-800 dark:text-purple-300 mb-1">
                          Schedule regular audits
                        </p>
                        <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
                          Monthly compliance reviews recommended to address the increasing trend in issues.
                        </p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}