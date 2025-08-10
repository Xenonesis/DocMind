import { supabase } from './supabase'

/**
 * Make an authenticated API request to our backend
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  if (!supabase) {
    throw new Error('Supabase not configured')
  }

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication token available')
  }

  // Add the authorization header
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers
  }

  // Only set Content-Type to application/json if not already specified and not FormData
  if (!options.headers?.['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(url, {
    ...options,
    headers
  })
}

/**
 * Make an authenticated API request and parse JSON response
 */
export async function authenticatedRequest<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(url, options)
  
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    
    try {
      const errorData = JSON.parse(errorText)
      errorMessage = errorData.error || errorMessage
    } catch {
      // If not JSON, use the text as error message
      errorMessage = errorText || errorMessage
    }
    
    throw new Error(errorMessage)
  }
  
  return response.json()
}