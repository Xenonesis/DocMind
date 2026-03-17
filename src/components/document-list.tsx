'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  MoreVertical,
  FileText,
  Image,
  File,
  FileCode,
  Calendar,
  HardDrive,
  CheckCircle,
  Clock,
  AlertCircle,
  Brain
} from 'lucide-react'

import { DocumentPreview } from './document-preview'

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
  progress?: number
}

interface DocumentListProps {
  documents: Document[]
}

export function DocumentList({ documents }: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />
      case 'doc':
      case 'docx': return <FileText className="w-5 h-5 text-blue-500" />
      case 'txt': return <FileText className="w-5 h-5 text-gray-500" />
      case 'jpg':
      case 'jpeg':
      case 'png': return <Image className="w-5 h-5 text-green-500" /> // eslint-disable-line jsx-a11y/alt-text
      case 'json':
      case 'xml':
      case 'csv': return <FileCode className="w-5 h-5 text-purple-500" />
      default: return <File className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
      case 'ERROR': return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'PROCESSING': return <Brain className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    const matchesType = typeFilter === 'all' || doc.type.includes(typeFilter)
    return matchesSearch && matchesStatus && matchesType
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const documentTypes = Array.from(new Set(documents.map(doc => doc.type)))

  const handlePreview = (document: Document) => {
    setPreviewDocument(document)
    setIsPreviewOpen(true)
  }

  const handleDownload = async (document: Document) => {
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-3xl overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
        <CardHeader className="relative z-10 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/20">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                Document Library
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mt-2">
            Manage and analyze your uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 relative z-10">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="UPLOADING">Uploading</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-lg rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
        <CardHeader className="relative z-10 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                Documents
              </CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-400 mt-1">
                {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border-slate-200/50 dark:border-slate-700/50 shadow-sm text-slate-700 dark:text-slate-300 transition-all duration-300">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-4 lg:p-6 relative z-10">
          <ScrollArea className="h-[600px] w-full pr-4">
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
                      <div className="flex-shrink-0 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner">
                        {getFileIcon(doc.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate mb-1">{doc.name}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span>{doc.size}</span>
                          </div>
                          <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="hidden sm:inline">{formatDate(doc.uploadDate)}</span>
                            <span className="sm:hidden">{new Date(doc.uploadDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          {doc.category && (
                            <>
                              <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                              <Badge variant="outline" className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                {doc.category}
                              </Badge>
                            </>
                          )}
                        </div>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {doc.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 3 && (
                              <Badge variant="secondary" className="text-[10px] sm:text-xs uppercase tracking-wider font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                +{doc.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4 mt-3 sm:mt-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-4">
                      <Badge className={`${getStatusColor(doc.status)} px-3 py-1 text-xs font-bold uppercase tracking-wide border rounded-full shadow-sm`}>
                        {getStatusIcon(doc.status)}
                        <span className="ml-1.5">{doc.status}</span>
                      </Badge>
                      
                      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handlePreview(doc)}
                          title="Preview document"
                          className="h-9 w-9 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownload(doc)}
                          title="Download document"
                          className="h-9 w-9 p-0 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-600 dark:hover:text-green-400 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {doc.status === 'UPLOADING' && doc.progress !== undefined && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Uploading in progress...</span>
                        <span className="text-blue-600 dark:text-blue-400">{Math.round(doc.progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300 relative"
                          style={{ width: `${doc.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -skew-x-12" />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {filteredDocuments.length === 0 && (
                <div className="text-center py-16 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    No documents found
                  </h3>
                  <p className="text-base text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
                    Try adjusting your search criteria or adding new documents to the library.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <DocumentPreview
        document={previewDocument}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}
