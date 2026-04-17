import Link from 'next/link'
import type { ReactNode } from 'react'

// Casa #hashtag (letras PT-BR, números, underscore) e @handle ([a-z0-9_]).
// Equivalente ao regex do trigger em Postgres (vd_extract_hashtags).
const TOKEN_PATTERN =
  /(^|[^\w])(#[a-zA-ZÀ-ÿ0-9_]{2,50}|@[a-zA-Z0-9_]{3,20})/g

// Ordem importa: bold (**) antes de italic (*), senão `**x**` vira `*x*` em italic.
// Não suporta nesting — um segmento formatado não pode conter outro formato.
// Suporta hashtag/menção dentro de qualquer formato via renderTextSegment.
type Formatting = 'bold' | 'italic' | 'underline' | 'strike'
const FORMATTING_PATTERNS: Array<{ kind: Formatting; regex: RegExp }> = [
  { kind: 'bold',      regex: /\*\*([^\n*]+?)\*\*/ },
  { kind: 'strike',    regex: /~~([^\n~]+?)~~/ },
  { kind: 'underline', regex: /__([^\n_]+?)__/ },
  { kind: 'italic',    regex: /(?<![*\w])\*([^\n*]+?)\*(?!\w)/ },
]

function normalizeHashtagSlug(display: string): string {
  return display
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Renderiza um trecho de texto cru procurando hashtags e menções.
 * Usado dentro de segmentos formatados (bold/italic/...) e também
 * em texto solto.
 */
function renderTextSegment(text: string, keyPrefix: string): ReactNode[] {
  if (!text) return []
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let keyCounter = 0
  const matches = text.matchAll(TOKEN_PATTERN)

  for (const match of matches) {
    const [full, leading, token] = match
    const matchStart = match.index ?? 0
    const tokenStart = matchStart + leading.length

    if (tokenStart > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-t-${keyCounter++}`}>
          {text.slice(lastIndex, tokenStart)}
        </span>,
      )
    }

    if (token.startsWith('#')) {
      const display = token.slice(1)
      const slug = normalizeHashtagSlug(display)
      if (/^[a-z0-9_]{2,50}$/.test(slug)) {
        nodes.push(
          <Link
            key={`${keyPrefix}-h-${keyCounter++}`}
            href={`/comunidade/hashtag/${slug}`}
            className="vd-hashtag"
            style={{ color: '#C9A84C', fontWeight: 500 }}
          >
            {token}
          </Link>,
        )
      } else {
        nodes.push(<span key={`${keyPrefix}-h-${keyCounter++}`}>{token}</span>)
      }
    } else if (token.startsWith('@')) {
      const handle = token.slice(1).toLowerCase()
      nodes.push(
        <Link
          key={`${keyPrefix}-m-${keyCounter++}`}
          href={`/comunidade/@${handle}`}
          className="vd-mention"
          style={{ color: '#C9A84C', fontWeight: 500 }}
        >
          {token}
        </Link>,
      )
    }

    lastIndex = tokenStart + token.length
    void full
  }

  if (lastIndex < text.length) {
    nodes.push(
      <span key={`${keyPrefix}-t-${keyCounter++}`}>{text.slice(lastIndex)}</span>,
    )
  }

  return nodes
}

type Segment =
  | { kind: 'text'; content: string }
  | { kind: Formatting; content: string }

/**
 * Divide o body em segmentos de texto cru e segmentos formatados,
 * preservando ordem. Um segmento formatado é encontrado pela primeira
 * ocorrência dentre todos os padrões (bold/italic/underline/strike).
 */
function parseFormatting(body: string): Segment[] {
  const segments: Segment[] = []
  let remaining = body

  while (remaining.length > 0) {
    let earliest: { kind: Formatting; index: number; length: number; inner: string } | null = null

    for (const pattern of FORMATTING_PATTERNS) {
      const match = pattern.regex.exec(remaining)
      if (!match || match.index === undefined) continue
      if (!earliest || match.index < earliest.index) {
        earliest = {
          kind: pattern.kind,
          index: match.index,
          length: match[0].length,
          inner: match[1],
        }
      }
    }

    if (!earliest) {
      segments.push({ kind: 'text', content: remaining })
      break
    }

    if (earliest.index > 0) {
      segments.push({ kind: 'text', content: remaining.slice(0, earliest.index) })
    }
    segments.push({ kind: earliest.kind, content: earliest.inner })
    remaining = remaining.slice(earliest.index + earliest.length)
  }

  return segments
}

/**
 * Converte o body cru de um Veritas em nodes React com hashtags, menções
 * e formatação básica (bold/italic/underline/strike).
 *
 * Sintaxe suportada:
 *   **negrito**   — <strong>
 *   *itálico*     — <em>
 *   __sublinhado__— <u> (cor dourada sutil)
 *   ~~tachado~~   — <s>
 *
 * Sem aninhamento entre formatos. Hashtags/menções continuam funcionando
 * dentro de qualquer formato. Preserva quebras de linha via whitespace-pre-line
 * no consumidor.
 */
export function renderVeritasBody(body: string): ReactNode[] {
  if (!body) return []
  const segments = parseFormatting(body)
  const nodes: ReactNode[] = []

  segments.forEach((seg, i) => {
    const inner = renderTextSegment(seg.content, `seg-${i}`)
    switch (seg.kind) {
      case 'bold':
        nodes.push(
          <strong key={`seg-${i}`} style={{ fontWeight: 600, color: '#F2EDE4' }}>
            {inner}
          </strong>,
        )
        break
      case 'italic':
        nodes.push(<em key={`seg-${i}`}>{inner}</em>)
        break
      case 'underline':
        nodes.push(
          <u
            key={`seg-${i}`}
            style={{
              textDecorationColor: 'rgba(201,168,76,0.55)',
              textDecorationThickness: 1,
              textUnderlineOffset: 3,
            }}
          >
            {inner}
          </u>,
        )
        break
      case 'strike':
        nodes.push(
          <s key={`seg-${i}`} style={{ opacity: 0.65 }}>
            {inner}
          </s>,
        )
        break
      default:
        nodes.push(...inner)
    }
  })

  return nodes
}
