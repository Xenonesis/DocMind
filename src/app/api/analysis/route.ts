export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, createServerClientForToken } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined
    const db = createServerClientForToken(token) || supabaseServer

    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Fetch documents
    const { data: documents } = await db
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch queries for real analytics
    const { data: queries } = await db
      .from('queries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch stored analyses
    const { data: storedAnalyses } = await db
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const docs = documents || []
    const qs = queries || []
    const analyses = storedAnalyses || []

    // Build analysis results from stored analyses + derive from queries
    const analysisResults: any[] = []

    // Add stored analyses
    analyses.forEach((a: any) => {
      const doc = docs.find(d => d.id === a.document_id)
      analysisResults.push({
        id: a.id,
        type: a.analysis_type || 'INSIGHT',
        title: a.result?.title || 'Document Analysis',
        description: a.result?.description || a.result?.summary || 'No description available',
        confidence: a.result?.confidence || 85,
        severity: a.result?.severity || 'LOW',
        documents: doc ? [doc.name] : [],
        document: doc ? { id: doc.id, name: doc.name, type: doc.type, category: doc.category } : null,
        timestamp: a.created_at,
        metadata: a.result || {}
      })
    })

    // Derive insights from query history if no stored analyses
    if (analyses.length === 0 && qs.length > 0) {
      qs.slice(0, 10).forEach((q: any, i: number) => {
        let answer = ''
        try {
          const resp = typeof q.response === 'string' ? JSON.parse(q.response) : q.response
          answer = resp?.answer || ''
        } catch { answer = '' }

        if (answer.length > 50) {
          const docIds: string[] = (() => { try { return JSON.parse(q.document_ids || '[]') } catch { return [] } })()
          const relatedDocs = docs.filter(d => docIds.includes(d.id)).map(d => d.name)
          analysisResults.push({
            id: `query-derived-${q.id}`,
            type: 'INSIGHT',
            title: q.query_text?.slice(0, 80) || 'Query Insight',
            description: answer.slice(0, 300) + (answer.length > 300 ? '...' : ''),
            confidence: 80,
            severity: 'LOW',
            documents: relatedDocs,
            document: null,
            timestamp: q.created_at,
            metadata: {}
          })
        }
      })
    }

    // Stats
    const totalDocs = docs.length
    const completedDocs = docs.filter(d => d.status === 'COMPLETED').length
    const totalQueries = qs.length
    const totalAnalyses = analysisResults.length

    // Query frequency per document
    const docQueryCounts: Record<string, number> = {}
    qs.forEach((q: any) => {
      const ids: string[] = (() => { try { return JSON.parse(q.document_ids || '[]') } catch { return [] } })()
      ids.forEach(id => { docQueryCounts[id] = (docQueryCounts[id] || 0) + 1 })
    })

    // Most queried docs
    const topDocuments = docs
      .map(d => ({ id: d.id, name: d.name, queries: docQueryCounts[d.id] || 0 }))
      .sort((a, b) => b.queries - a.queries)
      .slice(0, 5)

    // Queries per day (last 7 days)
    const last7Days: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      last7Days[d.toISOString().slice(0, 10)] = 0
    }
    qs.forEach((q: any) => {
      const day = (q.created_at || '').slice(0, 10)
      if (day in last7Days) last7Days[day]++
    })

    const stats = {
      total: totalAnalyses,
      byType: {
        INSIGHT: analysisResults.filter(a => a.type === 'INSIGHT').length,
        RISK: analysisResults.filter(a => a.type === 'RISK').length,
        OPPORTUNITY: analysisResults.filter(a => a.type === 'OPPORTUNITY').length,
        COMPLIANCE: analysisResults.filter(a => a.type === 'COMPLIANCE').length,
      },
      bySeverity: {
        LOW: analysisResults.filter(a => a.severity === 'LOW').length,
        MEDIUM: analysisResults.filter(a => a.severity === 'MEDIUM').length,
        HIGH: analysisResults.filter(a => a.severity === 'HIGH').length,
      },
      averageConfidence: analysisResults.length > 0
        ? Math.round(analysisResults.reduce((s, a) => s + (a.confidence || 0), 0) / analysisResults.length)
        : 0,
      recentCount: analysisResults.filter(a =>
        a.timestamp && a.timestamp >= new Date(Date.now() - 7 * 86400000).toISOString()
      ).length,
      totalDocuments: totalDocs,
      completedDocuments: completedDocs,
      totalQueries,
      topDocuments,
      queriesPerDay: Object.entries(last7Days).map(([date, count]) => ({ date, count })),
    }

    return NextResponse.json({ analyses: analysisResults, stats })

  } catch (error) {
    console.error('Error fetching analyses:', error)
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }
}