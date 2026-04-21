'use client'

import { Type } from 'lucide-react'

export type FontScale = 'sm' | 'md' | 'lg'

interface Props {
  scrollPct: number
  fontScale: FontScale
  onCycleFont: () => void
  topSlot?: React.ReactNode
}

export default function ReaderToolbar({ scrollPct, fontScale, onCycleFont, topSlot }: Props) {
  return (
    <div
      className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2 mb-2 backdrop-blur-md"
      style={{
        background: 'rgba(15,14,12,0.7)',
        borderBottom: '1px solid rgba(201,168,76,0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex-1 h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(201,168,76,0.12)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${scrollPct}%`,
              background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
            }}
          />
        </div>
        <button
          type="button"
          onClick={onCycleFont}
          aria-label={`Tamanho da fonte: ${fontScale === 'sm' ? 'pequeno' : fontScale === 'md' ? 'médio' : 'grande'}`}
          className="flex items-center justify-center w-9 h-9 rounded-lg active:scale-95 touch-target"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.18)',
            color: 'var(--gold)',
          }}
        >
          <Type
            className={
              fontScale === 'sm' ? 'w-3.5 h-3.5' : fontScale === 'md' ? 'w-4 h-4' : 'w-5 h-5'
            }
          />
        </button>
      </div>
      {topSlot ? <div className="mt-2">{topSlot}</div> : null}
    </div>
  )
}
