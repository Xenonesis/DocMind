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
      case 'pdf': return <FileText className="w-6 h-6 text-destructive" />
      case 'doc':
      case 'docx': return <FileText className="w-6 h-6 text-accent" />
      case 'txt': return <FileText className="w-6 h-6 text-foreground" />
      case 'jpg':
      case 'jpeg':
      case 'png': return <Image className="w-6 h-6 text-green-500" />
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
        <div className="flex flex-col items-center justify-center h-[60vh] border-4 border-foreground bg-background brutal-shadow p-8">
          <Loader2 className="w-16 h-16 animate-spin text-foreground mb-4" />
          <p className="font-mono font-black uppercase text-xl">LOADING_PREVIEW...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] bg-destructive text-destructive-foreground border-4 border-foreground brutal-shadow p-8">
          <AlertCircle className="w-16 h-16 mb-4" />
          <h3 className="font-black text-2xl uppercase mb-2">PREVIEW_ERROR</h3>
          <p className="font-mono font-bold mb-6 text-center max-w-md">{error}</p>
          <Button variant="outline" onClick={fetchPreviewContent} className="rounded-none border-4 border-foreground bg-background text-foreground hover:bg-foreground hover:text-background font-bold uppercase">
            <RotateCcw className="w-4 h-4 mr-2" />
            RETRY_OPERATION
          </Button>
        </div>
      )
    }

    if (!previewContent) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] border-4 border-dashed border-foreground bg-background p-8">
          <TerminalSquare className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="font-black text-2xl uppercase mb-2">NO_PREVIEW_AVAILABLE</h3>
          <p className="font-mono font-bold opacity-70">DATA_TYPE_UNSUPPORTED</p>
        </div>
      )
    }

    const renderContent = () => {
      switch (previewContent.contentType) {
        case 'text':
          return (
            <div className="h-full bg-background border-4 border-foreground brutal-shadow overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 sm:p-6 lg:p-8">
                  <pre 
                    className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-foreground break-words" 
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
            <div className="h-full bg-background border-4 border-foreground brutal-shadow overflow-hidden flex items-center justify-center p-4">
              <div className="overflow-auto max-h-full max-w-full border-4 border-foreground bg-white">
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
            <div className="h-full bg-background border-4 border-foreground brutal-shadow overflow-hidden">
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
            <div className="flex flex-col items-center justify-center h-full bg-background border-4 border-dashed border-foreground p-8">
              <File className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="font-black text-2xl uppercase mb-2">PREVIEW_NOT_SUPPORTED</h3>
              <p className="font-mono font-bold opacity-70 mb-6">RAW_DATA_ONLY</p>
              <Button onClick={handleDownload} className="rounded-none border-4 border-foreground bg-accent text-white hover:bg-foreground font-bold uppercase">
                <Download className="w-4 h-4 mr-2" />
                EXECUTE_DOWNLOAD
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono p-4">
        <div className="text-center border-4 border-destructive bg-destructive/10 p-12 brutal-shadow max-w-lg w-full">
          <AlertCircle className="w-16 h-16 mx-auto mb-6 text-destructive" />
          <h1 className="text-3xl font-black uppercase mb-4 text-destructive">NODE_NOT_FOUND</h1>
          <p className="font-bold opacity-80 mb-8 uppercase">The requested document pointer is invalid or missing.</p>
          <Button onClick={() => router.back()} className="rounded-none border-4 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black w-full text-lg h-14">
            <ArrowLeft className="w-5 h-5 mr-2" />
            RETURN_TO_BASE
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground font-mono">
        <div ref={containerRef} className="flex flex-col h-screen">
          {/* Responsive Header */}
          <div className="bg-background border-b-4 border-foreground sticky top-0 z-50">
            <div className="px-4 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (window.history.length > 1 && window.document.referrer) {
                        window.history.back()
                      } else {
                        if (window.opener) window.close()
                        else router.push('/')
                      }
                    }} 
                    className="shrink-0 rounded-none border-4 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground font-black px-4 py-2 h-auto uppercase"
                  >
                    <ArrowLeft className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">EXIT</span>
                  </Button>
                  
                  {document && (
                    <>
                      <div className="p-3 border-4 border-foreground bg-accent text-white shrink-0 hidden md:block">
                        {getFileIcon(document.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-black uppercase truncate tracking-tight">
                          {document.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-1 text-xs font-bold uppercase opacity-80 flex-wrap">
                          <span className="flex items-center gap-1 shrink-0 border-r-2 border-foreground pr-3">
                            <HardDrive className="w-3 h-3" />
                            {document.size}
                          </span>
                          <span className="flex items-center gap-1 shrink-0 border-r-2 border-foreground pr-3">
                            <Calendar className="w-3 h-3" />
                            {formatDate(document.uploadDate)}
                          </span>
                          {previewContent?.metadata?.pages && (
                            <span className="flex items-center gap-1 shrink-0">
                              <BookOpen className="w-3 h-3" />
                              {previewContent.metadata.pages} PAGES
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Section */}
                {document && (
                  <div className="flex items-center gap-2 shrink-0 border-4 border-foreground p-1 bg-muted">
                    <Badge className="rounded-none px-3 py-1 font-bold uppercase bg-background text-foreground border-2 border-foreground hidden sm:flex">
                      {document.status}
                    </Badge>
                    
                    <div className="flex">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleCopyContent} className="rounded-none hover:bg-foreground hover:text-background h-10 w-10">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-none border-2 border-foreground font-mono font-bold text-xs uppercase">COPY_DATA</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-none hover:bg-foreground hover:text-background h-10 w-10">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-none border-2 border-foreground font-mono font-bold text-xs uppercase">SHARE_NODE</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleDownload} className="rounded-none hover:bg-foreground hover:text-background h-10 w-10 bg-accent text-white">
                            <Download className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-none border-2 border-foreground font-mono font-bold text-xs uppercase">DOWNLOAD</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="rounded-none hover:bg-foreground hover:text-background h-10 w-10">
                            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Fullscreen className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-none border-2 border-foreground font-mono font-bold text-xs uppercase">{isFullScreen ? 'EXIT_FULLSCREEN' : 'ENTER_FULLSCREEN'}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-background border-b-4 border-foreground px-4 py-2 sticky top-[80px] sm:top-[90px] z-40">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 overflow-x-auto">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border-2 border-foreground p-1 shrink-0 bg-muted">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                    className="p-1 h-8 w-8 rounded-none hover:bg-foreground hover:text-background"
                  >
                    <ZoomOut className="w-4 h-4" />
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

                  <span className="text-xs font-black min-w-[3rem] text-center bg-background border-2 border-foreground py-1 px-2">
                    {zoom}%
                  </span>

                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setZoom(Math.min(300, zoom + 25))}
                    disabled={zoom >= 300}
                    className="p-1 h-8 w-8 rounded-none hover:bg-foreground hover:text-background"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => setZoom(100)} className="p-1 h-8 w-8 rounded-none hover:bg-foreground hover:text-background">
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>

                {/* Page Navigation */}
                {pages && pages > 1 && (
                  <div className="flex items-center gap-1 border-2 border-foreground p-1 shrink-0 bg-muted">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page <= 1}
                      className="p-1 h-8 w-8 rounded-none hover:bg-foreground hover:text-background"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <span className="text-xs font-black bg-background border-2 border-foreground py-1 px-3 whitespace-nowrap">
                      {page} / {pages}
                    </span>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPage(Math.min(pages, page + 1))}
                      disabled={page >= pages}
                      className="p-1 h-8 w-8 rounded-none hover:bg-foreground hover:text-background"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Image Rotation */}
                {previewContent?.contentType === 'image' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="shrink-0 rounded-none border-2 border-foreground h-10 w-10 font-black uppercase"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Document Stats */}
              {previewContent?.metadata && (
                <div className="hidden lg:flex items-center gap-4 text-xs font-bold uppercase shrink-0 border-2 border-foreground bg-muted px-4 py-2">
                  {previewContent.metadata.wordCount && (
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {previewContent.metadata.wordCount.toLocaleString()} W
                    </span>
                  )}
                  {previewContent.metadata.characters && (
                    <span className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      {previewContent.metadata.characters.toLocaleString()} C
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden p-4 lg:p-8 bg-muted/30">
            {renderPreviewContent()}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
