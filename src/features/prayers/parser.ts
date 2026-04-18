import type { Block } from './types'

/**
 * Parser de body de oração → Block[].
 *
 * Gramática suportada:
 * - Fenced block  ```<kind>...```  com kind ∈ {verse, quote, callout, callout:info, callout:warning, callout:indulgence}
 *   Para `verse`, a última linha "— Ref." é extraída como reference.
 *   Para `quote`, a última linha "— Autor" é extraída como author.
 * - Heading       ## / ### / #### → levels 2/3/4
 * - Divider       linha só com `---` ou `***`
 * - Lista         linhas iniciando com `- ` (ou `1. `, ordered)
 * - Parágrafo     qualquer outra linha; parágrafos são separados por linha em branco.
 *
 * Inline (bold/italic) fica pro renderer — aqui só estruturamos.
 */

const FENCE_RE = /^```(verse|quote|callout(?::(?:info|warning|indulgence))?)\s*$/

export function parsePrayerBody(body: string | null | undefined): Block[] {
  if (!body) return []

  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []

  let i = 0
  let paragraphBuf: string[] = []

  const flushParagraph = () => {
    if (paragraphBuf.length === 0) return
    const text = paragraphBuf.join('\n').trim()
    paragraphBuf = []
    if (!text) return
    // Detecta lista se TODAS as linhas começarem com "- " ou "N. "
    if (text.split('\n').every(l => /^(\s*[-*]\s+|\s*\d+\.\s+)/.test(l))) {
      const ordered = /^\s*\d+\.\s+/.test(text.split('\n')[0])
      const items = text
        .split('\n')
        .map(l => l.replace(/^(\s*[-*]\s+|\s*\d+\.\s+)/, '').trim())
        .filter(Boolean)
      blocks.push({ type: 'list', ordered, items })
      return
    }
    blocks.push({ type: 'paragraph', text })
  }

  while (i < lines.length) {
    const line = lines[i]

    // Fenced block
    const fenceMatch = line.trim().match(FENCE_RE)
    if (fenceMatch) {
      flushParagraph()
      const kindRaw = fenceMatch[1]
      const inner: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '```') {
        inner.push(lines[i])
        i++
      }
      // Skip closing fence
      if (i < lines.length && lines[i].trim() === '```') i++

      const innerText = inner.join('\n').trim()
      if (kindRaw === 'verse') {
        const { text, reference } = extractTrailingAttribution(innerText)
        blocks.push({ type: 'verse', text, reference })
      } else if (kindRaw === 'quote') {
        const { text, reference: author } = extractTrailingAttribution(innerText)
        blocks.push({ type: 'quote', text, author })
      } else if (kindRaw.startsWith('callout')) {
        const tone = (kindRaw.split(':')[1] as 'info' | 'warning' | 'indulgence' | undefined) ?? 'info'
        blocks.push({ type: 'callout', tone, text: innerText })
      }
      continue
    }

    // Heading
    const hMatch = line.match(/^(#{2,4})\s+(.+)$/)
    if (hMatch) {
      flushParagraph()
      const level = hMatch[1].length as 2 | 3 | 4
      blocks.push({ type: 'heading', level, text: hMatch[2].trim() })
      i++
      continue
    }

    // Divider
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushParagraph()
      blocks.push({ type: 'divider' })
      i++
      continue
    }

    // Blank line separates paragraphs
    if (line.trim() === '') {
      flushParagraph()
      i++
      continue
    }

    paragraphBuf.push(line)
    i++
  }
  flushParagraph()

  return blocks
}

/**
 * Parser específico para latin_body — no seed vem tipicamente como
 * texto plano (sem fences), então tratamos tudo como um único verse
 * block. Se vier com fences/headings, caímos no parser regular.
 */
export function parseLatinBody(latin: string | null | undefined): Block[] {
  if (!latin) return []
  const trimmed = latin.trim()
  if (!trimmed) return []
  const hasRichSyntax = /^```|^#{2,4}\s/m.test(trimmed)
  if (hasRichSyntax) return parsePrayerBody(trimmed)
  return [{ type: 'verse', text: trimmed }]
}

/**
 * Se o último parágrafo do bloco começar com `— ` (travessão), trata
 * como attribution/reference e retira do corpo.
 */
function extractTrailingAttribution(text: string): { text: string; reference?: string } {
  const lines = text.split('\n')
  const last = lines[lines.length - 1]?.trim() ?? ''
  const m = last.match(/^[—–-]\s*(.+)$/)
  if (m && lines.length > 1) {
    return {
      text: lines.slice(0, -1).join('\n').trimEnd(),
      reference: m[1].trim(),
    }
  }
  return { text }
}
