'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  Download, 
  FileText, 
  Image, 
  File, 
  FileCode,
  Loader2,
  AlertCircle,
  Calendar,
  HardDrive,
  Tag,
  Eye,
  ChevronLeft,
  ChevronRight,
  Copy,
  Share2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  List,
  BookOpen,
  Fullscreen,
  Minimize2
} from 'lucide-react'

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

interface PreviewContent {
  content: string
  contentType: 'text' | 'image' | 'pdf' | 'unsupported'
  metadata?: {
    pages?: number
    wordCount?: number
    characters?: number
  }
}

export default function DocumentPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string
  
  const [document, setDocument] = useState<Document | null>(null)
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState<number | null>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [rotation, setRotation] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (documentId) {
      fetchDocument()
      fetchPreviewContent()
    }
  }, [documentId])

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`)
      
      if (response.ok) {
        const data = await response.json()
        setDocument(data)
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch document:', response.status, errorData)
        setError(`Failed to load document: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Failed to fetch document:', err)
      setError('Failed to load document')
    }
  }

  const fetchPreviewContent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/documents/${documentId}/preview`)
      
      if (!response.ok) {
        throw new Error('Failed to load document preview')
      }
      
      const data = await response.json()
      setPreviewContent(data)
      if (data?.metadata?.pages) setPages(data.metadata.pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview')
    } finally {
      setIsLoading(false)
    }
  }

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0])
  }

  const handleCopyContent = async () => {
    if (previewContent?.content) {
      await navigator.clipboard.writeText(previewContent.content)
    }
  }

  const handleShare = async () => {
    if (navigator.share && document) {
      try {
        await navigator.share({
          title: document.name,
          text: `Check out this document: ${document.name}`,
          url: window.location.href
        })
      } catch (err) {
        // Share failed
      }
    }
  }

  const toggleFullscreen = () => {
    if (typeof window !== 'undefined') {
      if (!window.document.fullscreenElement) {
        containerRef.current?.requestFullscreen()
        setIsFullScreen(true)
      } else {
        window.document.exitFullscreen()
        setIsFullScreen(false)
      }
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return <FileText className="w-6 h-6 text-red-500" />
      case 'doc':
      case 'docx': return <FileText className="w-6 h-6 text-blue-500" />
      case 'txt': return <FileText className="w-6 h-6 text-gray-500" />
      case 'jpg':
      case 'jpeg':
      case 'png': return <Image className="w-6 h-6 text-green-500" />
      case 'json':
      case 'xml':
      case 'csv': return <FileCode className="w-6 h-6 text-purple-500" />
      default: return <File className="w-6 h-6 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDownload = async () => {
    if (!document) return
    
    try {
      const response = await fetch(`/api/documents/${document.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = document.name
        window.document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        window.document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const renderPreviewContent = () => {
    if (isLoading) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-[60vh]"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <Loader2 className="w-8 h-8 animate-spin absolute top-4 left-4 text-blue-600" />
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading preview...</p>
          <Progress value={33} className="w-48 mt-2" />
        </motion.div>
      )
    }

    if (error) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-[60vh] bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800"
        >
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-red-800 dark:text-red-400 font-semibold text-lg mb-2">Preview Error</h3>
          <p className="text-red-600 dark:text-red-500 text-sm text-center max-w-md">{error}</p>
          <Button variant="outline" onClick={fetchPreviewContent} className="mt-4">
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      )
    }

    if (!previewContent) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-[60vh] bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700"
        >
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
            <Eye className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-gray-700 dark:text-gray-300 font-medium text-lg mb-2">No Preview Available</h3>
          <p className="text-gray-500 text-sm">This file type doesn't support preview</p>
        </motion.div>
      )
    }

    const renderContent = () => {
      switch (previewContent.contentType) {
        case 'text':
          return (
            <div className="h-full bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-3 sm:p-4 lg:p-6">
                  <pre 
                    className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-mono text-gray-800 dark:text-gray-200 break-words" 
                    style={{ 
                      transform: `scale(${zoom / 100})`, 
                      transformOrigin: 'top left',
                      fontSize: `${Math.max(10, 12 * (zoom / 100))}px`
                    }}
                  >
                    {previewContent.content}
                  </pre>
                </div>
              </ScrollArea>
            </div>
          )
        
        case 'image':
          return (
            <div className="h-full bg-gray-50 dark:bg-gray-900 rounded-lg sm:rounded-xl border overflow-hidden flex items-center justify-center">
              <div className="overflow-auto max-h-full max-w-full p-2 sm:p-4">
                <img 
                  src={previewContent.content} 
                  alt={document?.name || 'Document preview'}
                  style={{ 
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    maxWidth: zoom <= 100 ? '100%' : 'none',
                    maxHeight: zoom <= 100 ? '100%' : 'none',
                    minWidth: zoom < 100 ? 'auto' : undefined,
                    minHeight: zoom < 100 ? 'auto' : undefined
                  }}
                  className="rounded-lg shadow-lg transition-transform duration-200 object-contain"
                />
              </div>
            </div>
          )
        
        case 'pdf':
          return (
            <div className="h-full bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl border overflow-hidden">
              <div 
                className="h-full w-full"
                style={{ 
                  transform: `scale(${zoom / 100})`, 
                  transformOrigin: zoom <= 100 ? 'top center' : 'top left'
                }}
              >
                <iframe
                  src={previewContent.content}
                  className="w-full h-full border-0 bg-white rounded-lg"
                  title={`Preview of ${document?.name}`}
                  loading="lazy"
                />
              </div>
            </div>
          )
        
        default:
          return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <File className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-gray-700 dark:text-gray-300 font-medium text-lg mb-2">Preview Not Supported</h3>
              <p className="text-gray-500 text-sm mb-4">This file type cannot be previewed</p>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download to View
              </Button>
            </div>
          )
      }
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] lg:h-[calc(100vh-200px)] flex flex-col"
      >
        {renderContent()}
      </motion.div>
    )
  }

  if (!document && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Document Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested document could not be found.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div ref={containerRef} className="flex flex-col h-screen">
          {/* Responsive Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50"
          >
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                {/* Left Section - Back Button & Document Info */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      // Check if we can go back in history
                      if (window.history.length > 1 && window.document.referrer) {
                        // If there's a referrer, go back
                        window.history.back()
                      } else {
                        // Otherwise close the tab/window or redirect to home
                        if (window.opener) {
                          // If opened from another window, close this one
                          window.close()
                        } else {
                          // Fallback to home page
                          router.push('/')
                        }
                      }
                    }} 
                    className="shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                  
                  {document && (
                    <>
                      <div className="relative shrink-0 hidden sm:block">
                        {getFileIcon(document.name)}
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                          {document.name}
                        </h1>
                        <div className="hidden sm:flex items-center gap-2 lg:gap-4 mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1 shrink-0">
                            <HardDrive className="w-3 h-3" />
                            {document.size}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span className="hidden lg:inline">{formatDate(document.uploadDate)}</span>
                            <span className="lg:hidden">{new Date(document.uploadDate).toLocaleDateString()}</span>
                          </span>
                          {previewContent?.metadata?.pages && (
                            <span className="flex items-center gap-1 shrink-0">
                              <BookOpen className="w-3 h-3" />
                              {previewContent.metadata.pages} pages
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Section - Action Buttons */}
                {document && (
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <Badge 
                      variant={document.status === 'COMPLETED' ? 'default' : 'secondary'}
                      className="px-2 sm:px-3 py-1 text-xs hidden sm:inline-flex"
                    >
                      {document.status}
                    </Badge>
                    
                    {/* Mobile Action Menu */}
                    <div className="flex sm:hidden">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={handleDownload}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="hidden sm:flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={handleCopyContent}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy content</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={handleShare}>
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Share document</TooltipContent>
                      </Tooltip>

                      <Button variant="outline" size="sm" onClick={handleDownload} className="hidden lg:flex">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>

                      <Button variant="outline" size="sm" onClick={handleDownload} className="lg:hidden">
                        <Download className="w-4 h-4" />
                      </Button>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Document Info */}
              {document && (
                <div className="sm:hidden mt-3 space-y-2">
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {document.size}
                    </span>
                    <Badge variant={document.status === 'COMPLETED' ? 'default' : 'secondary'} className="px-2 py-1 text-xs">
                      {document.status}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Tags - Responsive */}
              {document?.tags && document.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex gap-1 flex-wrap">
                    {document.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Responsive Toolbar */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-700/30 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 sticky top-[72px] sm:top-[88px] z-40"
          >
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
                {/* Zoom Controls - Responsive */}
                <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setZoom(Math.max(25, zoom - 25))}
                        disabled={zoom <= 25}
                        className="p-1 sm:p-2"
                      >
                        <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom out</TooltipContent>
                  </Tooltip>

                  <div className="w-16 sm:w-20 lg:w-24 px-1 sm:px-2">
                    <Slider
                      value={[zoom]}
                      onValueChange={handleZoomChange}
                      min={25}
                      max={300}
                      step={25}
                      className="w-full"
                    />
                  </div>

                  <span className="text-xs sm:text-sm font-medium min-w-[2.5rem] sm:min-w-[3rem] text-center">
                    {zoom}%
                  </span>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setZoom(Math.min(300, zoom + 25))}
                        disabled={zoom >= 300}
                        className="p-1 sm:p-2"
                      >
                        <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom in</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setZoom(100)} className="p-1 sm:p-2">
                        <Maximize className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fit to screen</TooltipContent>
                  </Tooltip>
                </div>

                {/* Page Navigation for PDFs - Responsive */}
                {pages && pages > 1 && (
                  <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page <= 1}
                          className="p-1 sm:p-2"
                        >
                          <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Previous page</TooltipContent>
                    </Tooltip>

                    <span className="text-xs sm:text-sm font-medium px-1 sm:px-2 whitespace-nowrap">
                      {page} / {pages}
                    </span>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setPage(Math.min(pages, page + 1))}
                          disabled={page >= pages}
                          className="p-1 sm:p-2"
                        >
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Next page</TooltipContent>
                    </Tooltip>
                  </div>
                )}

                {/* Image Rotation - Responsive */}
                {previewContent?.contentType === 'image' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setRotation(r => (r + 90) % 360)}
                        className="p-1 sm:p-2 shrink-0"
                      >
                        <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rotate image</TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Document Stats - Responsive */}
              {previewContent?.metadata && (
                <div className="hidden lg:flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 shrink-0">
                  {previewContent.metadata.wordCount && (
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <FileText className="w-3 h-3" />
                      {previewContent.metadata.wordCount.toLocaleString()} words
                    </span>
                  )}
                  {previewContent.metadata.characters && (
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <List className="w-3 h-3" />
                      {previewContent.metadata.characters.toLocaleString()} chars
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Stats Row */}
            {previewContent?.metadata && (
              <div className="lg:hidden flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 overflow-x-auto">
                {previewContent.metadata.wordCount && (
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <FileText className="w-3 h-3" />
                    {previewContent.metadata.wordCount.toLocaleString()} words
                  </span>
                )}
                {previewContent.metadata.characters && (
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <List className="w-3 h-3" />
                    {previewContent.metadata.characters.toLocaleString()} chars
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* Responsive Preview Content */}
          <div className="flex-1 overflow-hidden p-2 sm:p-4 lg:p-6">
            {renderPreviewContent()}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}