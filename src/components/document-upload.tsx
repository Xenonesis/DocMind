'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  File,
  Image as ImageIcon,
  FileCode,
  Loader2
} from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR'
  uploadDate: string
  size: string
  progress?: number
}

interface DocumentUploadProps {
  onUpload: (documents: Document[]) => void
}

type UploadResponse = {
  id: string
  name: string
  type: string
  size: string
  status: 'PROCESSING'
  uploadDate: string
  downloadURL: string
  storageRef: string
  processingStrategy: 'go' | 'node'
}

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Document[]>([])
  const { user } = useAuth()

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return <FileText className="w-8 h-8 text-rose-500" />
      case 'doc':
      case 'docx': return <FileText className="w-8 h-8 text-blue-500" />
      case 'txt': return <FileText className="w-8 h-8 text-slate-500" />
      case 'jpg':
      case 'jpeg':
      case 'png': return <ImageIcon className="w-8 h-8 text-emerald-500" />
      case 'json':
      case 'xml':
      case 'csv': return <FileCode className="w-8 h-8 text-violet-500" />
      default: return <File className="w-8 h-8 text-slate-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const uploadFiles = async (files: FileList) => {
    const newDocuments: Document[] = Array.from(files).map((file, index) => ({
      id: Date.now().toString() + index,
      name: file.name,
      type: file.type || 'unknown',
      status: 'UPLOADING' as const,
      uploadDate: new Date().toISOString(),
      size: formatFileSize(file.size),
      progress: 0
    }))

    setUploadingFiles(prev => [...prev, ...newDocuments])

    for (const doc of newDocuments) {
      try {
        const file = Array.from(files).find(f => f.name === doc.name)
        if (!file) continue

        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map(d => {
            if (d.id === doc.id && d.progress !== undefined && d.progress < 90) {
              const increment = Math.random() * 15 + 5
               return { ...d, progress: Math.min(90, d.progress + increment) }
            }
            return d
          }))
        }, 200)

        const formData = new FormData()
        formData.append('file', file)

        const { authenticatedFetch } = await import('@/lib/api-client')
        const response = await authenticatedFetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          headers: {} 
        })

        clearInterval(progressInterval)

        if (response.ok) {
          const result = await response.json() as UploadResponse
          
          setUploadingFiles(prev => prev.map(d => 
            d.id === doc.id ? { ...d, progress: 100 } : d
          ))

          setTimeout(() => {
            const updatedDocument = {
              ...doc,
              id: result.id,
              status: 'PROCESSING' as const
            }

            setUploadingFiles(prev => prev.map(d => 
              d.id === doc.id ? { 
                ...d, 
                id: result.id,
                status: 'PROCESSING'
              } : d
            ))

            onUpload([updatedDocument])

            const processorEndpoint = result.processingStrategy === 'node'
              ? '/api/process-document-fallback'
              : '/api/process-document'

            authenticatedFetch(processorEndpoint, {
              method: 'POST',
              body: JSON.stringify({ documentId: result.id })
            }).then(async (processorResponse) => {
              if (!processorResponse.ok) {
                const errorText = await processorResponse.text()
                throw new Error(errorText || 'Processing failed')
              }
              onUpload([updatedDocument])
            }).catch((error) => {
              console.error('Document processing error:', error)
              setUploadingFiles(prev => prev.map(d =>
                d.id === result.id ? { ...d, status: 'ERROR' } : d
              ))
              onUpload([{ ...updatedDocument, status: 'ERROR' }])
            })

            setTimeout(() => {
              setUploadingFiles(prev => prev.filter(d => d.id !== result.id))
            }, 2000)
          }, 500)

        } else {
          setUploadingFiles(prev => prev.map(d => 
            d.id === doc.id ? { ...d, status: 'ERROR' } : d
          ))
        }
      } catch (error) {
        console.error('Upload error:', error)
        setUploadingFiles(prev => prev.map(d => 
          d.id === doc.id ? { ...d, status: 'ERROR' } : d
        ))
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) uploadFiles(files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) uploadFiles(files)
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      case 'PROCESSING': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'ERROR': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return <Loader2 className="w-3.5 h-3.5 animate-spin" />
      case 'PROCESSING': return <Loader2 className="w-3.5 h-3.5 animate-spin" />
      case 'COMPLETED': return <CheckCircle className="w-3.5 h-3.5" />
      case 'ERROR': return <AlertCircle className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Upload Documents</h2>
          <p className="text-muted-foreground mt-1">
            Securely upload your files for parsing and analysis.
          </p>
        </div>
      </div>

      <div
        className={`relative flex-1 group border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center transition-all min-h-[400px] ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border bg-card/50 hover:bg-card hover:border-border/80'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="relative z-10 flex flex-col items-center max-w-sm">
          <div className="w-20 h-20 bg-background shadow-sm rounded-full flex items-center justify-center mb-6 text-muted-foreground group-hover:scale-105 transition-transform group-hover:text-primary">
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Drag & drop files here
          </h3>
          <p className="text-muted-foreground mb-8">
            or select files from your computer. Supports PDF, Word, TXT, Images, and structured data formats.
          </p>
          
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.json,.xml,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button asChild size="lg" className="rounded-full px-8 shadow-sm cursor-pointer">
            <label htmlFor="file-upload">
              Browse Files
            </label>
          </Button>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="py-4 border-b border-border/50">
            <CardTitle className="text-base font-medium">Active Uploads</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {uploadingFiles.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-3 rounded-xl border border-border/50 bg-background/50"
                >
                  <div className="bg-background p-2 rounded-lg shadow-sm">
                    {getFileIcon(doc.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                      <Badge variant="secondary" className={`capitalize shadow-none border-none font-medium gap-1.5 ${getStatusColor(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        {doc.status.toLowerCase()}
                      </Badge>
                    </div>
                    {doc.status === 'UPLOADING' && doc.progress !== undefined ? (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 rounded-full bg-secondary w-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-300 ease-out" style={{ width: `${doc.progress}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground min-w-[3ch]">
                          {Math.round(doc.progress)}%
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.size}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
