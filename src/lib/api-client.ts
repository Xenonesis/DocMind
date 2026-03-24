import { supabase } from './supabase'

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication token available')
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${session.access_token}`,
  }

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value
      })
    } else {
      Object.assign(headers, options.headers)
    }
  }

  if (!options.headers?.['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(url, {
    ...options,
    headers
  })
}

export async function authenticatedRequest<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(url, options)
  
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    
    try {
      const errorData = JSON.parse(errorText)
      const parts = [errorData.error, errorData.details, errorData.hint].filter(Boolean)
      errorMessage = parts.length > 0 ? parts.join(' | ') : errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    
    throw new Error(errorMessage)
  }
  
  return response.json()
}