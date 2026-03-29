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
  Image as ImageIcon, 
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
  Minimize2,
  TerminalSquare
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
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest(`/api/documents/${documentId}`)
      setDocument(data)
    } catch (err) {
      console.error('Failed to fetch document:', err)
      setError('Failed to load document')
    }
  }

  const fetchPreviewContent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { authenticatedRequest } = await import('@/lib/api-client')
      const data = await authenticatedRequest(`/api/documents/${documentId}/preview`)
      
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
      case 'pdf': return <FileText className="w-6 h-6 text-destructive" />
      case 'doc':
      case 'docx': return <FileText className="w-6 h-6 text-accent" />
      case 'txt': return <FileText className="w-6 h-6 text-foreground" />
      case 'jpg':
      case 'jpeg':
      case 'png': return <ImageIcon className="w-6 h-6 text-green-500" />
      case 'json':
      case 'xml':
      case 'csv': return <FileCode className="w-6 h-6 text-purple-500" />
      default: return <File className="w-6 h-6 text-foreground" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).toUpperCase()
  }

  const handleDownload = async () => {
    if (!document) return
    
    try {
      const { authenticatedFetch } = await import('@/lib/api-client')
      const response = await authenticatedFetch(`/api/documents/${document.id}/download`)
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
        <div className="flex flex-col items-center justify-center h-[60vh] bg-background/50 rounded-2xl border border-border">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Loading preview...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] bg-destructive/5 rounded-2xl border border-destructive/20 p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="font-semibold text-xl mb-2 text-foreground">Preview Error</h3>
          <p className="text-muted-foreground mb-8 text-center max-w-md">{error}</p>
          <Button onClick={fetchPreviewContent} className="rounded-full shadow-sm hover:shadow-md transition-all">
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )
    }

    if (!previewContent) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] rounded-2xl border border-dashed border-border bg-background/50 p-8">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6">
            <TerminalSquare className="w-8 h-8 opacity-50 text-foreground" />
          </div>
          <h3 className="font-semibold text-xl mb-2 text-foreground">No Preview Available</h3>
          <p className="text-muted-foreground">This data type is unsupported for visual preview.</p>
        </div>
      )
    }

    const renderContent = () => {
      switch (previewContent.contentType) {
        case 'text':
          return (
            <div className="h-full bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 sm:p-6 lg:p-8">
                  <pre 
                    className="whitespace-pre-wrap leading-relaxed font-mono text-foreground break-words" 
                    style={{ 
                      transform: `scale(${zoom / 100})`, 
                      transformOrigin: 'top left',
                      fontSize: `${Math.max(12, 14 * (zoom / 100))}px`
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
            <div className="h-full bg-secondary/30 rounded-2xl border border-border shadow-sm overflow-hidden flex items-center justify-center p-4">
              <div className="overflow-auto max-h-full max-w-full rounded-lg shadow-sm">
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
                  className="transition-transform duration-200 object-contain block"
                />
              </div>
            </div>
          )
        
        case 'pdf':
          return (
            <div className="h-full bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
              <div 
                className="h-full w-full"
                style={{ 
                  transform: `scale(${zoom / 100})`, 
                  transformOrigin: zoom <= 100 ? 'top center' : 'top left'
                }}
              >
                <iframe
                  src={previewContent.content}
                  className="w-full h-full border-0 bg-white"
                  title={`Preview of ${document?.name}`}
                  loading="lazy"
                />
              </div>
            </div>
          )
        
        default:
          return (
            <div className="flex flex-col items-center justify-center h-full bg-background rounded-2xl border border-dashed border-border p-8">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                <File className="w-8 h-8 opacity-50 text-foreground" />
              </div>
              <h3 className="font-semibold text-xl mb-2 text-foreground">Preview Not Supported</h3>
              <p className="text-muted-foreground mb-8 text-center max-w-md">We can't generate a visual preview for this specific file type.</p>
              <Button onClick={handleDownload} className="rounded-full shadow-sm hover:shadow-md transition-all">
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )
      }
    }

    return (
      <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)] lg:h-[calc(100vh-200px)] flex flex-col">
        {renderContent()}
      </div>
    )
  }

  if (!document && !isLoading) {
    return (
      <div className="min-h-screen bg-secondary/20 text-foreground flex items-center justify-center font-sans p-4">
        <div className="text-center bg-background border border-border shadow-sm rounded-2xl p-12 max-w-lg w-full">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-foreground tracking-tight">Document Not Found</h1>
          <p className="text-muted-foreground mb-8">The requested document pointer is invalid or missing.</p>
          <Button onClick={() => router.back()} className="rounded-full shadow-sm hover:shadow-md transition-all font-medium w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-secondary/20 text-foreground font-sans">
        <div ref={containerRef} className="flex flex-col h-screen max-w-[1600px] mx-auto">
          <div className="bg-background border-b border-border sticky top-0 z-50">
            <div className="px-4 py-4 md:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      if (window.history.length > 1 && window.document.referrer) {
                        window.history.back()
                      } else {
                        if (window.opener) window.close()
                        else router.push('/')
                      }
                    }} 
                    className="shrink-0 hover:bg-secondary/80 text-foreground font-medium rounded-full w-10 h-10 p-0"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  
                  {document && (
                    <>
                      <div className="p-2.5 bg-secondary/50 rounded-xl text-primary shrink-0 hidden md:flex items-center justify-center">
                        {getFileIcon(document.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-semibold truncate tracking-tight">
                          {document.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1.5 shrink-0 border-r border-border/50 pr-4">
                            <HardDrive className="w-3.5 h-3.5" />
                            {document.size}
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0 border-r border-border/50 pr-4">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(document.uploadDate)}
                          </span>
                          {previewContent?.metadata?.pages && (
                            <span className="flex items-center gap-1.5 shrink-0">
                              <BookOpen className="w-3.5 h-3.5" />
                              {previewContent.metadata.pages} Pages
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {document && (
                  <div className="flex items-center gap-2 shrink-0 bg-secondary/30 p-1.5 rounded-full border border-border/50">
                    <Badge variant="outline" className="rounded-full px-3 py-1 font-medium bg-background text-foreground border-border/50 hidden sm:flex">
                      {document.status}
                    </Badge>
                    
                    <div className="flex items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleCopyContent} className="rounded-full hover:bg-background hover:shadow-sm h-9 w-9">
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-lg shadow-sm font-medium text-xs">Copy Layout</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full hover:bg-background hover:shadow-sm h-9 w-9">
                            <Share2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-lg shadow-sm font-medium text-xs">Share</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleDownload} className="rounded-full hover:bg-background hover:shadow-sm h-9 w-9 text-primary">
                            <Download className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-lg shadow-sm font-medium text-xs">Download</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-full hover:bg-background hover:shadow-sm h-9 w-9">
                            {isFullScreen ? <Minimize2 className="w-4 h-4 text-muted-foreground" /> : <Fullscreen className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-lg shadow-sm font-medium text-xs">{isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-background border-b border-border px-4 py-2 sticky top-[73px] sm:top-[73px] z-40">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 overflow-x-auto flex-1">
                <div className="flex items-center gap-1.5 bg-secondary/30 p-1 rounded-full border border-border/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                    className="h-8 w-8 rounded-full p-0 flex items-center justify-center hover:bg-background"
                  >
                    <ZoomOut className="w-4 h-4 text-muted-foreground" />
                  </Button>

                  <div className="w-24 px-2 flex items-center">
                    <Slider
                      value={[zoom]}
                      onValueChange={handleZoomChange}
                      min={25}
                      max={300}
                      step={25}
                      className="w-full"
                    />
                  </div>

                  <span className="text-xs font-medium text-muted-foreground min-w-[3rem] text-center">
                    {zoom}%
                  </span>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setZoom(Math.min(300, zoom + 25))}
                    disabled={zoom >= 300}
                    className="h-8 w-8 rounded-full p-0 flex items-center justify-center hover:bg-background"
                  >
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => setZoom(100)} className="h-8 w-8 rounded-full p-0 flex items-center justify-center hover:bg-background">
                    <Maximize className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>

                {pages && pages > 1 && (
                  <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-full border border-border/50 ml-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="h-8 w-8 rounded-full p-0 flex items-center justify-center hover:bg-background"
                    >
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    <span className="text-xs font-medium text-foreground px-2">
                      {page} / {pages}
                    </span>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPage(Math.min(pages, page + 1))}
                      disabled={page >= pages}
                      className="h-8 w-8 rounded-full p-0 flex items-center justify-center hover:bg-background"
                    >
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}

                {previewContent?.contentType === 'image' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="h-9 w-9 p-0 rounded-full shrink-0 border-border/50 ml-2 shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              {previewContent?.metadata && (
                <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-muted-foreground shrink-0 bg-secondary/30 px-4 py-1.5 rounded-full border border-border/50">
                  {previewContent.metadata.wordCount && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {previewContent.metadata.wordCount.toLocaleString()} words
                    </span>
                  )}
                  {previewContent.metadata.characters && (
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <List className="w-3.5 h-3.5" />
                      {previewContent.metadata.characters.toLocaleString()} chars
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-4 lg:p-8 bg-muted/30">
            {renderPreviewContent()}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
