'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { DocumentUpdate, QueryUpdate, AnalysisUpdate } from '@/lib/socket-types'

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
  const { autoConnect = true, documentId, joinUpdates: shouldJoinUpdates = true } = options
  const socketsEnabled = process.env.NEXT_PUBLIC_ENABLE_SOCKETS === 'true'

  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    documentUpdates: [],
    queryUpdates: [],
    analysisUpdates: [],
    progressUpdates: [],
    notifications: [],
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!socketsEnabled) return

    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    const socket = io(baseUrl, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setState((prev) => ({ ...prev, isConnected: true }))

      if (documentId) {
        socket.emit('join-document-room', documentId)
      }

      if (shouldJoinUpdates) {
        socket.emit('join-updates')
      }
    })

    socket.on('disconnect', () => {
      setState((prev) => ({ ...prev, isConnected: false }))
    })

    socket.on('document-update', (update: DocumentUpdate) => {
      setState((prev) => ({
        ...prev,
        documentUpdates: [update, ...prev.documentUpdates].slice(0, 50),
      }))
    })

    socket.on('query-update', (update: QueryUpdate) => {
      setState((prev) => ({
        ...prev,
        queryUpdates: [update, ...prev.queryUpdates].slice(0, 50),
      }))
    })

    socket.on('analysis-update', (update: AnalysisUpdate) => {
      setState((prev) => ({
        ...prev,
        analysisUpdates: [update, ...prev.analysisUpdates].slice(0, 50),
      }))
    })

    socket.on(
      'progress-update',
      (update: {
        type: 'document' | 'query' | 'analysis'
        id: string
        progress: number
        message?: string
        timestamp: string
      }) => {
        setState((prev) => ({
          ...prev,
          progressUpdates: [update, ...prev.progressUpdates].slice(0, 100),
        }))
      }
    )

    socket.on(
      'system-notification',
      (notification: {
        type: 'info' | 'warning' | 'error' | 'success'
        title: string
        message: string
        timestamp: string
      }) => {
        setState((prev) => ({
          ...prev,
          notifications: [notification, ...prev.notifications].slice(0, 20),
        }))
      }
    )

    socket.on('connected', (data: { socketId: string; timestamp: string; message: string }) => {})

    socket.on('message', (msg: { text: string; senderId: string; timestamp: string }) => {})

    if (autoConnect) {
      socket.connect()
    }

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [autoConnect, documentId, shouldJoinUpdates, socketsEnabled])

  const getSocket = () => socketRef.current

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

  const clearUpdates = (
    type?: 'document' | 'query' | 'analysis' | 'progress' | 'notifications'
  ) => {
    setState((prev) => {
      if (!type) {
        return {
          ...prev,
          documentUpdates: [],
          queryUpdates: [],
          analysisUpdates: [],
          progressUpdates: [],
          notifications: [],
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
    isConnected: socketsEnabled ? state.isConnected : false,
    getSocket,
    joinDocumentRoom,
    leaveDocumentRoom,
    joinUpdates,
    clearUpdates,
  }
}
