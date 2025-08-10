import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const documentId = searchParams.get('documentId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    // Build query for user's analyses
    let query = supabaseServer
      .from('analyses')
      .select(`
        *,
        documents:document_id (
          id,
          name,
          type,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('analysis_type', type)
    }
    
    if (documentId) {
      query = query.eq('document_id', documentId)
    }

    const { data: analyses, error } = await query

    if (error) {
      console.error('Error fetching analyses:', error)
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
    }

    // Format analyses for response
    const formattedAnalyses = (analyses || []).map(analysis => ({
      id: analysis.id,
      type: analysis.analysis_type,
      title: analysis.result?.title || 'Analysis',
      description: analysis.result?.description || 'No description available',
      confidence: analysis.result?.confidence || 0,
      severity: analysis.result?.severity || 'LOW',
      aiProvider: analysis.ai_provider,
      aiModel: analysis.ai_model,
      tokensUsed: analysis.tokens_used,
      processingTime: analysis.processing_time_ms,
      createdAt: analysis.created_at,
      document: analysis.documents ? {
        id: analysis.documents.id,
        name: analysis.documents.name,
        type: analysis.documents.type,
        status: analysis.documents.status
      } : null
    }))

    // Get summary statistics
    const stats = await getAnalysisStats(user.id)

    return NextResponse.json({
      analyses: formattedAnalyses,
      stats
    })

  } catch (error) {
    console.error('Error fetching analyses:', error)
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }
}

async function getAnalysisStats(userId: string) {
  try {
    if (!supabaseServer) {
      return {
        total: 0,
        byType: {},
        bySeverity: {},
        averageConfidence: 0,
        recentCount: 0
      }
    }

    // Get all analyses for this user
    const { data: allAnalyses, error } = await supabaseServer
      .from('analyses')
      .select('*')
      .eq('user_id', userId)

    if (error || !allAnalyses) {
      throw error
    }
    
    const totalAnalyses = allAnalyses.length
    
    // Calculate type statistics
    const byType: Record<string, number> = {}
    allAnalyses.forEach(analysis => {
      const type = analysis.analysis_type || 'unknown'
      byType[type] = (byType[type] || 0) + 1
    })
    
    // Calculate severity statistics
    const bySeverity: Record<string, number> = {}
    allAnalyses.forEach(analysis => {
      const severity = analysis.result?.severity || 'LOW'
      bySeverity[severity] = (bySeverity[severity] || 0) + 1
    })
    
    // Calculate average confidence
    const confidenceValues = allAnalyses
      .map(analysis => analysis.result?.confidence || 0)
      .filter(confidence => confidence > 0)
    const averageConfidence = confidenceValues.length > 0 
      ? Math.round(confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length)
      : 0
    
    // Calculate recent analyses (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const recentCount = allAnalyses.filter(analysis => 
      analysis.created_at >= sevenDaysAgo
    ).length

    return {
      total: totalAnalyses,
      byType,
      bySeverity,
      averageConfidence,
      recentCount
    }
  } catch (error) {
    console.error('Error getting analysis stats:', error)
    return {
      total: 0,
      byType: {},
      bySeverity: {},
      averageConfidence: 0,
      recentCount: 0
    }
  }
}