/* eslint-disable @next/next/no-img-element */
'use client'

import { tierForLevel } from '@/lib/gamification/levelTier'

interface Props {
  src: string | null | undefined
  fallback: string
  level: number
  size?: number
  className?: string
  showLevelBadge?: boolean
}

/**
 * Avatar com moldura colorida pelo tier visual do nível.
 * Ring duplo: interno preto (pra separar da foto), externo colorido + glow.
 * Pode mostrar um micro-badge "15" no canto inferior direito.
 */
export default function LevelAvatar({
  src,
  fallback,
  level,
  size = 80,
  className,
  showLevelBadge = true,
}: Props) {
  const tier = tierForLevel(level)
  const badgeSize = Math.max(22, Math.round(size * 0.32))

  return (
    <div
      className={`relative flex-shrink-0 ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <div
        className="relative rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: src ? 'transparent' : 'rgba(201,168,76,0.12)',
          boxShadow: `0 0 0 2px #0F0E0C, 0 0 0 3.5px ${tier.color}, 0 0 20px ${tier.glow}`,
        }}
      >
        {src ? (
          <img src={src} alt="" className="w-full h-full object-cover" />
        ) : (
          <span
            style={{
              color: tier.color,
              fontFamily: 'Cinzel, serif',
              fontWeight: 600,
              fontSize: size * 0.38,
            }}
          >
            {fallback}
          </span>
        )}
      </div>
      {showLevelBadge && (
        <span
          className="absolute flex items-center justify-center rounded-full"
          style={{
            right: -4,
            bottom: -4,
            width: badgeSize,
            height: badgeSize,
            background: tier.color,
            color: '#0F0E0C',
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: Math.max(10, Math.round(badgeSize * 0.48)),
            border: '2px solid #0F0E0C',
            boxShadow: `0 0 8px ${tier.glow}`,
            lineHeight: 1,
          }}
          aria-label={`Nível ${level}`}
        >
          {level}
        </span>
      )}
    </div>
  )
}
