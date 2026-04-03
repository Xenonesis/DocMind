'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authenticatedRequest } from '@/lib/api-client'
import { useToast } from '@/hooks/use-toast'
import {
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  Zap,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
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
    label?: string
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
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')
  const [budgetLimitUsd, setBudgetLimitUsd] = useState<number>(0)
  const [budgetDraft, setBudgetDraft] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem('docmind.usageBudgetUsd')
    if (!raw) return
    const parsed = Number(raw)
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setBudgetLimitUsd(parsed)
      setBudgetDraft(parsed ? parsed.toString() : '')
    }
  }, [])

  const loadUsageStats = async (showToast = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authenticatedRequest<UsageStats>(`/api/usage?range=${timeRange}`)
      setStats(data)
      setLastUpdated(new Date().toISOString())
      if (showToast) {
        toast({
          title: 'Analytics refreshed',
          description: 'Usage metrics have been updated with the latest data.',
        })
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error)
      const message = error instanceof Error ? error.message : 'Failed to load usage stats'
      setError(message)
      setStats(null)
      if (showToast) {
        toast({
          title: 'Refresh failed',
          description: message,
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsageStats()
  }, [timeRange])

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-16 bg-muted/60 rounded-xl animate-pulse" />
            <div className="h-8 w-16 bg-muted/30 rounded-xl animate-pulse" />
            <div className="h-8 w-16 bg-muted/30 rounded-xl animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-muted/50 rounded-xl animate-pulse" />
        </div>
        <Card className="shadow-sm border-border bg-card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          <CardHeader className="p-6 border-b border-border/50">
            <div className="h-6 w-40 bg-muted/80 rounded-md animate-pulse" />
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="h-10 w-64 bg-muted/40 rounded-md animate-pulse" />
              <div className="h-10 w-32 bg-muted/60 rounded-xl animate-pulse" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-muted/50 rounded-md animate-pulse" />
                <div className="h-4 w-16 bg-muted/80 rounded-md animate-pulse" />
              </div>
              <div className="h-2.5 w-full bg-muted/30 rounded-full animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm border-border bg-card overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted/50 rounded-md animate-pulse" />
                    <div className="h-8 w-16 bg-muted/80 rounded-md animate-pulse" />
                  </div>
                  <div className="h-12 w-12 bg-muted/30 rounded-2xl animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
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
          <p className="text-gray-500">
            {error || 'No usage data available yet. Run a few queries to populate analytics.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxRequests = Math.max(1, ...stats.dailyUsage.map((d) => d.requests))
  const budgetUsagePercent = budgetLimitUsd > 0 ? (stats.estimatedCost / budgetLimitUsd) * 100 : 0

  const saveBudget = () => {
    const parsed = Number(budgetDraft)
    if (budgetDraft.trim() === '') {
      setBudgetLimitUsd(0)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('docmind.usageBudgetUsd')
      }
      toast({ title: 'Budget removed', description: 'Usage budget alerts are now disabled.' })
      return
    }

    if (Number.isNaN(parsed) || parsed < 0) {
      toast({
        title: 'Invalid budget',
        description: 'Enter a valid non-negative USD amount.',
        variant: 'destructive',
      })
      return
    }

    setBudgetLimitUsd(parsed)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('docmind.usageBudgetUsd', String(parsed))
    }
    toast({ title: 'Budget updated', description: `Usage budget set to $${parsed.toFixed(2)}.` })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="rounded-xl shadow-sm"
            >
              {range}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadUsageStats(true)}
          className="rounded-xl shadow-sm w-full sm:w-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      {lastUpdated && (
        <div className="-mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Last updated {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      <Card className="shadow-sm border-border bg-card overflow-hidden">
        <CardHeader className="p-6 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2.5 bg-secondary rounded-xl text-amber-500">
              <DollarSign className="w-5 h-5" />
            </div>
            Usage Budget
          </CardTitle>
          <CardDescription>
            Set a budget for this dashboard window to get visual spend alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={budgetDraft}
              onChange={(e) => setBudgetDraft(e.target.value)}
              placeholder="Set budget in USD (example: 25)"
              className="max-w-xs"
              aria-label="Usage budget in USD"
            />
            <Button variant="outline" onClick={saveBudget} className="rounded-xl shadow-sm">
              Save Budget
            </Button>
          </div>

          {budgetLimitUsd > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Current spend vs budget</span>
                <span className="font-semibold">
                  ${stats.estimatedCost.toFixed(2)} / ${budgetLimitUsd.toFixed(2)}
                </span>
              </div>
              <Progress value={Math.min(100, budgetUsagePercent)} className="h-2.5" />
              {budgetUsagePercent >= 80 && (
                <div
                  className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400"
                  role="status"
                  aria-live="polite"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {budgetUsagePercent >= 100
                    ? 'You have exceeded your budget for this range.'
                    : 'You are approaching your budget limit.'}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No budget configured. Add one to track spending against a threshold.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-sm border-border bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-3xl font-bold">{stats.totalRequests.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-secondary rounded-2xl text-primary">
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
          <Card className="shadow-sm border-border bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                  <p className="text-3xl font-bold">{stats.totalTokens.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-secondary rounded-2xl text-emerald-500">
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
          <Card className="shadow-sm border-border bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                  <p className="text-3xl font-bold">${stats.estimatedCost.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-secondary rounded-2xl text-amber-500">
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
          <Card className="shadow-sm border-border bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-3xl font-bold">{stats.successRate}%</p>
                </div>
                <div className="p-3 bg-secondary rounded-2xl text-purple-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="shadow-sm border-border bg-card overflow-hidden">
        <CardHeader className="p-6 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2.5 bg-secondary rounded-xl text-primary">
              <PieChart className="w-5 h-5" />
            </div>
            Provider Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {stats.providerBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No provider usage data in this time range.
              </p>
            ) : (
              stats.providerBreakdown.map((provider, index) => (
                <motion.div
                  key={provider.provider}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-border/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="bg-background px-3 py-1 text-sm font-medium"
                      >
                        {provider.provider}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium hidden sm:inline-block">
                        {provider.requests} requests
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold">${provider.cost.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground font-medium">
                        {provider.percentage}%
                      </div>
                    </div>
                  </div>
                  <Progress value={provider.percentage} className="h-2.5" />
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-card overflow-hidden">
        <CardHeader className="p-6 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2.5 bg-secondary rounded-xl text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            Daily Usage Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
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
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                    {day.label ||
                      new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div
                    className="bg-secondary/50 rounded-xl p-2 relative group-hover/day:bg-secondary transition-colors border border-border/50"
                    style={{
                      height: `${Math.max(30, (day.requests / maxRequests) * 80)}px`,
                    }}
                  >
                    <div className="absolute inset-x-0 bottom-2 flex justify-center">
                      <span className="text-xs font-bold text-primary">
                        {day.requests > 0 ? day.requests : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-semibold mt-2">${day.cost.toFixed(2)}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border bg-card overflow-hidden">
          <CardHeader className="p-6 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2.5 bg-secondary rounded-xl text-primary">
                <Clock className="w-5 h-5" />
              </div>
              Performance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                <span className="text-sm font-semibold">Average Response Time</span>
                <Badge variant="outline" className="bg-background px-3 py-1 font-bold text-sm">
                  {stats.averageResponseTime}s
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                <span className="text-sm font-semibold">Top Performing Provider</span>
                <Badge className="px-3 py-1 font-bold text-sm shadow-sm">{stats.topProvider}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card overflow-hidden">
          <CardHeader className="p-6 border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2.5 bg-secondary rounded-xl text-amber-500">
                <DollarSign className="w-5 h-5" />
              </div>
              Cost Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5 shadow-sm shadow-blue-500/50 shrink-0"></div>
                <span className="text-sm font-medium">
                  Use smaller models for simple tasks to reduce costs significantly
                </span>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1.5 shadow-sm shadow-emerald-500/50 shrink-0"></div>
                <span className="text-sm font-medium">
                  Implement caching for repeated or similar queries
                </span>
              </div>
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1.5 shadow-sm shadow-amber-500/50 shrink-0"></div>
                <span className="text-sm font-medium">
                  Monitor token usage carefully and optimize your system prompts
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
