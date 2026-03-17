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
  Brain,
  TerminalSquare
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
      case 'pdf': return <FileText className="w-6 h-6" />
      case 'doc':
      case 'docx': return <FileText className="w-6 h-6" />
      case 'txt': return <FileText className="w-6 h-6" />
      case 'jpg':
      case 'jpeg':
      case 'png': return <Image className="w-6 h-6" />
      case 'json':
      case 'xml':
      case 'csv': return <FileCode className="w-6 h-6" />
      default: return <File className="w-6 h-6" />
    }
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return 'bg-yellow-500 text-black border-4 border-black'
      case 'PROCESSING': return 'bg-blue-500 text-black border-4 border-black'
      case 'COMPLETED': return 'bg-green-500 text-black border-4 border-black'
      case 'ERROR': return 'bg-red-500 text-white border-4 border-black'
    }
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return <Clock className="w-4 h-4" />
      case 'PROCESSING': return <Brain className="w-4 h-4 animate-pulse" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'ERROR': return <AlertCircle className="w-4 h-4" />
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
    }).toUpperCase()
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
    <div className="space-y-8 font-mono">
      {/* Filters */}
      <Card className="border-4 border-foreground bg-background rounded-none brutal-shadow">
        <CardHeader className="border-b-4 border-foreground bg-foreground text-background p-6">
          <div className="flex items-center gap-4">
            <TerminalSquare className="w-8 h-8" />
            <CardTitle className="text-2xl font-black uppercase tracking-widest">
              QUERY_ARCHIVE
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-foreground" />
              <Input
                placeholder="SEARCH_INDEX..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 text-lg py-6 uppercase font-bold border-4 border-foreground rounded-none bg-background focus-visible:ring-0 focus-visible:border-accent"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[250px] border-4 border-foreground rounded-none py-6 font-bold uppercase uppercase">
                  <SelectValue placeholder="FILTER_STATUS" />
                </SelectTrigger>
                <SelectContent className="border-4 border-foreground rounded-none font-mono uppercase font-bold">
                  <SelectItem value="all">ALL_STATUS</SelectItem>
                  <SelectItem value="UPLOADING">UPLOADING</SelectItem>
                  <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[250px] border-4 border-foreground rounded-none py-6 font-bold uppercase uppercase">
                  <SelectValue placeholder="FILTER_TYPE" />
                </SelectTrigger>
                <SelectContent className="border-4 border-foreground rounded-none font-mono uppercase font-bold">
                  <SelectItem value="all">ALL_TYPES</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      <Card className="border-4 border-foreground bg-background rounded-none brutal-shadow">
        <CardHeader className="border-b-4 border-foreground bg-accent text-white p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-black uppercase tracking-widest flex items-center gap-4">
              SYSTEM_INDEX
              <span className="bg-background text-foreground px-3 py-1 text-sm brutal-shadow border-2 border-foreground">
                {filteredDocuments.length} RECORDS
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px] w-full">
            <div className="divide-y-4 divide-foreground">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-6 bg-background hover:bg-foreground hover:text-background transition-colors group flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-6 flex-1 min-w-0">
                    <div className="p-4 border-4 border-current bg-background text-foreground group-hover:bg-foreground group-hover:text-background transition-colors brutal-shadow-sm">
                      {getFileIcon(doc.name)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <h3 className="font-black text-xl truncate">{doc.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm font-bold opacity-80 uppercase">
                        <span className="flex items-center gap-2"><HardDrive className="w-4 h-4" /> {doc.size}</span>
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {formatDate(doc.uploadDate)}</span>
                      </div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {doc.tags.map((tag, index) => (
                            <span key={index} className="border-2 border-current px-2 py-1 text-xs font-bold uppercase tracking-widest">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full md:w-auto">
                    <Badge className={`${getStatusColor(doc.status)} px-4 py-2 text-sm font-black uppercase tracking-widest rounded-none shadow-none`}>
                      {getStatusIcon(doc.status)}
                      <span className="ml-2">{doc.status}</span>
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handlePreview(doc)}
                        className="rounded-none border-4 border-current hover:bg-background hover:text-foreground w-12 h-12 brutal-shadow-sm"
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDownload(doc)}
                        className="rounded-none border-4 border-current hover:bg-background hover:text-foreground w-12 h-12 brutal-shadow-sm"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredDocuments.length === 0 && (
                <div className="text-center py-24 bg-background border-dashed">
                  <TerminalSquare className="w-16 h-16 mx-auto mb-6 opacity-50" />
                  <h3 className="text-2xl font-black uppercase tracking-widest mb-4">
                    NO_RECORDS_FOUND
                  </h3>
                  <p className="text-lg opacity-70 font-bold max-w-md mx-auto uppercase">
                    Adjust search parameters or initialize new document upload.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <DocumentPreview
        document={previewDocument}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}