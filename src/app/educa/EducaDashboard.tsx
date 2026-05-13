'use client'

/**
 * Dashboard do Veritas Educa — versão minimal.
 *
 * 5 seções, todos hrefs apontam pra dentro de /educa/*:
 *   1. Header        — saudação + LevelBadge + XpBar + streak
 *   2. EducaSearch   — "Pergunte ao Magistério" (IA)
 *   3. Modo Debate   — card destaque → /educa/debate
 *   4. Trilhas       — atalho → /educa/trilhas
 *   5. CTA Assine    — só se !isPremium → /educa/assine
 *
 * Sem "Continue de onde parou", "Pilares" e "Provas recentes" — esses
 * dados de progresso vivem em /educa/perfil (XP, streak) e /educa/trilhas
 * (continue de onde parou dentro da trilha). O dashboard fica focado em
 * "começar agora", não em histórico.
 */

import Link from 'next/link'
import { ArrowRight, Flame, GraduationCap, Lock, Swords } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'
import { useSubscription } from '@/contexts/SubscriptionContext'
import LevelBadge from '@/components/gamification/LevelBadge'
import XpBar from '@/components/gamification/XpBar'
import EducaSearch from './EducaSearch'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function EducaDashboard() {
  const { user, profile } = useAuth()
  const gami = useGamification(user?.id)
  const { isPremium, loading: subLoading } = useSubscription()

  const firstName = (profile?.name || user?.email?.split('@')[0] || '')
    .split(' ')[0]

  return (
    <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 md:py-8 space-y-4">
      {/* 1. Header — saudação + XP + streak */}
      <header
        className="rounded-3xl p-5 md:p-6"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p
              className="text-xs tracking-[0.15em] uppercase mb-1"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
            >
              {greeting()}
            </p>
            <h1
              className="text-2xl md:text-3xl truncate"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
            >
              {firstName ? `Olá, ${firstName}` : 'Veritas Educa'}
            </h1>
          </div>
          <LevelBadge level={gami.level} size="md" showLabel />
        </div>

        <XpBar
          level={gami.level}
          xpInLevel={gami.xpInLevel}
          xpToNextLevel={gami.xpToNextLevel}
          percentInLevel={gami.percentInLevel}
          size="md"
          showLabels
        />

        <div
          className="flex items-center justify-between mt-3 text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <span className="flex items-center gap-1.5">
            <Flame
              className="w-3.5 h-3.5"
              style={{
                color: gami.currentStreak > 0 ? 'var(--accent)' : 'var(--text-3)',
              }}
            />
            {gami.currentStreak > 0
              ? `${gami.currentStreak} dia${gami.currentStreak === 1 ? '' : 's'} seguidos`
              : 'Estude hoje pra começar uma sequência'}
          </span>
          <span>{gami.totalXp} XP</span>
        </div>
      </header>

      {/* 2. Pergunte ao Magistério (IA) */}
      <EducaSearch />

      {/* 3. Modo Debate — destaque */}
      <Link
        href="/educa/debate"
        className="block rounded-2xl p-4 active:scale-[0.99] transition-transform"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, var(--surface-2)) 0%, var(--surface-2) 100%)',
          border: '1px solid color-mix(in srgb, var(--accent) 28%, transparent)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-1)',
            }}
          >
            <Swords className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium mb-0.5"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            >
              Modo Debate — treine sua apologética
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
            >
              Sola Scriptura, Maria, Eucaristia, Papado, Sola Fide.
            </p>
          </div>
          <ArrowRight
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--accent)' }}
          />
        </div>
      </Link>

      {/* 4. Trilhas */}
      <Link
        href="/educa/trilhas"
        className="block rounded-2xl p-4 active:scale-[0.99] transition-transform"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-1)',
            }}
          >
            <GraduationCap
              className="w-5 h-5"
              style={{ color: 'var(--accent)' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium mb-0.5"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            >
              Trilhas de estudo
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Católico iniciante, Apologética, Pais da Igreja e mais.
            </p>
          </div>
          <ArrowRight
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--text-3)' }}
          />
        </div>
      </Link>

      {/* 5. CTA pra assinar (só se ainda não tem plano) */}
      {!subLoading && !isPremium && (
        <Link
          href="/educa/assine"
          className="block rounded-2xl p-4"
          style={{
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            border:
              '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          }}
        >
          <div className="flex items-center gap-3">
            <Lock
              className="w-5 h-5 flex-shrink-0"
              style={{ color: 'var(--accent)' }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Assine o Veritas Educa
              </p>
              <p
                className="text-xs mt-0.5"
                style={{
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Desbloqueie todas as trilhas, quizzes e a IA católica.
              </p>
            </div>
            <ArrowRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
        </Link>
      )}
    </main>
  )
}
