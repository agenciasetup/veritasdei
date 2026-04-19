'use client'

import { tierForLevel } from '@/lib/gamification/levelTier'

type Size = 'xs' | 'sm' | 'md' | 'lg'

interface Props {
  level: number
  size?: Size
  className?: string
  /** Mostra "Nv 15" vs "15" — default true */
  showLabel?: boolean
}

const SIZE_STYLES: Record<Size, { h: number; px: number; fs: number; gap: number; labelFs: number }> = {
  xs: { h: 18, px: 6,  fs: 10, gap: 3, labelFs: 8.5 },
  sm: { h: 22, px: 8,  fs: 11, gap: 4, labelFs: 9 },
  md: { h: 28, px: 10, fs: 13, gap: 5, labelFs: 10 },
  lg: { h: 34, px: 14, fs: 16, gap: 6, labelFs: 11 },
}

/**
 * Badge com "Nv 15". Cor herda do tier visual da faixa (bronze→luz).
 * Sem título/rank temático — só o número.
 */
export default function LevelBadge({
  level,
  size = 'sm',
  className,
  showLabel = true,
}: Props) {
  const tier = tierForLevel(level)
  const s = SIZE_STYLES[size]

  return (
    <span
      className={`inline-flex items-center rounded-full whitespace-nowrap ${className ?? ''}`}
      style={{
        height: s.h,
        paddingInline: s.px,
        gap: s.gap,
        background: `${tier.color}14`,
        border: `1px solid ${tier.color}4D`,
        boxShadow: `0 0 10px ${tier.glow}`,
        fontFamily: 'Cinzel, serif',
        color: tier.color,
        lineHeight: 1,
      }}
      aria-label={`Nível ${level}`}
    >
      {showLabel && (
        <span
          style={{
            fontSize: s.labelFs,
            letterSpacing: '0.12em',
            opacity: 0.85,
            fontWeight: 500,
          }}
        >
          NV
        </span>
      )}
      <span style={{ fontSize: s.fs, fontWeight: 700 }}>{level}</span>
    </span>
  )
}
