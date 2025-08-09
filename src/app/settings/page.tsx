'use client'

import { AiApiSettings } from '@/components/settings/ai-api-settings'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 max-w-7xl">
        <AiApiSettings />
      </div>
    </div>
  )
}