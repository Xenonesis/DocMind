'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Zap,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react'

interface UsageStats {
  totalRequests: number
  totalTokens: number
  estimatedCost: number
  averageResponseTime: number
  successRate: number
  topProvider: string
  dailyUsage: Array<{
    date: string
    requests: number
    tokens: number
    cost: number
  }>
  providerBreakdown: Array<{
    provider: string
    requests: number
    tokens: number
    cost: number
    percentage: number
  }>
}

export function ApiUsageTracker() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

  const loadUsageStats = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with real implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with real API call
      const mockStats: UsageStats = {
        totalRequests: 156,
        totalTokens: 45230,
        estimatedCost: 12.45,
        averageResponseTime: 1.8,
        successRate: 98.7,
        topProvider: 'Google Gemini',
        dailyUsage: [
          { date: '2024-01-15', requests: 23, tokens: 6500, cost: 1.85 },
          { date: '2024-01-16', requests: 31, tokens: 8200, cost: 2.34 },
          { date: '2024-01-17', requests: 28, tokens: 7800, cost: 2.12 },
          { date: '2024-01-18', requests: 35, tokens: 9500, cost: 2.78 },
          { date: '2024-01-19', requests: 22, tokens: 6100, cost: 1.76 },
          { date: '2024-01-20', requests: 17, tokens: 4630, cost: 1.34 },
          { date: '2024-01-21', requests: 0, tokens: 0, cost: 0.26 }
        ],
        providerBreakdown: [
          { provider: 'Google Gemini', requests: 89, tokens: 25400, cost: 7.23, percentage: 57.1 },
          { provider: 'OpenAI GPT-4', requests: 42, tokens: 12800, cost: 3.84, percentage: 26.9 },
          { provider: 'Anthropic Claude', requests: 25, tokens: 7030, cost: 1.38, percentage: 16.0 }
        ]
      }
      
      setStats(mockStats)
    } catch (error) {
      console.error('Failed to load usage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsageStats()
  }, [timeRange])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            API Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            API Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No usage data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                API Usage Analytics
              </CardTitle>
              <CardDescription>
                Monitor your AI API consumption and costs
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {(['24h', '7d', '30d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={loadUsageStats}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tokens</p>
                  <p className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
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
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Estimated Cost</p>
                  <p className="text-2xl font-bold">${stats.estimatedCost.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Provider Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Provider Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.providerBreakdown.map((provider, index) => (
              <motion.div
                key={provider.provider}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{provider.provider}</Badge>
                    <span className="text-sm text-gray-600">
                      {provider.requests} requests
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${provider.cost.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{provider.percentage}%</div>
                  </div>
                </div>
                <Progress value={provider.percentage} className="h-2" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Daily Usage Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {stats.dailyUsage.map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div 
                    className="bg-blue-100 rounded-lg p-2 relative"
                    style={{ 
                      height: `${Math.max(20, (day.requests / Math.max(...stats.dailyUsage.map(d => d.requests))) * 60)}px` 
                    }}
                  >
                    <div className="absolute inset-0 flex items-end justify-center pb-1">
                      <span className="text-xs font-medium text-blue-800">
                        {day.requests}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ${day.cost.toFixed(2)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Response Time</span>
                <Badge variant="outline">{stats.averageResponseTime}s</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Top Performing Provider</span>
                <Badge>{stats.topProvider}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Optimization Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <span>Use smaller models for simple tasks to reduce costs</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <span>Implement caching for repeated queries</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <span>Monitor token usage and optimize prompts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}