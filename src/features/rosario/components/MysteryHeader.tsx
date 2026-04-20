'use client'

import type { Mystery } from '../data/types'

interface MysteryHeaderProps {
  mystery: Mystery
  decadeNumber: number
}

export default function MysteryHeader({ mystery, decadeNumber }: MysteryHeaderProps) {
  return (
    <div
      className="rounded-xl p-5 mb-3"
      style={{
        background: 'var(--accent-soft)',
        border: '1px solid var(--border-1)',
      }}
    >
      {/* Decade number */}
      <span
        className="text-[10px] tracking-[0.2em] uppercase block mb-2"
        style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
      >
        {decadeNumber}ª Dezena
      </span>

      {/* Mystery title */}
      <h3
        className="text-base font-semibold leading-snug mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
      >
        {mystery.title}
      </h3>

      {/* Fruit */}
      <p className="text-xs mb-3" style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
        Fruto: {mystery.fruit}
      </p>

      {/* Scripture */}
      <div
        className="rounded-lg p-3 mb-2"
        style={{
          background: 'var(--surface-inset)',
          borderLeft: '3px solid rgba(201,168,76,0.3)',
        }}
      >
        <p
          className="text-[10px] tracking-[0.15em] uppercase mb-1"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          {mystery.scripture}
        </p>
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: 'var(--text-2)', fontFamily: 'var(--font-display)' }}
        >
          {mystery.reflection}
        </p>
      </div>
    </div>
  )
}
