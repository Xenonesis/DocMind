interface GuardrailInput {
  systemPrompt?: string | null
  refusalMessage: string
  query: string
  history?: Array<{ role: string; content: string }>
  documents: Array<{ name: string; content: string; category?: string | null }>
}

export const DOCUMENT_SCOPE_FALLBACK = 'OUT_OF_SCOPE_DOCUMENT_QUERY'

export function buildGuardrailedPrompts(input: GuardrailInput) {
  const historyText = Array.isArray(input.history) && input.history.length > 0
    ? `Conversation history:\n${input.history.map((m) => `${m.role}: ${m.content}`).join('\n')}`
    : 'Conversation history: none'

  const docContext = input.documents
    .map((doc, index) => {
      const trimmed = (doc.content || '').slice(0, 5000)
      return `Document ${index + 1}: ${doc.name}\nCategory: ${doc.category || 'uncategorized'}\nContent:\n${trimmed}`
    })
    .join('\n\n')

  const systemPrompt = [
    'You are a strict document-grounded assistant.',
    'You must answer using only the linked document context.',
    `If the answer is not present in the context, respond with exactly: ${DOCUMENT_SCOPE_FALLBACK}`,
    `If a custom refusal is needed, use exactly: ${input.refusalMessage}`,
    'Never invent facts, links, names, or citations beyond document text.',
    input.systemPrompt ? `Custom instructions: ${input.systemPrompt}` : null,
  ].filter(Boolean).join('\n')

  const userPrompt = [
    `User question: ${input.query}`,
    historyText,
    'Linked document context starts below:',
    docContext,
    'Return plain text answer. Mention document names when possible.',
  ].join('\n\n')

  return { systemPrompt, userPrompt }
}

export function normalizeGuardrailResponse(answer: string, refusalMessage: string): { answer: string; refused: boolean } {
  const trimmed = (answer || '').trim()
  if (!trimmed || trimmed === DOCUMENT_SCOPE_FALLBACK) {
    return { answer: refusalMessage, refused: true }
  }
  return { answer: trimmed, refused: false }
}
