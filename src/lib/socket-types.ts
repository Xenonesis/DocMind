// Socket event types for real-time updates

export interface DocumentUpdate {
  id: string
  type: 'created' | 'updated' | 'deleted' | 'status_changed'
  document: {
    id: string
    name: string
    status: string
    progress?: number
  }
  timestamp: string
}

export interface QueryUpdate {
  id: string
  type: 'created' | 'completed' | 'error'
  query: {
    id: string
    query: string
    status: string
  }
  timestamp: string
}

export interface AnalysisUpdate {
  id: string
  type: 'created' | 'updated' | 'completed'
  analysis: {
    id: string
    title: string
    type: string
    documentId: string
  }
  timestamp: string
}