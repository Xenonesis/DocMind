'use client'

import { MessageSquare, BookOpen, Brain, Zap, FileText } from 'lucide-react'
import type { Document } from '@/types'

const SUGGESTED_PROMPTS = [
  { icon: BookOpen, text: 'Summarize all my uploaded documents' },
  { icon: Brain, text: 'What are the key findings across my documents?' },
  { icon: Zap, text: 'Compare the main topics in these documents' },
  { icon: FileText, text: 'List all important dates and deadlines mentioned' },
]

interface ChatEmptyStateProps {
  completedDocs: Document[]
  onSendMessage: (text: string) => void
}

export function ChatEmptyState({ completedDocs, onSendMessage }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mb-5">
        <MessageSquare className="w-8 h-8 text-primary/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Start a conversation</h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Ask questions about your documents and get AI-powered insights instantly. 
        {completedDocs.length > 0 && <span className="block mt-1 text-primary/80">Using DocScan Glm-5 (free) automatically if no provider is set.</span>}
        {completedDocs.length === 0 && ' Upload a document first to get started.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {SUGGESTED_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(p.text)}
            disabled={completedDocs.length === 0}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-background hover:bg-secondary/40 hover:border-primary/30 transition-all text-left group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <p.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
