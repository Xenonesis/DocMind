'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  File,
  Image,
  FileCode,
  Plus
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

export function DocumentUpload({ onUpload }: DocumentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<Document[]>([])
  const { user } = useAuth()

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />
      case 'doc':
      case 'docx': return <FileText className="w-8 h-8 text-blue-500" />
      case 'txt': return <FileText className="w-8 h-8 text-gray-500" />
      case 'jpg':
      case 'jpeg':
      case 'png': return <Image className="w-8 h-8 text-green-500" /> // eslint-disable-line jsx-a11y/alt-text
      case 'json':
      case 'xml':
      case 'csv': return <FileCode className="w-8 h-8 text-purple-500" />
      default: return <File className="w-8 h-8 text-gray-500" />
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

    setUploadingFiles(newDocuments)

    // Upload each file to the server
    for (const doc of newDocuments) {
      try {
        const file = Array.from(files).find(f => f.name === doc.name)
        if (!file) continue

        // Simulate realistic upload progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map(d => {
            if (d.id === doc.id && d.progress !== undefined && d.progress < 90) {
              const increment = Math.random() * 15 + 5 // Random increment between 5-20%
              return { ...d, progress: Math.min(90, d.progress + increment) }
            }
            return d
          }))
        }, 200)

        const formData = new FormData()
        formData.append('file', file)

        // Use authenticated fetch for file upload
        const { authenticatedFetch } = await import('@/lib/api-client')
        const response = await authenticatedFetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
          headers: {} // Don't set Content-Type for FormData, let browser set it
        })

        clearInterval(progressInterval)

        if (response.ok) {
          const result = await response.json()
          
          // Complete the progress bar
          setUploadingFiles(prev => prev.map(d => 
            d.id === doc.id ? { 
              ...d, 
              progress: 100 
            } : d
          ))

          // Small delay to show 100% completion
          setTimeout(() => {
            // Update document with server response
            setUploadingFiles(prev => prev.map(d => 
              d.id === doc.id ? { 
                ...d, 
                id: result.id,
                status: 'PROCESSING'
              } : d
            ))

            // Add to parent component
            onUpload([{ 
              ...doc, 
              id: result.id,
              status: 'PROCESSING' 
            }])

            // Remove from uploading list after a delay
            setTimeout(() => {
              setUploadingFiles(prev => prev.filter(d => d.id !== result.id))
            }, 2000)
          }, 500)

        } else {
          // Handle upload error
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
    if (files.length > 0) {
      uploadFiles(files)
    }
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
    if (files && files.length > 0) {
      uploadFiles(files)
    }
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'ERROR': return 'bg-red-100 text-red-800'
    }
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      case 'PROCESSING': return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-4 border-foreground bg-background rounded-none brutal-shadow">
        <CardHeader className="border-b-4 border-foreground bg-accent text-accent-foreground p-6">
          <div className="flex items-center gap-4">
            <Upload className="w-8 h-8" />
            <div>
              <CardTitle className="text-3xl font-black uppercase tracking-tighter">
                INGEST_DOCUMENTS
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-lg text-accent-foreground/80 font-mono mt-2 uppercase">
            System ready. Feed PDF, DOCX, TXT, or images for raw vectorization.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div
            className={`relative overflow-hidden group border-4 border-dashed p-12 text-center transition-none font-mono ${
              isDragOver 
                ? 'border-accent bg-accent/10' 
                : 'border-foreground hover:bg-foreground/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="relative z-10 flex flex-col items-center">
              <Upload className="w-16 h-16 mb-6 text-foreground group-hover:-translate-y-2 transition-transform" />
              <h3 className="text-2xl font-black uppercase mb-2">
                [ DRAG_&_DROP_TARGET ]
              </h3>
              <p className="text-lg opacity-70 mb-8 uppercase">
                Awaiting manual file assignment
              </p>
              
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.json,.xml,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild size="lg" className="w-full sm:w-auto px-8 py-6 text-xl font-black rounded-none bg-foreground text-background hover:bg-accent hover:text-white brutal-shadow border-2 border-foreground uppercase tracking-widest cursor-pointer">
                <label htmlFor="file-upload" className="flex items-center gap-2">
                  <Plus className="w-6 h-6" />
                  SELECT_FILES
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadingFiles.length > 0 && (
        <Card className="border-4 border-foreground bg-background rounded-none brutal-shadow">
          <CardHeader className="border-b-4 border-foreground bg-foreground text-background p-4">
            <CardTitle className="font-mono uppercase font-bold tracking-widest">ACTIVE_UPLOADS</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {uploadingFiles.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 border-4 border-foreground bg-background font-mono"
                >
                  {getFileIcon(doc.name)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold truncate max-w-[200px] sm:max-w-xs">{doc.name}</h4>
                      <Badge className={`rounded-none border-2 border-foreground uppercase ${getStatusColor(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        <span className="ml-2 font-bold">{doc.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm opacity-70">SIZE: {doc.size}</p>
                    {doc.status === 'UPLOADING' && doc.progress !== undefined && (
                      <div className="mt-2">
                        <div className="h-4 border-2 border-foreground bg-background w-full">
                          <div className="h-full bg-accent" style={{ width: `${doc.progress}%` }} />
                        </div>
                        <p className="text-xs mt-1 font-bold">
                          {Math.round(doc.progress)}% COMPLETED
                        </p>
                      </div>
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