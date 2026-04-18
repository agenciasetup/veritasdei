'use client'

import { useAutosizeTextarea } from '../useAutosizeTextarea'
import type { QuoteBlock } from '../../types'

export default function QuoteEditor({
  block,
  onChange,
}: {
  block: QuoteBlock
  onChange: (next: QuoteBlock) => void
}) {
  const ref = useAutosizeTextarea(block.text)
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-2"
      style={{
        borderLeft: '2px solid rgba(201,168,76,0.35)',
        background: 'rgba(20,18,14,0.3)',
      }}
    >
      <textarea
        ref={ref}
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Citação patrística ou bíblica"
        rows={2}
        className="w-full bg-transparent outline-none resize-none"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          color: '#B8AFA7',
          fontSize: '1.05rem',
          lineHeight: 1.5,
        }}
      />
      <input
        value={block.author ?? ''}
        onChange={(e) => onChange({ ...block, author: e.target.value || undefined })}
        placeholder="Autor (opcional) — Sto. Agostinho"
        className="w-full bg-transparent outline-none text-xs"
        style={{
          fontFamily: 'Poppins, sans-serif',
          color: '#8A8378',
        }}
      />
    </div>
  )
}
