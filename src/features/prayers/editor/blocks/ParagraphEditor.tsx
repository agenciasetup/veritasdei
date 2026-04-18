'use client'

import { useAutosizeTextarea } from '../useAutosizeTextarea'
import type { ParagraphBlock } from '../../types'

export default function ParagraphEditor({
  block,
  onChange,
}: {
  block: ParagraphBlock
  onChange: (next: ParagraphBlock) => void
}) {
  const textareaRef = useAutosizeTextarea(block.text)
  return (
    <textarea
      ref={textareaRef}
      value={block.text}
      onChange={(e) => onChange({ ...block, text: e.target.value })}
      placeholder="Texto do parágrafo. Aceita **negrito** e *itálico*."
      rows={1}
      className="w-full bg-transparent outline-none resize-none"
      style={{
        fontFamily: 'Poppins, sans-serif',
        color: '#F2EDE4',
        fontSize: '1rem',
        lineHeight: 1.7,
        fontWeight: 300,
      }}
    />
  )
}
