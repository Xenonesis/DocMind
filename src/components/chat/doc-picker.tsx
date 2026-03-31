'use client'

import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { FileText, Check } from 'lucide-react'
import type { Document } from '@/types'

interface DocPickerProps {
  show: boolean
  completedDocs: Document[]
  selectedDocIds: string[]
  onToggleDoc: (id: string) => void
  onClearSelection: () => void
}

export function DocPicker({
  show,
  completedDocs,
  selectedDocIds,
  onToggleDoc,
  onClearSelection,
}: DocPickerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden mb-4 shrink-0"
        >
          <Card className="p-3 border-border bg-secondary/20">
            <p className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider">
              {completedDocs.length === 0 ? 'No processed documents yet' : 'Filter context to specific documents (optional)'}
            </p>
            {completedDocs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {completedDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => onToggleDoc(doc.id)}
                    aria-label={`${selectedDocIds.includes(doc.id) ? 'Deselect' : 'Select'} document ${doc.name}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors
                      ${selectedDocIds.includes(doc.id)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                      }`}
                  >
                    <FileText className="w-3 h-3" />
                    <span className="max-w-[160px] truncate">{doc.name}</span>
                    {selectedDocIds.includes(doc.id) && <Check className="w-3 h-3" />}
                  </button>
                ))}
                {selectedDocIds.length > 0 && (
                  <button
                    onClick={onClearSelection}
                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">Upload and process documents first to use them as context.</p>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
