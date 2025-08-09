'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { 
  DocumentUpdate, 
  QueryUpdate, 
  AnalysisUpdate 
} from '@/lib/socket'

interface UseSocketOptions {
  autoConnect?: boolean
  documentId?: string
  joinUpdates?: boolean
}

interface SocketState {
  isConnected: boolean
  documentUpdates: DocumentUpdate[]
  queryUpdates: QueryUpdate[]
  analysisUpdates: AnalysisUpdate[]
  progressUpdates: Array<{
    type: 'document' | 'query' | 'analysis'
    id: string
    progress: number
    message?: string
    timestamp: string
  }>
  notifications: Array<{
    type: 'info' | 'warning' | 'error' | 'success'
    title: string
    message: string
    timestamp: string
  }>
}

export function useSocket(options: UseSocketOptions = {}) {
  const { 
    autoConnect = true, 
    documentId, 
    joinUpdates: shouldJoinUpdates = true 
  } = options
  
  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    documentUpdates: [],
    queryUpdates: [],
    analysisUpdates: [],
    progressUpdates: [],
    notifications: []
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize socket connection
    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    const socket = io(baseUrl, {
      path: '/api/socketio',
      transports: ['websocket', 'polling']
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      setState(prev => ({ ...prev, isConnected: true }))
      console.log('Socket connected:', socket.id)

      // Join rooms if specified
      if (documentId) {
        socket.emit('join-document-room', documentId)
      }
      
      if (shouldJoinUpdates) {
        socket.emit('join-updates')
      }
    })

    socket.on('disconnect', () => {
      setState(prev => ({ ...prev, isConnected: false }))
      console.log('Socket disconnected')
    })

    // Document updates
    socket.on('document-update', (update: DocumentUpdate) => {
      setState(prev => ({
        ...prev,
        documentUpdates: [update, ...prev.documentUpdates].slice(0, 50) // Keep last 50
      }))
    })

    // Query updates
    socket.on('query-update', (update: QueryUpdate) => {
      setState(prev => ({
        ...prev,
        queryUpdates: [update, ...prev.queryUpdates].slice(0, 50)
      }))
    })

    // Analysis updates
    socket.on('analysis-update', (update: AnalysisUpdate) => {
      setState(prev => ({
        ...prev,
        analysisUpdates: [update, ...prev.analysisUpdates].slice(0, 50)
      }))
    })

    // Progress updates
    socket.on('progress-update', (update: {
      type: 'document' | 'query' | 'analysis'
      id: string
      progress: number
      message?: string
      timestamp: string
    }) => {
      setState(prev => ({
        ...prev,
        progressUpdates: [update, ...prev.progressUpdates].slice(0, 100)
      }))
    })

    // System notifications
    socket.on('system-notification', (notification: {
      type: 'info' | 'warning' | 'error' | 'success'
      title: string
      message: string
      timestamp: string
    }) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(0, 20)
      }))
    })

    // Connection confirmation
    socket.on('connected', (data: { socketId: string; timestamp: string; message: string }) => {
      console.log('Socket connection confirmed:', data)
    })

    // Welcome message
    socket.on('message', (msg: { text: string; senderId: string; timestamp: string }) => {
      console.log('Socket message:', msg)
    })

    // Auto-connect if enabled
    if (autoConnect) {
      socket.connect()
    }

    // Cleanup
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [autoConnect, documentId, shouldJoinUpdates])

  // Actions
  const joinDocumentRoom = (docId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-document-room', docId)
    }
  }

  const leaveDocumentRoom = (docId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-document-room', docId)
    }
  }

  const joinUpdates = () => {
    if (socketRef.current) {
      socketRef.current.emit('join-updates')
    }
  }

  const clearUpdates = (type?: 'document' | 'query' | 'analysis' | 'progress' | 'notifications') => {
    setState(prev => {
      if (!type) {
        return {
          ...prev,
          documentUpdates: [],
          queryUpdates: [],
          analysisUpdates: [],
          progressUpdates: [],
          notifications: []
        }
      }
      
      switch (type) {
        case 'document':
          return { ...prev, documentUpdates: [] }
        case 'query':
          return { ...prev, queryUpdates: [] }
        case 'analysis':
          return { ...prev, analysisUpdates: [] }
        case 'progress':
          return { ...prev, progressUpdates: [] }
        case 'notifications':
          return { ...prev, notifications: [] }
        default:
          return prev
      }
    })
  }

  return {
    ...state,
    socket: socketRef.current,
    joinDocumentRoom,
    leaveDocumentRoom,
    joinUpdates,
    clearUpdates
  }
}