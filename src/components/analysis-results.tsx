'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Documents Processed</p>
                <p className="font-semibold">{stats.processedDocuments}/{stats.totalDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Insights Found</p>
                <p className="font-semibold">{stats.totalInsights}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Risks Identified</p>
                <p className="font-semibold">{stats.risksIdentified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Analysis Results</TabsTrigger>
          <TabsTrigger value="documents">Document Summary</TabsTrigger>
          <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Analysis Results
                  </CardTitle>
                  <CardDescription>
                    AI-powered insights and findings from your documents
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {analysisResults.map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedAnalysis(selectedAnalysis === result.id ? null : result.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getTypeIcon(result.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{result.title}</h3>
                              <Badge className={getTypeColor(result.type)}>
                                {result.type}
                              </Badge>
                              {result.severity && (
                                <div className={`w-2 h-2 rounded-full ${getSeverityColor(result.severity)}`} />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{result.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                <span>Confidence: {result.confidence}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span>{result.documents.length} document(s)</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{result.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {selectedAnalysis === result.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t"
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Related Documents</h4>
                              <div className="flex flex-wrap gap-2">
                                {result.documents.map((doc, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {doc}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm mb-2">Confidence Score</h4>
                              <div className="flex items-center gap-2">
                                <Progress value={result.confidence} className="flex-1 h-2" />
                                <span className="text-sm font-medium">{result.confidence}%</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Analysis Summary
              </CardTitle>
              <CardDescription>
                Overview of insights and findings per document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
                    <p className="text-gray-500">Loading document analysis...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-500">Upload some documents to see analysis results.</p>
                  </div>
                ) : (
                  documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{doc.name}</h3>
                          <p className="text-sm text-gray-500">
                            {doc.type} • {doc.category || 'Uncategorized'} • {new Date(doc.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{doc.analysisCount || 0}</div>
                          <div className="text-xs text-gray-500">Analyses</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{doc.queryCount || 0}</div>
                          <div className="text-xs text-gray-500">Queries</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${doc.status === 'COMPLETED' ? 'text-green-600' : doc.status === 'PROCESSING' ? 'text-blue-600' : 'text-yellow-600'}`}>
                            {doc.status === 'COMPLETED' ? '✓' : doc.status === 'PROCESSING' ? '⏳' : '📤'}
                          </div>
                          <div className="text-xs text-gray-500">Status</div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trends & Patterns
              </CardTitle>
              <CardDescription>
                Emerging patterns and trends identified across your documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Key Trends</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Processing efficiency improving</p>
                        <p className="text-xs text-gray-500">23% faster processing over last month</p>
                      </div>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Compliance issues increasing</p>
                        <p className="text-xs text-gray-500">15% more issues detected this quarter</p>
                      </div>
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Document volume growing</p>
                        <p className="text-xs text-gray-500">45% more documents processed</p>
                      </div>
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Recommendations</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Update compliance templates
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300">
                        Review and standardize contract templates
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Implement automated processing
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-300">
                        Leverage AI for document classification
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Schedule regular audits
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-300">
                        Monthly compliance reviews recommended
                      </p>
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