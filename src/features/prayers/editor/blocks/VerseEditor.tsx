'use client'

import { useAutosizeTextarea } from '../useAutosizeTextarea'
import type { VerseBlock } from '../../types'

export default function VerseEditor({
  block,
  onChange,
}: {
  block: VerseBlock
  onChange: (next: VerseBlock) => void
}) {
  const textareaRef = useAutosizeTextarea(block.text)
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2"
      style={{
        background: 'rgba(28,24,18,0.55)',
        border: '1px solid rgba(201,168,76,0.2)',
        borderLeft: '3px solid #C9A84C',
      }}
    >
      <textarea
        ref={textareaRef}
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Pai-Nosso, que estais nos céus…"
        rows={3}
        className="w-full bg-transparent outline-none resize-none"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          color: '#F2EDE4',
          fontSize: '1.15rem',
          lineHeight: 1.55,
        }}
      />
      <input
        value={block.reference ?? ''}
        onChange={(e) =>
          onChange({ ...block, reference: e.target.value || undefined })
        }
        placeholder="Referência (opcional) — Mt 6:9-13"
        className="w-full bg-transparent outline-none text-xs"
        style={{
          fontFamily: 'Cinzel, serif',
          color: '#C9A84C',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          opacity: 0.9,
        }}
      />
    </div>
  )
}
