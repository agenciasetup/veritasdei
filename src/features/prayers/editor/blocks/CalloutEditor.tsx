'use client'

import { useAutosizeTextarea } from '../useAutosizeTextarea'
import type { CalloutBlock } from '../../types'

const TONES: Array<{ tone: CalloutBlock['tone']; label: string; color: string }> = [
  { tone: 'info', label: 'Info', color: '#C9A84C' },
  { tone: 'warning', label: 'Atenção', color: '#D94F5C' },
  { tone: 'indulgence', label: 'Indulgência', color: '#8B3145' },
]

export default function CalloutEditor({
  block,
  onChange,
}: {
  block: CalloutBlock
  onChange: (next: CalloutBlock) => void
}) {
  const ref = useAutosizeTextarea(block.text)
  const palette =
    block.tone === 'warning'
      ? { bg: 'rgba(217,79,92,0.1)', border: 'rgba(217,79,92,0.3)' }
      : block.tone === 'indulgence'
        ? { bg: 'rgba(107,29,42,0.18)', border: 'rgba(139,49,69,0.35)' }
        : { bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.25)' }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 text-[10px]">
        {TONES.map((t) => (
          <button
            key={t.tone}
            type="button"
            onClick={() => onChange({ ...block, tone: t.tone })}
            className="rounded-md px-2 py-1"
            style={{
              fontFamily: 'Poppins, sans-serif',
              background:
                block.tone === t.tone ? `${t.color}22` : 'transparent',
              border: `1px solid ${block.tone === t.tone ? `${t.color}66` : 'rgba(201,168,76,0.12)'}`,
              color: block.tone === t.tone ? t.color : '#8A8378',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        className="rounded-lg p-3"
        style={{
          background: palette.bg,
          border: `1px solid ${palette.border}`,
        }}
      >
        <textarea
          ref={ref}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Mensagem do destaque"
          rows={2}
          className="w-full bg-transparent outline-none resize-none"
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: '#F2EDE4',
            fontSize: '0.9rem',
            lineHeight: 1.55,
          }}
        />
      </div>
    </div>
  )
}
