import Link from 'next/link'
import type { ReactNode } from 'react'

// Casa #hashtag (letras PT-BR, números, underscore) e @handle ([a-z0-9_]).
// Equivalente ao regex do trigger em Postgres (vd_extract_hashtags).
const TOKEN_PATTERN =
  /(^|[^\w])(#[a-zA-ZÀ-ÿ0-9_]{2,50}|@[a-zA-Z0-9_]{3,20})/g

function normalizeHashtagSlug(display: string): string {
  // Remove acentos + lowercase. Bate com vd_normalize_hashtag no SQL.
  return display
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Converte o body cru de um Veritas em nodes React com hashtags e
 * menções clicáveis. Hashtags levam para /comunidade/hashtag/[slug],
 * menções para /comunidade/@[handle].
 *
 * Preserva quebras de linha (\n → <br/>) e não renderiza HTML bruto
 * (React escapa strings por padrão).
 */
export function renderVeritasBody(body: string): ReactNode[] {
  if (!body) return []

  const nodes: ReactNode[] = []
  let lastIndex = 0
  let keyCounter = 0
  const matches = body.matchAll(TOKEN_PATTERN)

  for (const match of matches) {
    const [full, leading, token] = match
    const matchStart = match.index ?? 0
    const tokenStart = matchStart + leading.length

    // Texto antes do token (inclui o char "leading" se não for vazio).
    if (tokenStart > lastIndex) {
      nodes.push(
        <span key={`t-${keyCounter++}`}>
          {body.slice(lastIndex, tokenStart)}
        </span>,
      )
    }

    if (token.startsWith('#')) {
      const display = token.slice(1)
      const slug = normalizeHashtagSlug(display)
      // Revalida após normalização — slug precisa ser [a-z0-9_]{2,50}.
      if (/^[a-z0-9_]{2,50}$/.test(slug)) {
        nodes.push(
          <Link
            key={`h-${keyCounter++}`}
            href={`/comunidade/hashtag/${slug}`}
            className="vd-hashtag"
            style={{ color: '#C9A84C', fontWeight: 500 }}
          >
            {token}
          </Link>,
        )
      } else {
        nodes.push(
          <span key={`h-${keyCounter++}`}>{token}</span>,
        )
      }
    } else if (token.startsWith('@')) {
      const handle = token.slice(1).toLowerCase()
      nodes.push(
        <Link
          key={`m-${keyCounter++}`}
          href={`/comunidade/@${handle}`}
          className="vd-mention"
          style={{ color: '#C9A84C', fontWeight: 500 }}
        >
          {token}
        </Link>,
      )
    }

    lastIndex = tokenStart + token.length

    // Se o leading char era parte do match (não era ""), já foi pulado
    // via tokenStart. Se foi o início do texto, lastIndex está correto.
    void full
  }

  if (lastIndex < body.length) {
    nodes.push(
      <span key={`t-${keyCounter++}`}>{body.slice(lastIndex)}</span>,
    )
  }

  return nodes
}
