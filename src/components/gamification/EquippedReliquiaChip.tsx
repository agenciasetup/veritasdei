/* eslint-disable @next/next/no-img-element */
'use client'

import { Gem } from 'lucide-react'
import { RARITY_META, type Reliquia } from '@/types/gamification'

interface Props {
  reliquia: Reliquia
  size?: 'xs' | 'sm' | 'md'
  showName?: boolean
  className?: string
}

const SIZE_META = {
  xs: { icon: 14, h: 18, px: 4, fs: 10 },
  sm: { icon: 18, h: 22, px: 6, fs: 11 },
  md: { icon: 22, h: 28, px: 8, fs: 12 },
}

/**
 * Mini-chip mostrando a relíquia equipada pelo usuário — aparece ao lado
 * do nome no header, em posts da comunidade, etc.
 */
export default function EquippedReliquiaChip({
  reliquia,
  size = 'sm',
  showName = false,
  className,
}: Props) {
  const rarity = RARITY_META[reliquia.rarity]
  const s = SIZE_META[size]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${className ?? ''}`}
      style={{
        height: s.h,
        paddingInline: s.px,
        background: rarity.bg,
        border: `1px solid ${rarity.border}`,
        boxShadow: `0 0 8px ${rarity.border}`,
      }}
      title={`Selo: ${reliquia.name}`}
    >
      {reliquia.image_url ? (
        <img
          src={reliquia.image_url}
          alt=""
          style={{ width: s.icon, height: s.icon, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <Gem style={{ width: s.icon, height: s.icon, color: rarity.color }} strokeWidth={1.8} />
      )}
      {showName && (
        <span
          className="whitespace-nowrap"
          style={{
            fontSize: s.fs,
            color: rarity.color,
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.03em',
            fontWeight: 500,
          }}
        >
          {reliquia.name}
        </span>
      )}
    </span>
  )
}
