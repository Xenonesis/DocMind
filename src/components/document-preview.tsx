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

/**
 * DocumentPreview component that opens document previews in a new tab/page
 * instead of showing a modal dialog for better user experience
 */
export function DocumentPreview({ document, isOpen, onClose }: DocumentPreviewProps) {
  useEffect(() => {
    if (document && isOpen) {
      // Open preview in new tab/page for better viewing experience
      const previewUrl = `/preview/${document.id}`
      window.open(previewUrl, '_blank')
      // Close the modal immediately since we're opening in new tab
      onClose()
    }
  }, [document, isOpen, onClose])

  // This component doesn't render anything since it just redirects to a new page
  return null
}