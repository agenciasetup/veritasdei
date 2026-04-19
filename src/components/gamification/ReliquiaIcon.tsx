/* eslint-disable @next/next/no-img-element */
'use client'

import { Gem, Lock } from 'lucide-react'
import { RARITY_META, type Reliquia } from '@/types/gamification'

type Size = 'xs' | 'sm' | 'md' | 'lg'

interface Props {
  reliquia: Reliquia
  locked?: boolean
  size?: Size
  className?: string
}

const SIZE_PX: Record<Size, number> = { xs: 24, sm: 40, md: 64, lg: 88 }

/**
 * Ícone de uma relíquia. Se tiver `image_url`, mostra a arte; senão, um
 * placeholder com Gem. Borda/brilho pela raridade. Estado "locked" fica
 * opaco com cadeado.
 */
export default function ReliquiaIcon({
  reliquia,
  locked = false,
  size = 'md',
  className,
}: Props) {
  const dim = SIZE_PX[size]
  const rarity = RARITY_META[reliquia.rarity]
  const hasImage = Boolean(reliquia.image_url)

  return (
    <div
      className={`relative rounded-xl flex items-center justify-center overflow-hidden ${className ?? ''}`}
      style={{
        width: dim,
        height: dim,
        background: rarity.bg,
        border: `1px solid ${rarity.border}`,
        boxShadow: locked
          ? 'none'
          : `0 0 ${Math.round(dim * 0.18)}px ${rarity.border}`,
        opacity: locked ? 0.5 : 1,
        filter: locked ? 'grayscale(0.6)' : 'none',
      }}
      title={reliquia.name}
    >
      {hasImage ? (
        <img
          src={reliquia.image_url!}
          alt={reliquia.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <Gem
          className="w-1/2 h-1/2"
          style={{ color: rarity.color }}
          strokeWidth={1.4}
        />
      )}
      {locked && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(15,14,12,0.55)' }}
        >
          <Lock
            className="w-[38%] h-[38%]"
            style={{ color: 'rgba(242,237,228,0.7)' }}
          />
        </span>
      )}
    </div>
  )
}
