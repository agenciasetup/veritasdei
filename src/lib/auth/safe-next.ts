/**
 * Valida o parâmetro `?next=` usado após login / confirmação de e-mail /
 * magic link. Evita open redirect: `?next=//evil.com/phish` ou
 * `?next=/\evil.com` seriam tratados como URL externa pelo browser depois
 * do `NextResponse.redirect` concatenar origin + next.
 *
 * Regras:
 *   • Só aceita caminhos relativos começando com '/'.
 *   • Rejeita '//' (protocol-relative) e '/\\' (reinterpretável como host).
 *   • Rejeita caracteres de controle, espaço e tab (parsing inconsistente).
 *   • Rejeita qualquer esquema de URL (javascript:, data:, http:, etc.).
 *   • Valor inválido → default '/'.
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw) return '/'
  if (typeof raw !== 'string') return '/'
  if (raw.length > 2048) return '/'

  // Rejeita controle e espaço — alguns parsers normalizam e ignoram.
  if (/[\u0000-\u001F\u007F\s]/.test(raw)) return '/'

  // Precisa ser caminho relativo.
  if (!raw.startsWith('/')) return '/'

  // Protocol-relative ou backslash confundido com host.
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/'

  return raw
}
