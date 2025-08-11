/**
 * Simple encryption utilities for API keys
 * Note: This is basic obfuscation, not true encryption. For production use,
 * consider using proper encryption libraries or backend secure storage.
 */

const ENCRYPTION_KEY = 'documind-ai-2024-secure-key' // In production, this should be from environment variables

// Simple XOR-based "encryption" for basic obfuscation
function xorEncrypt(text: string, key: string): string {
  let result: string[] = []
  for (let i = 0; i < text.length; i++) {
    const xorResult = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    result.push(xorResult.toString(16).padStart(2, '0'))
  }
  return result.join('')
}

function xorDecrypt(encryptedText: string, key: string): string {
  let result = ''
  // Parse hex pairs back to numbers
  for (let i = 0; i < encryptedText.length; i += 2) {
    const hexPair = encryptedText.substr(i, 2)
    const charCode = parseInt(hexPair, 16)
    const originalChar = charCode ^ key.charCodeAt((i / 2) % key.length)
    result += String.fromCharCode(originalChar)
  }
  return result
}

export function encryptApiKey(apiKey: string): string {
  if (!apiKey) return ''
  try {
    return xorEncrypt(apiKey, ENCRYPTION_KEY)
  } catch (error) {
    console.error('Failed to encrypt API key:', error)
    return ''
  }
}

export function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return ''
  try {
    return xorDecrypt(encryptedKey, ENCRYPTION_KEY)
  } catch (error) {
    console.error('Failed to decrypt API key:', error)
    return ''
  }
}

export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '•'.repeat(8)
  
  const visibleChars = 4
  const maskedChars = apiKey.length - visibleChars * 2
  
  return (
    apiKey.substring(0, visibleChars) +
    '•'.repeat(Math.max(maskedChars, 8)) +
    apiKey.substring(apiKey.length - visibleChars)
  )
}

export function isValidApiKey(apiKey: string, providerType: string): boolean {
  if (!apiKey || apiKey.length < 10) return false

  // Basic validation patterns for different providers
  const patterns = {
    // Google API keys can have various formats:
    // - AIza... (most common, typically 39 chars but can vary)
    // - Other formats for different Google services (20+ chars, but not starting with AIza)
    // Be more permissive for Google keys to accommodate different formats
    google: (key: string) => {
      // AIza keys - be more flexible with length (35-45 chars is common)
      if (key.startsWith('AIza')) {
        return key.length >= 35 && key.length <= 45 && /^AIza[0-9A-Za-z\-_]+$/.test(key)
      }
      // Other Google keys must be at least 20 characters and not start with AIza
      return key.length >= 20 && /^[A-Za-z0-9\-_]+$/.test(key)
    },
    mistral: /^[a-zA-Z0-9]{32}$/,
    'open-router': /^sk-or-[a-zA-Z0-9]{48,}$/,
    openai: /^sk-[a-zA-Z0-9]{20,}$/,
    anthropic: /^sk-ant-[a-zA-Z0-9]{20,}$/,
    'lm-studio': /^[a-zA-Z0-9\-_]{10,}$/,
    ollama: /^[a-zA-Z0-9\-_]{1,}$/ // Ollama might not require API keys
  }

  const pattern = patterns[providerType as keyof typeof patterns]
  if (pattern) {
    // Handle function-based validation for Google
    if (typeof pattern === 'function') {
      return pattern(apiKey)
    }
    // Handle regex-based validation for other providers
    return pattern.test(apiKey)
  }

  // Generic validation for unknown providers
  return apiKey.length >= 10 && /^[a-zA-Z0-9\-_]+$/.test(apiKey)
}

export function sanitizeError(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error) return error.error
  return 'Unknown error occurred'
}