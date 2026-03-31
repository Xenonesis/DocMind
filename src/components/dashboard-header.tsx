'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Image from 'next/image'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import type { ConfiguredProvider } from '@/types'
import type { ReactNode } from 'react'

interface DashboardHeaderProps {
  title: string
  userName: string
  configuredProviders: ConfiguredProvider[]
  selectedProvider: string | undefined
  onSelectedProviderChange: (value: string) => void
  onLogout: () => void
  navItems: ReactNode
}

export function DashboardHeader({
  title,
  userName,
  configuredProviders,
  selectedProvider,
  onSelectedProviderChange,
  onLogout,
  navItems,
}: DashboardHeaderProps) {
  return (
    <header className="bg-background border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-lg overflow-hidden shadow-sm shrink-0 border border-primary/20 bg-background/50 flex items-center justify-center">
          <Image src="/logo.png" alt="DocMind Logo" fill sizes="40px" className="object-cover" priority />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Welcome back, {userName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
        {configuredProviders.length > 0 && (
          <Select value={selectedProvider} onValueChange={onSelectedProviderChange}>
            <SelectTrigger className="flex-1 md:flex-none md:w-[180px] h-9 bg-background/50 border-border text-xs rounded-full shadow-sm min-w-0">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {configuredProviders.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-xs py-2">{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          {navItems}
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/10 transition-colors rounded-full h-9 px-3 sm:px-5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
