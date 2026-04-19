'use client'

import { RARITY_META, type Reliquia } from '@/types/gamification'
import ReliquiaIcon from './ReliquiaIcon'

interface Props {
  reliquia: Reliquia
  unlocked: boolean
  equipped?: boolean
  onClick?: () => void
  className?: string
}

export default function ReliquiaCard({
  reliquia,
  unlocked,
  equipped = false,
  onClick,
  className,
}: Props) {
  const rarity = RARITY_META[reliquia.rarity]

  const body = (
    <div
      className={`flex flex-col items-center text-center gap-2 rounded-2xl p-3 transition-all ${
        onClick ? 'active:scale-[0.98]' : ''
      } ${className ?? ''}`}
      style={{
        background: equipped
          ? `linear-gradient(135deg, ${rarity.bg}, rgba(20,18,14,0.6))`
          : 'rgba(20,18,14,0.55)',
        border: equipped
          ? `1.5px solid ${rarity.color}`
          : `1px solid ${unlocked ? rarity.border : 'rgba(242,237,228,0.06)'}`,
        boxShadow: equipped ? `0 0 20px ${rarity.border}` : 'none',
      }}
    >
      <ReliquiaIcon reliquia={reliquia} locked={!unlocked} size="md" />
      <div>
        <p
          className="text-[12px] leading-tight"
          style={{
            fontFamily: 'Cinzel, serif',
            color: unlocked ? '#F2EDE4' : 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          {reliquia.name}
        </p>
        <p
          className="text-[9px] uppercase tracking-[0.12em] mt-1"
          style={{ color: rarity.color, fontFamily: 'Poppins, sans-serif' }}
        >
          {rarity.label}
          {equipped && ' · equipada'}
        </p>
      </div>
    </div>
  )

  if (!onClick) return body
  return (
    <button type="button" onClick={onClick} className="block w-full">
      {body}
    </button>
  )
}
