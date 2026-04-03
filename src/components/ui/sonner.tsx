'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'
import { CheckCircle2, AlertCircle, Info, Loader2, AlertTriangle } from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-right"
      offset={24}
      icons={{
        success: <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />,
        error: <AlertCircle className="mt-0.5 h-4 w-4 text-rose-500 shrink-0" />,
        warning: <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />,
        info: <Info className="mt-0.5 h-4 w-4 text-blue-500 shrink-0" />,
        loading: <Loader2 className="mt-0.5 h-4 w-4 text-muted-foreground animate-spin shrink-0" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group flex items-start gap-3 w-full px-4 py-3.5 rounded-xl border border-border/40 bg-background/95 text-foreground shadow-[0_4px_24px_rgb(0,0,0,0.08)] backdrop-blur-md transition-all sm:w-[380px]',
          title: 'text-[14px] font-medium tracking-tight text-foreground/90',
          description: 'text-[13px] text-muted-foreground mt-[1px] leading-snug',
          actionButton:
            'bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-primary/90',
          cancelButton:
            'bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1.5 rounded-md transition-colors hover:bg-secondary/80',
          icon: 'mr-1 mt-0.5 flex-shrink-0',
          success: '!border-emerald-500/20 !bg-emerald-500/5 dark:!bg-emerald-500/10',
          error: '!border-rose-500/20 !bg-rose-500/5 dark:!bg-rose-500/10',
          warning: '!border-amber-500/20 !bg-amber-500/5 dark:!bg-amber-500/10',
          info: '!border-blue-500/20 !bg-blue-500/5 dark:!bg-blue-500/10',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
