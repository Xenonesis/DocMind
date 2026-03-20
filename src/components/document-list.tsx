'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Download, 
  Eye, 
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
  Inbox
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
      case 'pdf': return <FileText className="w-5 h-5 text-rose-500" />
      case 'doc':
      case 'docx': return <FileText className="w-5 h-5 text-blue-500" />
      case 'txt': return <FileText className="w-5 h-5 text-slate-500" />
      case 'jpg':
      case 'jpeg':
      case 'png': return <Image className="w-5 h-5 text-emerald-500" />
      case 'json':
      case 'xml':
      case 'csv': return <FileCode className="w-5 h-5 text-violet-500" />
      default: return <File className="w-5 h-5 text-slate-500" />
    }
  }

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
      case 'PROCESSING': return 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'COMPLETED': return 'bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      case 'ERROR': return 'bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    }
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'UPLOADING': return <Clock className="w-3.5 h-3.5" />
      case 'PROCESSING': return <Brain className="w-3.5 h-3.5 animate-pulse" />
      case 'COMPLETED': return <CheckCircle className="w-3.5 h-3.5" />
      case 'ERROR': return <AlertCircle className="w-3.5 h-3.5" />
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
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Document Archive</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage, view, and organize your uploaded files.
          </p>
        </div>
        <Badge variant="outline" className="text-sm font-medium py-1 px-3 bg-secondary/30">
          {filteredDocuments.length} total documents
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background border-border shadow-sm rounded-xl h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background border-border shadow-sm rounded-xl h-10">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="UPLOADING">Uploading</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="ERROR">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background border-border shadow-sm rounded-xl h-10">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border">
            <SelectItem value="all">All Types</SelectItem>
            {documentTypes.map(type => (
              <SelectItem key={type} value={type} className="uppercase">{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 border border-border/50 rounded-2xl bg-card shadow-sm overflow-hidden h-[500px]">
        <div className="divide-y divide-border/40">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="p-5 hover:bg-secondary/20 transition-colors group flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-muted-foreground shadow-sm">
                  {getFileIcon(doc.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate mb-1">{doc.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> {doc.size}</span>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(doc.uploadDate)}</span>
                  </div>
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {doc.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-[10px] px-2 py-0 font-medium">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full md:w-auto">
                <Badge className={`${getStatusColor(doc.status)} px-3 py-1 shadow-none border-0 gap-1.5 capitalize font-medium`}>
                  {getStatusIcon(doc.status)}
                  {doc.status.toLowerCase()}
                </Badge>
                
                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handlePreview(doc)}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDownload(doc)}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
                    title="Download Document"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredDocuments.length === 0 && (
            <div className="text-center py-20 bg-background/50 h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No documents found
              </h3>
              <p className="text-muted-foreground text-sm max-w-[250px] mx-auto">
                Adjust your filters or query to find what you are looking for.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <DocumentPreview
        document={previewDocument}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}