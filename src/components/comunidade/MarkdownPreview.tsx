'use client'

import { renderVeritasBody } from '@/lib/community/body-renderer'

interface Props {
  value: string
}

const TOKENS = /\*\*[^\n*]+?\*\*|__[^\n_]+?__|~~[^\n~]+?~~|(?<![*\w])\*[^\n*]+?\*(?!\w)/

/**
 * Preview ao vivo do corpo — só aparece quando há marcação markdown
 * (B/I/U/S). Mostra como o texto ficará formatado sem gerar ruído no
 * caso comum de posts sem formatação.
 */
export default function MarkdownPreview({ value }: Props) {
  const trimmed = value.trim()
  if (!trimmed || !TOKENS.test(trimmed)) return null

  return (
    <div
      className="mt-2 rounded-xl px-3 py-2"
      style={{
        background: 'rgba(16,16,16,0.55)',
        border: '1px solid rgba(201,168,76,0.14)',
      }}
    >
      <p
        className="text-[10px] uppercase tracking-[0.14em] mb-1"
        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
      >
        Prévia
      </p>
      <p
        className="text-[14px] leading-[20px] whitespace-pre-line"
        style={{ color: '#E7DED1', fontFamily: 'Poppins, sans-serif' }}
      >
        {renderVeritasBody(value)}
      </p>
    </div>
  )
}
