'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Send, Loader2, Paperclip, Square } from 'lucide-react'
import type { StreamDebugEntry, Document } from '@/types'

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  isStreaming: boolean
  completedDocs: Document[]
  selectedDocIds: string[]
  streamState: 'idle' | 'streaming' | 'completed' | 'stopped'
  isUploadingFiles: boolean
  streamDebugEnabled: boolean
  streamDebugEntries: StreamDebugEntry[]
  onSendMessage: () => void
  onStopGenerating: () => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ChatInput({
  input,
  onInputChange,
  isStreaming,
  completedDocs,
  selectedDocIds,
  streamState,
  isUploadingFiles,
  streamDebugEnabled,
  streamDebugEntries,
  onSendMessage,
  onStopGenerating,
  onFileSelect,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSendMessage()
    }
  }

  const openUploadPicker = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/50 shrink-0">
      {selectedDocIds.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <Paperclip className="w-3 h-3 text-primary" />
          <span className="text-xs text-primary font-medium">
            Searching in {selectedDocIds.length} selected document
            {selectedDocIds.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
      {streamState !== 'idle' && (
        <div className="mb-2">
          <p
            className={`text-xs font-medium ${
              streamState === 'streaming'
                ? 'text-primary'
                : streamState === 'completed'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {streamState === 'streaming'
              ? 'Generating response...'
              : streamState === 'completed'
                ? 'Response complete.'
                : 'Generation stopped.'}
          </p>
        </div>
      )}
      <div className="flex gap-3 items-end">
        <div className="relative flex-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.json,.xml,.csv"
            onChange={onFileSelect}
            className="hidden"
          />
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              completedDocs.length === 0
                ? 'Upload a document first to start chatting...'
                : 'Ask anything about your documents… (Enter to send)'
            }
            disabled={isStreaming || completedDocs.length === 0}
            aria-label="Ask a question about your documents"
            aria-busy={isStreaming}
            className="resize-none min-h-[56px] max-h-[200px] rounded-2xl bg-secondary/30 border-border/50 shadow-inner pl-14 pr-14 py-4 text-sm leading-relaxed focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background transition-all"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = Math.min(t.scrollHeight, 200) + 'px'
            }}
          />
          <Button
            onClick={openUploadPicker}
            disabled={isUploadingFiles}
            size="icon"
            variant="ghost"
            className="absolute left-2 bottom-2 h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Upload documents"
          >
            {isUploadingFiles ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={isStreaming ? onStopGenerating : onSendMessage}
            disabled={(!input.trim() && !isStreaming) || completedDocs.length === 0}
            size="icon"
            className={`absolute right-2 bottom-2 h-10 w-10 rounded-xl shadow-sm transition-all ${
              isStreaming
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : input.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground'
            }`}
            aria-label={isStreaming ? 'Stop generating response' : 'Send message'}
          >
            {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
        AI can make mistakes. Verify important information from your documents directly.
      </p>
      {streamDebugEnabled && (
        <Card className="mt-3 border-border/70 bg-secondary/20">
          <div className="px-3 py-2 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Stream Diagnostics ({streamDebugEntries.length})
            </p>
          </div>
          <div className="max-h-36 overflow-y-auto px-3 py-2 space-y-1">
            {streamDebugEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No stream events yet.</p>
            ) : (
              streamDebugEntries.map((entry) => (
                <p key={entry.id} className="text-xs text-muted-foreground">
                  <span className="text-foreground/80">[{entry.timestamp}]</span> {entry.message}
                </p>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
