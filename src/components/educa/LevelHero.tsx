'use client'

/**
 * LevelHero — versão flat compacta pra mobile da dashboard /educa.
 *
 * Mantém o mesmo léxico visual da versão desktop (LevelHeroExpanded):
 * superfície sólida, bordas 5%, dourado só em acentos. Layout horizontal
 * compacto em uma linha — avatar redondo à esquerda, nome + barra XP no
 * meio, level pill à direita.
 */

import { Sparkles, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'

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
    <div
      className="rounded-[24px] p-5"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex items-center gap-3.5">
        <div
          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(201,168,76,0.4)',
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
            <User className="w-6 h-6" style={{ color: 'var(--text-3)' }} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="text-[11px]"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {greeting()}
          </p>
          <h1
            className="text-xl truncate leading-tight mt-0.5"
            style={{
              fontFamily: 'var(--font-elegant)',
              color: 'var(--text-1)',
              fontWeight: 500,
            }}
          >
            {firstName ? firstName : 'Veritas Educa'}
          </h1>
        </div>

        <div className="flex flex-col items-end flex-shrink-0">
          <div className="inline-flex items-baseline gap-1.5">
            <span
              className="text-[10px] tracking-[0.16em] uppercase"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Nv
            </span>
            <span
              className="text-2xl leading-none"
              style={{
                fontFamily: 'var(--font-elegant)',
                color: 'var(--accent)',
                fontWeight: 600,
              }}
            >
              {gami.level}
            </span>
          </div>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {gami.totalXp} XP
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(242,237,228,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${gami.percentInLevel}%`,
              background: 'var(--accent)',
            }}
          />
        </div>
        <div
          className="flex items-center justify-between mt-1.5 text-[11px]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <span>{gami.xpInLevel} / 100 XP</span>
          {equipped ? (
            <span
              className="inline-flex items-center gap-1 truncate max-w-[10rem]"
              style={{ color: 'var(--accent)' }}
              title={equipped.name}
            >
              <Sparkles className="w-3 h-3" />
              {equipped.name}
            </span>
          ) : (
            <span>{gami.xpToNextLevel} pro Nv {gami.level + 1}</span>
          )}
        </div>
      </div>
    </div>
  )
}
