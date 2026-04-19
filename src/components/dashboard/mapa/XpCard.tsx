'use client'

import { Sparkles } from 'lucide-react'
import { useXpStats } from '@/lib/content/useXpStats'

interface XpCardProps {
  userId: string | undefined
}

export default function XpCard({ userId }: XpCardProps) {
  const { level, totalXp, xpInLevel, xpToNextLevel, percentInLevel, totalStudied, loading } = useXpStats(userId)

  if (!userId || loading || totalStudied === 0) return null

  return (
    <div
      className="rounded-2xl p-4 fade-in"
      style={{
        background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(20,18,14,0.6))',
        border: '1px solid rgba(201,168,76,0.25)',
        backdropFilter: 'blur(12px)',
        animationDelay: '0.3s',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
          <span
            className="text-[10px] tracking-[0.18em] uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
          >
            Seu Nível
          </span>
        </div>
        <span
          className="text-[11px]"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          {totalXp} XP total
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="text-3xl font-bold leading-none"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
        >
          {level}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
        >
          Nível
        </span>
      </div>

      <div
        className="w-full h-1.5 rounded-full overflow-hidden mb-1.5"
        style={{ background: 'rgba(242,237,228,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${percentInLevel}%`,
            background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
          }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>{xpInLevel} / 100 XP</span>
        <span>faltam {xpToNextLevel} para o nível {level + 1}</span>
      </div>
    </div>
  )
}
