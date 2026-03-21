
const ENCRYPTION_KEY = 'documind-ai-2024-secure-key' 

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

  const patterns: Record<string, (key: string) => boolean> = {
    google: (key: string) => {
      if (key.startsWith('AIza')) {
        return key.length >= 35 && key.length <= 45 && /^AIza[0-9A-Za-z\-_]+$/.test(key)
      }
      return key.length >= 20 && /^[A-Za-z0-9\-_]+$/.test(key)
    },
    mistral: (key: string) => /^[a-zA-Z0-9]{32}$/.test(key),
    'open-router': (key: string) => /^sk-or-v1-[a-fA-F0-9]{64}$/.test(key) || /^sk-or-[a-zA-Z0-9\-]{48,}$/.test(key),
    openai: (key: string) => /^sk-[a-zA-Z0-9]{20,}$/.test(key),
    anthropic: (key: string) => /^sk-ant-[a-zA-Z0-9]{20,}$/.test(key),
    'lm-studio': (key: string) => /^[a-zA-Z0-9\-_]{10,}$/.test(key),
    ollama: (key: string) => /^[a-zA-Z0-9\-_]{1,}$/.test(key) 
  }

  const pattern = patterns[providerType as keyof typeof patterns]
  if (pattern) {
    return pattern(apiKey)
  }

  return apiKey.length >= 10 && /^[a-zA-Z0-9\-_]+$/.test(apiKey)
}

export function sanitizeError(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error) return error.error
  return 'Unknown error occurred'
}