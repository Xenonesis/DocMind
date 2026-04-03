type SourceDoc = {
  id: string
  name: string
  content: string
}

export type AnswerReference = {
  documentId: string
  documentName: string
  snippet: string
  score: number
}

export type AnswerHighlight = {
  text: string
  reason: string
}

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'to',
  'in',
  'on',
  'of',
  'with',
  'is',
  'are',
  'was',
  'were',
  'that',
  'this',
  'be',
  'as',
  'at',
  'by',
  'from',
  'it',
  'its',
  'if',
  'then',
  'than',
  'into',
  'about',
  'can',
  'could',
  'should',
  'would',
])

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(' ')
    .map((v) => v.trim())
    .filter((v) => v.length > 2 && !STOP_WORDS.has(v))
}

function extractSentences(value: string) {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function excerptAround(text: string, index: number, radius = 120) {
  const start = Math.max(0, index - radius)
  const end = Math.min(text.length, index + radius)
  const snippet = text.slice(start, end).trim()
  return snippet.length > 240 ? `${snippet.slice(0, 237)}...` : snippet
}

export function deriveHighlights(answer: string, maxItems = 3): AnswerHighlight[] {
  const sentences = extractSentences(answer)
    .filter((s) => s.length > 35)
    .slice(0, Math.max(maxItems * 2, 5))

  return sentences.slice(0, maxItems).map((text) => ({
    text,
    reason: 'Key point',
  }))
}

export function deriveReferences(
  query: string,
  answer: string,
  docs: SourceDoc[],
  maxItems = 3
): AnswerReference[] {
  const terms = Array.from(new Set([...tokenize(query), ...tokenize(answer).slice(0, 20)]))
  if (terms.length === 0 || docs.length === 0) return []

  const scored = docs
    .map((doc) => {
      const lower = doc.content.toLowerCase()
      let score = 0
      let firstHit = -1

      for (const term of terms) {
        const idx = lower.indexOf(term)
        if (idx >= 0) {
          score += 1
          if (firstHit < 0) firstHit = idx
        }
      }

      return { doc, score, firstHit }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)

  return scored.map(({ doc, score, firstHit }) => ({
    documentId: doc.id,
    documentName: doc.name,
    snippet: excerptAround(doc.content, firstHit >= 0 ? firstHit : 0),
    score,
  }))
}

export function clampSelectionText(value: string, limit = 700) {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length <= limit) return trimmed
  return `${trimmed.slice(0, limit)}...`
}

export function buildMemoryInstruction(style: string | null | undefined, feedbackSummary: any) {
  const responseStyle = style || 'balanced'
  const dislikes = Number(feedbackSummary?.dislikes || 0)
  const likes = Number(feedbackSummary?.likes || 0)

  const styleInstruction =
    responseStyle === 'concise'
      ? 'Prefer concise, high-signal responses.'
      : responseStyle === 'detailed'
        ? 'Prefer detailed and structured responses.'
        : 'Prefer balanced responses with clear structure.'

  const feedbackInstruction =
    dislikes > likes
      ? 'Improve clarity and grounding because user recently disliked more responses.'
      : 'Keep current clarity and grounding level.'

  return `${styleInstruction} ${feedbackInstruction}`
}
