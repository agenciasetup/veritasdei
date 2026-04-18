'use client'

import type { HeadingBlock } from '../../types'

export default function HeadingEditor({
  block,
  onChange,
}: {
  block: HeadingBlock
  onChange: (next: HeadingBlock) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 text-[10px]">
        {[2, 3, 4].map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onChange({ ...block, level: lvl as 2 | 3 | 4 })}
            className="rounded-md px-2 py-1 transition-colors"
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
              background:
                block.level === lvl ? 'rgba(201,168,76,0.18)' : 'transparent',
              border: `1px solid ${block.level === lvl ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.12)'}`,
              color: block.level === lvl ? '#C9A84C' : '#8A8378',
            }}
          >
            H{lvl}
          </button>
        ))}
      </div>
      <input
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Título da seção"
        className="w-full bg-transparent outline-none"
        style={{
          fontFamily: 'Cinzel, serif',
          color: '#C9A84C',
          fontSize: block.level === 2 ? '1.25rem' : block.level === 3 ? '1.1rem' : '1rem',
          letterSpacing: block.level === 2 ? '0.05em' : '0.03em',
          fontWeight: 600,
          textTransform: block.level === 2 ? 'uppercase' : 'none',
        }}
      />
    </div>
  )
}
