import type { Block } from '../types'

/**
 * Serializa Block[] de volta para o formato markdown + fences que
 * `body` guarda no banco. Round-trip com `parsePrayerBody`:
 *
 *   parsePrayerBody(serializeBlocks(blocks)) ≈ blocks
 *
 * Note: o "≈" é porque o parser pode normalizar algumas coisas
 * (ex: múltiplas linhas em branco viram uma). Isso é desejado.
 */
export function serializeBlocks(blocks: Block[]): string {
  const parts: string[] = []
  for (const b of blocks) {
    parts.push(serializeBlock(b))
  }
  // Separador = linha em branco entre blocos, bem definido.
  return parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

function serializeBlock(b: Block): string {
  switch (b.type) {
    case 'heading':
      return `${'#'.repeat(b.level)} ${b.text.trim()}`
    case 'paragraph':
      return b.text.trim()
    case 'divider':
      return '---'
    case 'list': {
      const lines = b.items.map((item, idx) =>
        b.ordered ? `${idx + 1}. ${item.trim()}` : `- ${item.trim()}`
      )
      return lines.join('\n')
    }
    case 'verse': {
      const inner = b.reference
        ? `${b.text.trimEnd()}\n— ${b.reference.trim()}`
        : b.text.trim()
      return '```verse\n' + inner + '\n```'
    }
    case 'quote': {
      const inner = b.author
        ? `${b.text.trimEnd()}\n— ${b.author.trim()}`
        : b.text.trim()
      return '```quote\n' + inner + '\n```'
    }
    case 'callout':
      return `\`\`\`callout:${b.tone}\n${b.text.trim()}\n\`\`\``
  }
}
