'use client'

import { useEffect } from 'react'

interface Document {
  id: string
  name: string
  type: string
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
  uploadDate: string
  size: string
  category?: string
  tags?: string[]
  analysisCount?: number
  queryCount?: number
}

interface DocumentPreviewProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
}

export function DocumentPreview({ document, isOpen, onClose }: DocumentPreviewProps) {
  useEffect(() => {
    if (document && isOpen) {
      const previewUrl = `/preview/${document.id}`
      window.open(previewUrl, '_blank')
      onClose()
    }
  }, [document, isOpen, onClose])

  return null
}