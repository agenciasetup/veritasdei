'use client'

/**
 * LevelHero — card grande de progresso de nível, estilo "VIP".
 *
 * Estética sacra: dourado + vinho sobre preto, com aura/glow no badge
 * de nível. Substitui o chip simples no header do /educa.
 *
 * Mostra:
 *  - Avatar grande circular (ou ícone se sem avatar)
 *  - Saudação + nome
 *  - Nível atual → Nível seguinte (com barra de XP e XP restante)
 *  - Relíquia equipada (se houver) como mini-badge ao lado
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
    <section
      className="relative rounded-3xl overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #0f0e0c 0%, #14080b 60%, #1a1410 100%)',
        border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
        boxShadow:
          '0 8px 32px -12px color-mix(in srgb, var(--accent) 30%, transparent)',
      }}
    >
      {/* Texturas decorativas — radial glow + acento vinho */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle 200px at 20% 0%, rgba(201,168,76,0.18), transparent 70%), radial-gradient(circle 160px at 100% 100%, rgba(139,49,69,0.18), transparent 70%)',
        }}
      />

      <div className="relative p-5 md:p-6">
        {/* Topo: avatar + saudação + nome */}
        <div className="flex items-center gap-3 md:gap-4 mb-5">
          <div
            className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--surface-2)',
              border: '1.5px solid var(--accent)',
              boxShadow:
                '0 0 24px color-mix(in srgb, var(--accent) 40%, transparent)',
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
                className="w-8 h-8 md:w-10 md:h-10"
                style={{ color: 'var(--text-3)' }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] md:text-xs tracking-[0.2em] uppercase mb-0.5"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {greeting()}
            </p>
            <h1
              className="text-xl md:text-2xl truncate"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-1)',
              }}
            >
              {firstName ? `Olá, ${firstName}` : 'Veritas Educa'}
            </h1>
          </div>
          {equipped && (
            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full flex-shrink-0"
              title={equipped.name}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-1)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Sparkles className="w-3 h-3" />
              <span className="text-[11px] truncate max-w-[8rem]">
                {equipped.name}
              </span>
            </div>
          )}
        </div>

        {/* Faixa de nível */}
        <div
          className="rounded-2xl p-3 md:p-4"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid var(--border-1)',
          }}
        >
          <div className="flex items-baseline justify-between mb-2">
            <p
              className="text-xs tracking-[0.15em] uppercase"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Nível {gami.level}
            </p>
            <p
              className="text-[10px] tracking-[0.15em] uppercase opacity-70"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Nível {gami.level + 1}
            </p>
          </div>

          {/* Barra de progresso com glow dourado */}
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{
              background: 'rgba(242,237,228,0.06)',
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${gami.percentInLevel}%`,
                background:
                  'linear-gradient(90deg, #C9A84C 0%, #E5C97A 50%, #C9A84C 100%)',
                boxShadow:
                  '0 0 12px color-mix(in srgb, var(--accent) 60%, transparent)',
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            <span>{gami.totalXp} XP</span>
            <span>{gami.xpToNextLevel} XP até o próximo</span>
          </div>
        </div>
      </div>
    </section>
  )
}
