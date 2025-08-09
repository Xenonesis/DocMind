import { NextRequest, NextResponse } from 'next/server'
import { analysisService, documentService } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const documentId = searchParams.get('documentId')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get analyses with Firebase
    let analyses: any[] = await analysisService.getAll()
    analyses = analyses.slice(0, limit)

    // Apply filters
    if (type && type !== 'all') {
      analyses = analyses.filter(analysis => analysis.type === type)
    }
    
    if (documentId) {
      analyses = analyses.filter(analysis => analysis.documentId === documentId)
    }

    // Get document details for each analysis
    const formattedAnalyses = await Promise.all(
      analyses.map(async (analysis) => {
        let document: any = null
        try {
          document = await documentService.getById(analysis.documentId)
        } catch (error) {
          console.warn(`Could not fetch document ${analysis.documentId}:`, error)
        }

        return {
          id: analysis.id,
          type: analysis.type,
          title: analysis.title,
          description: analysis.description,
          confidence: analysis.confidence,
          severity: analysis.severity,
          timestamp: analysis.timestamp,
          document: document ? {
            id: document.id,
            name: document.name,
            type: document.type,
            category: document.category
          } : null,
          documents: Array.isArray((analysis as any).documents)
            ? (analysis as any).documents
            : (typeof (analysis as any).documents === 'string'
              ? JSON.parse((analysis as any).documents as unknown as string)
              : []),
          metadata: analysis.metadata ? JSON.parse(analysis.metadata) : {}
        }
      })
    )

    // Get summary statistics
    const stats = await getAnalysisStats()

    return NextResponse.json({
      analyses: formattedAnalyses,
      stats
    })

  } catch (error) {
    console.error('Error fetching analyses:', error)
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }
}

async function getAnalysisStats() {
  try {
    // Get all analyses for statistics
    const allAnalyses = await analysisService.getAll()
    
    const totalAnalyses = allAnalyses.length
    
    // Calculate type statistics
    const byType: Record<string, number> = {}
    allAnalyses.forEach(analysis => {
      byType[analysis.type] = (byType[analysis.type] || 0) + 1
    })
    
    // Calculate severity statistics
    const bySeverity: Record<string, number> = {}
    allAnalyses.forEach(analysis => {
      if (analysis.severity) {
        bySeverity[analysis.severity] = (bySeverity[analysis.severity] || 0) + 1
      }
    })
    
    // Calculate average confidence
    const totalConfidence = allAnalyses.reduce((sum, analysis) => sum + analysis.confidence, 0)
    const averageConfidence = totalAnalyses > 0 ? Math.round(totalConfidence / totalAnalyses) : 0
    
    // Calculate recent analyses (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentCount = allAnalyses.filter(analysis => 
      analysis.createdAt.getTime() >= sevenDaysAgo.getTime()
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