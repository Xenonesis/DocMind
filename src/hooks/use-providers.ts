'use client'

import { useState, useEffect } from 'react'
import type { ConfiguredProvider } from '@/types'

interface UseProvidersOptions {
  user: { name?: string; email?: string } | null
}

export function useProviders({ user }: UseProvidersOptions) {
  const [configuredProviders, setConfiguredProviders] = useState<ConfiguredProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!user) return

    const fetchProviders = async () => {
      try {
        const { authenticatedRequest } = await import('@/lib/api-client')
        const [data, freeProviderRes] = await Promise.allSettled([
          authenticatedRequest('/api/settings'),
          fetch('/api/free-provider').then((r) => (r.ok ? r.json() : null)),
        ])

        const provs: ConfiguredProvider[] = []

        if (freeProviderRes.status === 'fulfilled' && freeProviderRes.value) {
          const fps = Array.isArray(freeProviderRes.value)
            ? freeProviderRes.value
            : [freeProviderRes.value]
          fps.forEach((fp: any) => {
            provs.push({ id: fp.id, name: fp.name })
          })
        }

        let activeId: string | undefined = undefined

        if (data.status === 'fulfilled' && Array.isArray(data.value)) {
          data.value.forEach((p: any) => {
            if (p.apiKey || ['LM_STUDIO', 'OLLAMA'].includes(p.provider)) {
              const id = p.id || p.provider
              if (p.isActive) activeId = id
              provs.push({
                id,
                name:
                  p.provider === 'GOOGLE_AI'
                    ? 'Google Gemini'
                    : p.provider === 'OPENAI'
                      ? 'OpenAI'
                      : p.provider === 'ANTHROPIC'
                        ? 'Anthropic Claude'
                        : p.provider === 'MISTRAL'
                          ? 'Mistral AI'
                          : p.provider === 'OPENROUTER'
                            ? 'OpenRouter'
                            : p.provider === 'OPENAI_COMPATIBLE'
                              ? 'Custom API'
                              : p.provider === 'GROQ'
                                ? `DocScan ${p.model || 'model name'} from groq (free)`
                                : p.provider === 'OLLAMA'
                                  ? 'Ollama'
                                  : p.provider === 'LM_STUDIO'
                                    ? 'LM Studio'
                                    : p.provider,
              })
            }
          })
        }
        setConfiguredProviders(provs)

        if (activeId && provs.some((p) => p.id === activeId)) {
          setSelectedProvider(activeId)
        } else if (provs.length > 0) {
          setSelectedProvider(provs[0].id)
        }
      } catch (error) {
        console.error('Error fetching providers:', error)
      }
    }

    fetchProviders()
  }, [user])

  return { configuredProviders, selectedProvider, setSelectedProvider }
}
