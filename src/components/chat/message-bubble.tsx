'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import {
  Bot,
  User,
  FileText,
  Copy,
  Check,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage } from '@/types'

// ── MessageBubble ─────────────────────────────────────────────────────────────
interface MessageBubbleProps {
  message: ChatMessage
  onCopy: (id: string, text: string) => void
  onFeedback: (id: string, type: 'up' | 'down') => void
  feedback: 'up' | 'down' | null
  onRegenerate: () => void
  canRegenerate: boolean
  copied: string | null
  showStreamingCursor: boolean
}

export function MessageBubble({
  message,
  onCopy,
  onFeedback,
  feedback,
  onRegenerate,
  canRegenerate,
  copied,
  showStreamingCursor,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
          ${isUser
            ? 'bg-primary text-primary-foreground'
            : isError
            ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
            : 'bg-secondary border border-border text-foreground'
          }`}
      >
        {isUser ? <User className="w-4 h-4" /> : isError ? <AlertCircle className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`group max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3.5 rounded-2xl text-sm leading-relaxed overflow-hidden
            ${isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : isError
              ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 rounded-bl-sm whitespace-pre-wrap'
              : 'bg-card border border-border text-foreground rounded-bl-sm shadow-sm'
            }`}
        >
          {isUser || isError ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {showStreamingCursor && <span className="inline-block animate-pulse ml-0.5">▍</span>}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-muted-foreground/60">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          {message.provider && (
            <Badge 
              variant="outline" 
              className={`text-[10px] h-4 px-1.5 font-normal ${
                message.provider?.includes('(free)') 
                ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5' 
                : 'border-border/50 text-muted-foreground/70'
              }`}
            >
              {message.provider}
            </Badge>
          )}

          {message.docsUsed && message.docsUsed.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal border-border/50 text-muted-foreground/70 gap-1">
              <FileText className="w-2.5 h-2.5" />
              {message.docsUsed.length} doc{message.docsUsed.length !== 1 ? 's' : ''}
            </Badge>
          )}

          {!isUser && !isError && (
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => onCopy(message.id, message.content)}
                className="opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-secondary"
                aria-label="Copy assistant response"
                title="Copy"
              >
                {copied === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => onFeedback(message.id, 'up')}
                className={`opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary ${
                  feedback === 'up' ? 'text-primary' : 'text-muted-foreground/60 hover:text-foreground'
                }`}
                aria-label="Mark response as helpful"
                title="Helpful"
              >
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => onFeedback(message.id, 'down')}
                className={`opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary ${
                  feedback === 'down' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/60 hover:text-foreground'
                }`}
                aria-label="Mark response as unhelpful"
                title="Not helpful"
              >
                <ThumbsDown className="w-3 h-3" />
              </button>
              <button
                onClick={onRegenerate}
                disabled={!canRegenerate}
                className="opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground/60 hover:text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Regenerate response"
                title="Regenerate"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── TypingIndicator ───────────────────────────────────────────────────────────
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex gap-3 items-end"
      role="status"
      aria-live="polite"
    >
      <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shadow-sm">
        <Bot className="w-4 h-4 text-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
