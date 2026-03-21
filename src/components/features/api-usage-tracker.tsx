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
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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
    <div className="space-y-6 sm:space-y-8 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={timeRange === range 
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-md shadow-indigo-500/20 rounded-xl" 
                : "rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}
            >
              {range}
            </Button>
          ))}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadUsageStats}
          className="rounded-xl border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors w-full sm:w-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Requests</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{stats.totalRequests.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-2xl text-blue-600 dark:text-blue-400 shadow-inner">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tokens</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{stats.totalTokens.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <BarChart3 className="w-6 h-6" />
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
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Estimated Cost</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">${stats.estimatedCost.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 rounded-2xl text-amber-600 dark:text-amber-400 shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Success Rate</p>
                  <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{stats.successRate}%</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-2xl text-purple-600 dark:text-purple-400 shadow-inner">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700/50 relative z-10">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-200">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <PieChart className="w-5 h-5" />
            </div>
            Provider Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 relative z-10">
          <div className="space-y-6">
            {stats.providerBreakdown.map((provider, index) => (
              <motion.div
                key={provider.provider}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 px-3 py-1 text-sm font-medium">
                      {provider.provider}
                    </Badge>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium hidden sm:inline-block">
                      {provider.requests} requests
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-slate-800 dark:text-slate-200">${provider.cost.toFixed(2)}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{provider.percentage}%</div>
                  </div>
                </div>
                <Progress value={provider.percentage} className="h-2.5 bg-slate-200 dark:bg-slate-700" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <CardHeader className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700/50 relative z-10">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-200">
            <div className="p-2.5 bg-violet-100 dark:bg-violet-900/40 rounded-xl text-violet-600 dark:text-violet-400">
              <Calendar className="w-5 h-5" />
            </div>
            Daily Usage Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 relative z-10">
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 sm:gap-4">
              {stats.dailyUsage.map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group/day"
                >
                  <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div 
                    className="bg-gradient-to-t from-violet-100 to-violet-50 dark:from-violet-900/40 dark:to-violet-800/20 rounded-xl p-2 relative group-hover/day:from-violet-200 group-hover/day:to-violet-100 dark:group-hover/day:from-violet-800/50 dark:group-hover/day:to-violet-700/30 transition-colors border border-violet-200/50 dark:border-violet-700/50"
                    style={{ 
                      height: `${Math.max(30, (day.requests / Math.max(...stats.dailyUsage.map(d => d.requests))) * 80)}px` 
                    }}
                  >
                    <div className="absolute inset-x-0 bottom-2 flex justify-center">
                      <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                        {day.requests > 0 ? day.requests : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2">
                    ${day.cost.toFixed(2)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <CardHeader className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700/50 relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800 dark:text-slate-200">
              <div className="p-2.5 bg-teal-100 dark:bg-teal-900/40 rounded-xl text-teal-600 dark:text-teal-400">
                <Clock className="w-5 h-5" />
              </div>
              Performance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Average Response Time</span>
                <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 px-3 py-1 font-bold text-sm">
                  {stats.averageResponseTime}s
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Top Performing Provider</span>
                <Badge className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900 px-3 py-1 font-bold text-sm shadow-sm">
                  {stats.topProvider}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30 shadow-lg shadow-amber-500/10 dark:shadow-none rounded-3xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm pointer-events-none" />
          <CardHeader className="p-6 sm:p-8 relative z-10 border-b border-amber-200/50 dark:border-amber-700/30">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-amber-900 dark:text-amber-100">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-800/50 rounded-xl text-amber-600 dark:text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              Cost Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-amber-100/50 dark:border-amber-700/30">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shadow-sm shadow-blue-500/50 shrink-0"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Use smaller models for simple tasks to reduce costs significantly</span>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-amber-100/50 dark:border-amber-700/30">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1.5 shadow-sm shadow-emerald-500/50 shrink-0"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Implement caching for repeated or similar queries</span>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-amber-100/50 dark:border-amber-700/30">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1.5 shadow-sm shadow-amber-500/50 shrink-0"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Monitor token usage carefully and optimize your system prompts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}