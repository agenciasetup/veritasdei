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
        background: 'rgba(201,168,76,0.05)',
        border: '1px solid rgba(201,168,76,0.12)',
      }}
    >
      {/* Decade number */}
      <span
        className="text-[10px] tracking-[0.2em] uppercase block mb-2"
        style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
      >
        {decadeNumber}ª Dezena
      </span>

      {/* Mystery title */}
      <h3
        className="text-base font-semibold leading-snug mb-2"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
      >
        {mystery.title}
      </h3>

      {/* Fruit */}
      <p className="text-xs mb-3" style={{ color: '#D9C077', fontFamily: 'Poppins, sans-serif' }}>
        Fruto: {mystery.fruit}
      </p>

      {/* Scripture */}
      <div
        className="rounded-lg p-3 mb-2"
        style={{
          background: 'rgba(15,14,12,0.5)',
          borderLeft: '3px solid rgba(201,168,76,0.3)',
        }}
      >
        <p
          className="text-[10px] tracking-[0.15em] uppercase mb-1"
          style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
        >
          {mystery.scripture}
        </p>
        <p
          className="text-sm leading-relaxed italic"
          style={{ color: '#B8AFA2', fontFamily: 'Cormorant Garamond, serif' }}
        >
          {mystery.reflection}
        </p>
      </div>
    </div>
  )
}
