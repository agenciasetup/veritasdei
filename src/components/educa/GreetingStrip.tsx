'use client'

/**
 * GreetingStrip — faixa de saudação enxuta no topo da dashboard /educa.
 *
 * Substitui o card de perfil inteiro (avatar grande + nome + stats). O
 * avatar já vive no EducaTopBar; aqui ficam só a saudação editorial e dois
 * chips de status (nível + sequência) que dão contexto sem ocupar um card.
 *
 * Sem caixa: é uma faixa, não um card — quebra a monotonia de "13 caixas
 * iguais" e ancora o topo da página.
 */

import { Flame } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function GreetingStrip() {
  const { user, profile } = useAuth()
  const gami = useGamification(user?.id)

  const firstName = (profile?.name || user?.email?.split('@')[0] || '')
    .split(' ')[0]

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="min-w-0">
        <p
          className="text-[11px] lg:text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {greeting()}
        </p>
        <h1
          className="text-2xl lg:text-[32px] leading-tight truncate"
          style={{
            fontFamily: 'var(--font-elegant)',
            color: 'var(--text-1)',
            fontWeight: 500,
          }}
        >
          {firstName || 'Veritas Educa'}
        </h1>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="inline-flex items-baseline gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span
            className="text-[9px] tracking-[0.16em] uppercase"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Nível
          </span>
          <span
            className="text-base leading-none"
            style={{
              fontFamily: 'var(--font-elegant)',
              color: 'var(--accent)',
              fontWeight: 600,
            }}
          >
            {gami.level}
          </span>
        </span>

        {gami.currentStreak > 0 && (
          <span
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px]"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.25)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Flame className="w-3.5 h-3.5" />
            {gami.currentStreak}
          </span>
        )}
      </div>
    </div>
  )
}
