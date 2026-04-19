'use client'

import { tierForLevel } from '@/lib/gamification/levelTier'

interface Props {
  level: number
  xpInLevel: number
  xpToNextLevel: number
  percentInLevel: number
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

const HEIGHTS = { sm: 4, md: 6, lg: 10 }

export default function XpBar({
  level,
  xpInLevel,
  xpToNextLevel,
  percentInLevel,
  size = 'md',
  showLabels = true,
  className,
}: Props) {
  const tier = tierForLevel(level)
  const nextTier = tierForLevel(level + 1)
  const height = HEIGHTS[size]

  return (
    <div className={className}>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height,
          background: 'rgba(242,237,228,0.06)',
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${percentInLevel}%`,
            background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
            boxShadow: `0 0 8px ${tier.glow}`,
          }}
        />
      </div>
      {showLabels && (
        <div
          className="flex items-center justify-between mt-1.5 text-[10px]"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          <span>{xpInLevel} / 100 XP</span>
          <span>faltam {xpToNextLevel} para Nv {level + 1}</span>
        </div>
      )}
    </div>
  )
}
