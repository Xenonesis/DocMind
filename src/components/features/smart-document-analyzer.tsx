'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Lightbulb,
  Target,
  Shield,
  Zap
} from 'lucide-react'

interface AnalysisResult {
  type: 'insight' | 'risk' | 'opportunity' | 'compliance'
  title: string
  description: string
  confidence: number
  severity: 'low' | 'medium' | 'high'
  category: string
  suggestions: string[]
  relatedDocuments: string[]
}

interface SmartAnalysisProps {
  documentId: string
  documentName: string
  onAnalysisComplete?: (results: AnalysisResult[]) => void
}

export function SmartDocumentAnalyzer({ documentId, documentName, onAnalysisComplete }: SmartAnalysisProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<AnalysisResult[]>([])

  const runSmartAnalysis = async () => {
    setAnalyzing(true)
    setProgress(0)
    setResults([])

    try {
      // Simulate progressive analysis
      const steps = [
        'Extracting document content...',
        'Analyzing structure and patterns...',
        'Identifying key insights...',
        'Checking compliance requirements...',
        'Generating recommendations...'
      ]

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setProgress((i + 1) * 20)
      }

      // Mock analysis results - replace with real API call
      const mockResults: AnalysisResult[] = [
        {
          type: 'insight',
          title: 'Key Performance Indicators Identified',
          description: 'Document contains 5 measurable KPIs that could be tracked for business improvement.',
          confidence: 92,
          severity: 'medium',
          category: 'Business Intelligence',
          suggestions: [
            'Set up automated tracking for identified KPIs',
            'Create dashboard for real-time monitoring',
            'Establish baseline measurements'
          ],
          relatedDocuments: ['quarterly-report.pdf', 'metrics-dashboard.xlsx']
        },
        {
          type: 'risk',
          title: 'Potential Compliance Gap',
          description: 'Document references data handling practices that may not align with GDPR requirements.',
          confidence: 78,
          severity: 'high',
          category: 'Compliance',
          suggestions: [
            'Review data processing procedures',
            'Update privacy policy sections',
            'Consult with legal team'
          ],
          relatedDocuments: ['privacy-policy.pdf', 'gdpr-checklist.docx']
        },
        {
          type: 'opportunity',
          title: 'Cost Optimization Potential',
          description: 'Analysis reveals 3 areas where operational costs could be reduced by 15-20%.',
          confidence: 85,
          severity: 'medium',
          category: 'Financial',
          suggestions: [
            'Implement suggested process improvements',
            'Negotiate better vendor contracts',
            'Automate manual processes'
          ],
          relatedDocuments: ['budget-analysis.xlsx', 'vendor-contracts.pdf']
        }
      ]

      setResults(mockResults)
      onAnalysisComplete?.(mockResults)

    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
      setProgress(100)
    }
  }

  const getTypeIcon = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'insight': return <Lightbulb className="w-4 h-4" />
      case 'risk': return <AlertTriangle className="w-4 h-4" />
      case 'opportunity': return <Target className="w-4 h-4" />
      case 'compliance': return <Shield className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: AnalysisResult['type']) => {
    switch (type) {
      case 'insight': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'risk': return 'bg-red-100 text-red-800 border-red-200'
      case 'opportunity': return 'bg-green-100 text-green-800 border-green-200'
      case 'compliance': return 'bg-purple-100 text-purple-800 border-purple-200'
    }
  }

  const getSeverityColor = (severity: AnalysisResult['severity']) => {
    switch (severity) {
      case 'low': return 'bg-gray-100 text-gray-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Smart Document Analysis
        </CardTitle>
        <CardDescription>
          AI-powered analysis of {documentName} for insights, risks, and opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!analyzing && results.length === 0 && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Smart Analysis</h3>
            <p className="text-gray-500 mb-4">
              Get AI-powered insights, risk assessment, and recommendations for your document.
            </p>
            <Button onClick={runSmartAnalysis} className="gap-2">
              <Zap className="w-4 h-4" />
              Start Analysis
            </Button>
          </div>
        )}

        {analyzing && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-blue-600 mb-2">
                <Brain className="w-5 h-5 animate-pulse" />
                <span className="font-medium">Analyzing Document...</span>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 text-center">
              This may take a few moments while our AI analyzes your document.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['insight', 'risk', 'opportunity', 'compliance'] as const).map((type) => {
                  const count = results.filter(r => r.type === type).length
                  return (
                    <Card key={type}>
                      <CardContent className="p-4 text-center">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getTypeColor(type)} mb-2`}>
                          {getTypeIcon(type)}
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </div>
                        <div className="text-2xl font-bold">{count}</div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="space-y-3">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getTypeColor(result.type)}>
                                {getTypeIcon(result.type)}
                                {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                              </Badge>
                              <Badge variant="outline" className={getSeverityColor(result.severity)}>
                                {result.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {result.confidence}% confidence
                              </Badge>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{result.title}</h4>
                            <p className="text-sm text-gray-600">{result.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {(['insights', 'risks', 'opportunities'] as const).map((tabType) => (
              <TabsContent key={tabType} value={tabType} className="space-y-4">
                {results
                  .filter(r => r.type === tabType.slice(0, -1) as AnalysisResult['type'])
                  .map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{result.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge className={getSeverityColor(result.severity)}>
                                  {result.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">
                                  {result.confidence}% confidence
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-gray-600">{result.description}</p>
                            
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2">Recommendations:</h5>
                              <ul className="space-y-1">
                                {result.suggestions.map((suggestion, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {result.relatedDocuments.length > 0 && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Related Documents:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {result.relatedDocuments.map((doc, idx) => (
                                    <Badge key={idx} variant="outline" className="gap-1">
                                      <FileText className="w-3 h-3" />
                                      {doc}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}