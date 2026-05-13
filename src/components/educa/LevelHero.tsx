'use client'

/**
 * LevelHero — bloco do topo do /educa.
 *
 * Variante premium: avatar com aura dourada, saudação + nome, level pill
 * à direita, barra fina de XP embaixo. Mais compacto que a versão
 * anterior — pra deixar o dashboard hierárquico em vez de "lista de
 * cards do mesmo tamanho".
 *
 * Glassmorphism via <GlassCard>.
 */

import { Sparkles, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'
import GlassCard from './GlassCard'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function LevelHero() {
  const { user, profile } = useAuth()
  const gami = useGamification(user?.id)

  const avatarUrl = profile?.profile_image_url
  const firstName = (profile?.name || user?.email?.split('@')[0] || '')
    .split(' ')[0]
  const equipped = gami.equippedReliquia

  return (
    <GlassCard variant="gold" padded>
      {/* Topo: avatar + saudação + level pill */}
      <div className="flex items-center gap-3 md:gap-4">
        <div
          className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1.5px solid var(--accent)',
            boxShadow:
              '0 0 24px color-mix(in srgb, var(--accent) 38%, transparent)',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <User
              className="w-7 h-7 md:w-8 md:h-8"
              style={{ color: 'var(--text-3)' }}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-[10px] tracking-[0.22em] uppercase mb-0.5"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
              opacity: 0.85,
            }}
          >
            {greeting()}
          </p>
          <h1
            className="text-xl md:text-2xl truncate leading-tight"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
            }}
          >
            {firstName ? `Olá, ${firstName}` : 'Veritas Educa'}
          </h1>
        </div>

        {/* Level pill */}
        <div
          className="flex flex-col items-end flex-shrink-0"
          style={{ minWidth: 64 }}
        >
          <div
            className="px-3 py-1.5 rounded-full inline-flex items-baseline gap-1"
            style={{
              background:
                'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
              color: 'var(--accent-contrast)',
              boxShadow:
                '0 4px 12px -4px color-mix(in srgb, var(--accent) 50%, transparent)',
            }}
          >
            <span
              className="text-[9px] tracking-[0.18em] uppercase opacity-80"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              NV
            </span>
            <span
              className="text-sm font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {gami.level}
            </span>
          </div>
          <p
            className="text-[10px] mt-1"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {gami.totalXp} XP
          </p>
        </div>
      </div>

      {/* Barra de XP fina premium */}
      <div className="mt-4">
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(242,237,228,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${gami.percentInLevel}%`,
              background:
                'linear-gradient(90deg, color-mix(in srgb, var(--accent) 80%, black) 0%, #E5C97A 50%, var(--accent) 100%)',
              boxShadow:
                '0 0 10px color-mix(in srgb, var(--accent) 60%, transparent)',
            }}
          />
        </div>
        <div
          className="flex items-center justify-between mt-1.5 text-[10px]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <span>{gami.xpInLevel} / 100 XP</span>
          {equipped ? (
            <span className="inline-flex items-center gap-1 truncate max-w-[10rem]"
              style={{ color: 'var(--accent)' }}
              title={equipped.name}
            >
              <Sparkles className="w-3 h-3" />
              {equipped.name}
            </span>
          ) : (
            <span>{gami.xpToNextLevel} até Nv {gami.level + 1}</span>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
