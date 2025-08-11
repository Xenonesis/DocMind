'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Wifi, 
  WifiOff,
  Clock,
  Zap,
  Activity
} from 'lucide-react'

interface ConnectionTestResult {
  success: boolean
  message?: string
  response?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model?: string
  provider?: string
  error?: string
  details?: string
  originalError?: string
}

interface ConnectionStatusProps {
  provider: {
    id: string
    name: string
    type: string
    apiKey: string
    model: string
    baseUrl: string
  }
  onTestComplete?: (result: ConnectionTestResult) => void
  autoTest?: boolean
}

export function ConnectionStatus({ provider, onTestComplete, autoTest = false }: ConnectionStatusProps) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<ConnectionTestResult | null>(null)
  const [progress, setProgress] = useState(0)

  const testConnection = async () => {
    if (!provider.apiKey) {
      const errorResult = {
        success: false,
        error: 'API key required',
        details: 'Please enter an API key before testing the connection'
      }
      setResult(errorResult)
      onTestComplete?.(errorResult)
      return
    }

    setTesting(true)
    setProgress(0)
    setResult(null)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      
      const testResult = await authenticatedRequest('/api/test-connection', {
        method: 'POST',
        body: JSON.stringify({ provider })
      })

      setProgress(100)
      setResult(testResult)
      onTestComplete?.(testResult)

    } catch (error: any) {
      console.error('Connection test failed:', error)
      const errorResult = {
        success: false,
        error: 'Connection test failed',
        details: error.message || 'An unexpected error occurred'
      }
      setResult(errorResult)
      onTestComplete?.(errorResult)
    } finally {
      clearInterval(progressInterval)
      setTesting(false)
      setProgress(100)
    }
  }

  useEffect(() => {
    if (autoTest && provider.apiKey) {
      testConnection()
    }
  }, [autoTest, provider.apiKey])

  const getStatusIcon = () => {
    if (testing) return <Loader2 className="w-4 h-4 animate-spin" />
    if (!result) return <Wifi className="w-4 h-4 text-gray-400" />
    if (result.success) return <CheckCircle className="w-4 h-4 text-green-500" />
    return <AlertCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusColor = () => {
    if (testing) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (!result) return 'bg-gray-100 text-gray-800 border-gray-200'
    if (result.success) return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getStatusText = () => {
    if (testing) return 'Testing...'
    if (!result) return 'Not tested'
    if (result.success) return 'Connected'
    return 'Failed'
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor()} gap-1`}>
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            {result?.model && (
              <Badge variant="outline" className="text-xs">
                {result.model}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={testing || !provider.apiKey}
          >
            {testing ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Testing
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 mr-2" />
                Test
              </>
            )}
          </Button>
        </div>

        {testing && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500">Testing connection to {provider.name}...</p>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {result.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{result.message}</span>
                  </div>
                  
                  {result.response && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-xs text-green-800 font-medium mb-1">AI Response:</p>
                      <p className="text-sm text-green-700">{result.response}</p>
                    </div>
                  )}

                  {result.usage && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                        <div className="font-medium text-blue-800">{result.usage.promptTokens}</div>
                        <div className="text-blue-600">Prompt</div>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded p-2 text-center">
                        <div className="font-medium text-purple-800">{result.usage.completionTokens}</div>
                        <div className="text-purple-600">Response</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                        <div className="font-medium text-gray-800">{result.usage.totalTokens}</div>
                        <div className="text-gray-600">Total</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{result.error}</span>
                  </div>
                  
                  {result.details && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-xs text-red-800 font-medium mb-1">Details:</p>
                      <p className="text-sm text-red-700">{result.details}</p>
                    </div>
                  )}

                  {result.originalError && result.originalError !== result.details && (
                    <details className="text-xs">
                      <summary className="text-red-600 cursor-pointer">Technical details</summary>
                      <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 font-mono">
                        {result.originalError}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}