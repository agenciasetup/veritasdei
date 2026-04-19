'use client'

import { ArrowUp, X } from 'lucide-react'
import { tierForLevel } from '@/lib/gamification/levelTier'

interface Props {
  level: number
  onClose: () => void
}

export default function LevelUpModal({ level, onClose }: Props) {
  const tier = tierForLevel(level)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        className="relative w-full max-w-sm p-8 rounded-2xl text-center fade-in"
        style={{
          background: 'rgba(15,14,12,0.98)',
          border: `1px solid ${tier.color}`,
          boxShadow: `0 0 60px ${tier.glow}`,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-white/5"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        <div className="flex justify-center mb-4">
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${tier.color}30 0%, transparent 70%)`,
              border: `2px solid ${tier.color}`,
            }}
          >
            <ArrowUp className="w-10 h-10" style={{ color: tier.color }} />
          </div>
        </div>

        <p
          className="text-xs tracking-[0.2em] uppercase mb-2"
          style={{ color: tier.color, fontFamily: 'Cinzel, serif' }}
        >
          Novo nível
        </p>
        <h2
          className="text-5xl font-bold mb-4"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
        >
          {level}
        </h2>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
        >
          Sua jornada avança. Continue firme — cada verdade aprendida fortalece a fé.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
            color: '#0F0E0C',
            fontFamily: 'Cinzel, serif',
            fontWeight: 600,
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
