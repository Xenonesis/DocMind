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
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
        <CardHeader className="relative z-10 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/20">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                Upload Documents
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-2">
            Securely upload your files for intelligent processing. We support PDF, DOC, DOCX, TXT, and images.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 relative z-10">
          <div
            className={`relative overflow-hidden group border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]' 
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* Animated background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-slate-800 rounded-full shadow-xl flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Drag & Drop files here
              </h3>
              <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 mb-6">
                or click the button below to browse your computer
              </p>
              
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.json,.xml,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 dark:from-white dark:to-slate-200 dark:hover:from-slate-100 dark:hover:to-slate-300 text-white dark:text-slate-900 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Select Files
                </label>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploading Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadingFiles.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  {getFileIcon(doc.name)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{doc.name}</h4>
                      <Badge className={getStatusColor(doc.status)}>
                        {getStatusIcon(doc.status)}
                        <span className="ml-1 capitalize">{doc.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{doc.size}</p>
                    {doc.status === 'UPLOADING' && doc.progress !== undefined && (
                      <div className="mt-2">
                        <Progress value={doc.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(doc.progress)}% uploaded
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