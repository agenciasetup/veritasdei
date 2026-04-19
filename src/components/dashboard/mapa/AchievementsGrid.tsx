'use client'

import { Trophy, Medal, Crown, Lock } from 'lucide-react'
import { useAchievements, type Achievement, type AchievementTier } from '@/lib/content/useAchievements'

interface AchievementsGridProps {
  userId: string | undefined
}

const TIER_ICON: Record<AchievementTier, React.ElementType> = {
  iniciante: Medal,
  metade: Trophy,
  mestre: Crown,
}

const TIER_COLOR: Record<AchievementTier, string> = {
  iniciante: '#C9A84C',
  metade: '#D9C077',
  mestre: '#66BB6A',
}

export default function AchievementsGrid({ userId }: AchievementsGridProps) {
  const { achievements, unlockedCount, totalCount, loading } = useAchievements(userId)

  if (!userId || loading || totalCount === 0) return null

  return (
    <section className="w-full fade-in" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          <h3
            className="text-xs tracking-[0.18em] uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
          >
            Conquistas
          </h3>
        </div>
        <span
          className="text-[11px]"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          {unlockedCount}/{totalCount}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-2">
        {achievements.map((a) => (
          <AchievementTile key={a.id} achievement={a} />
        ))}
      </div>
    </section>
  )
}

function AchievementTile({ achievement: a }: { achievement: Achievement }) {
  const Icon = TIER_ICON[a.tier]
  const color = TIER_COLOR[a.tier]

  return (
    <div
      title={
        a.unlocked
          ? `${a.label} — desbloqueado!`
          : `${a.label} — estude ${a.threshold - a.studied} subtópico${a.threshold - a.studied === 1 ? '' : 's'} a mais`
      }
      className="rounded-xl p-2.5 flex flex-col items-center text-center transition-all"
      style={{
        background: a.unlocked ? `${color}12` : 'rgba(20,18,14,0.55)',
        border: `1px solid ${a.unlocked ? color + '35' : 'var(--border-subtle)'}`,
        opacity: a.unlocked ? 1 : 0.55,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5"
        style={{
          background: a.unlocked ? `${color}22` : 'rgba(242,237,228,0.04)',
          border: `1px solid ${a.unlocked ? color + '40' : 'rgba(242,237,228,0.08)'}`,
        }}
      >
        {a.unlocked ? (
          <Icon className="w-4 h-4" style={{ color }} />
        ) : (
          <Lock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
      <span
        className="text-[10px] leading-tight line-clamp-2"
        style={{
          color: a.unlocked ? 'var(--text-secondary)' : 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {a.groupTitle}
      </span>
      <span
        className="text-[9px] mt-0.5 tracking-wider uppercase"
        style={{
          color: a.unlocked ? color : 'var(--text-muted)',
          fontFamily: 'Cinzel, serif',
        }}
      >
        {a.tier === 'iniciante' ? 'Inic.' : a.tier === 'metade' ? 'Meio' : 'Mestre'}
      </span>
    </div>
  )
}
