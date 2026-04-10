'use client'

import { useMemo } from 'react'
import { MessageCircleQuestion } from 'lucide-react'
import { getDailyIceBreakers } from '@/lib/icebreakers'

interface IceBreakersProps {
  onSelect: (question: string) => void
  disabled?: boolean
}

export default function IceBreakers({ onSelect, disabled }: IceBreakersProps) {
  const iceBreakers = useMemo(() => getDailyIceBreakers(4), [])

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 fade-in" style={{ animationDelay: '0.3s' }}>
      {/* Label */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <MessageCircleQuestion className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <span
          className="text-xs tracking-wider uppercase"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          Ou comece por aqui
        </span>
      </div>

      {/* Ice-breaker buttons grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {iceBreakers.map((ib) => (
          <button
            key={ib.question}
            onClick={() => onSelect(ib.question)}
            disabled={disabled}
            className="group text-left px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(20,18,14,0.6)',
              border: '1px solid var(--border-gold)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span
              className="text-sm leading-relaxed transition-colors duration-200 group-hover:text-[var(--gold)]"
              style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
            >
              {ib.question}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
