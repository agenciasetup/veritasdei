'use client'

import { Sparkles, TrendingUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'
import LevelAvatar from './LevelAvatar'
import XpBar from './XpBar'
import EquippedReliquiaChip from './EquippedReliquiaChip'

/**
 * Hero gamificado do /mapa — coração visual da jornada.
 * "Nível 15" grande, avatar com moldura pelo tier, barra de XP e relíquia
 * equipada logo abaixo.
 */
export default function JourneyHero() {
  const { user, profile } = useAuth()
  const g = useGamification(user?.id)

  if (!user) return null

  const initial = (profile?.name?.[0] ?? '✝').toUpperCase()

  return (
    <div
      className="relative rounded-3xl p-5 md:p-6 fade-in overflow-hidden"
      style={{
        background:
          `linear-gradient(135deg, ${g.tier.color}14 0%, rgba(20,18,14,0.7) 60%, rgba(20,18,14,0.9) 100%)`,
        border: `1px solid ${g.tier.color}33`,
        backdropFilter: 'blur(14px)',
        animationDelay: '0.1s',
      }}
    >
      {/* Glow sutil atrás do avatar */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: -40,
          top: -40,
          width: 220,
          height: 220,
          background: `radial-gradient(circle, ${g.tier.glow}, transparent 70%)`,
        }}
      />

      <div className="relative flex items-center gap-4 md:gap-6">
        <LevelAvatar
          src={profile?.profile_image_url}
          fallback={initial}
          level={g.level}
          size={88}
          showLevelBadge={false}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles
              className="w-3.5 h-3.5"
              style={{ color: g.tier.color }}
              strokeWidth={1.6}
            />
            <span
              className="text-[10px] tracking-[0.22em] uppercase"
              style={{
                fontFamily: 'Cinzel, serif',
                color: g.tier.color,
              }}
            >
              Sua Jornada
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span
              className="text-4xl md:text-5xl leading-none"
              style={{
                fontFamily: 'Cinzel, serif',
                color: '#F2EDE4',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              {g.level}
            </span>
            <span
              className="text-xs uppercase tracking-[0.18em]"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Nível
            </span>
            <span
              className="ml-auto inline-flex items-center gap-1 text-[11px]"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <TrendingUp className="w-3 h-3" />
              {g.totalXp} XP
            </span>
          </div>

          <XpBar
            level={g.level}
            xpInLevel={g.xpInLevel}
            xpToNextLevel={g.xpToNextLevel}
            percentInLevel={g.percentInLevel}
            size="md"
          />

          {g.equippedReliquia && (
            <div className="mt-3">
              <EquippedReliquiaChip reliquia={g.equippedReliquia} size="sm" showName />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
