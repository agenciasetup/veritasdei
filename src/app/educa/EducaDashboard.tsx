'use client'

/**
 * Dashboard do Veritas Educa.
 *
 * Estrutura (de cima pra baixo):
 *   1. LevelHero         — avatar + nível atual→próximo + barra dourada
 *   2. DailyCheckin      — 7 gemas da semana, hoje destacado
 *   3. EducaSearch       — "Pergunte ao Magistério" (IA)
 *   4. Continue de onde parou  — só se houver histórico
 *   5. Estudo (atalho)   — leva ao hub /educa/estudo
 *   6. Modo Debate       — card destaque vinho
 *   7. CTA Assine        — só se !isPremium
 *
 * Estética sacra: dourado (--accent), vinho (--wine*), preto, off-white.
 * Hrefs internos sempre vão pra /educa/* ou /estudo/* (que está na
 * whitelist do middleware educa).
 */

import Link from 'next/link'
import { ArrowRight, BookOpen, Lock, NotebookPen, Swords } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLastStudied } from '@/lib/content/useLastStudied'
import { useSubscription } from '@/contexts/SubscriptionContext'
import LevelHero from '@/components/educa/LevelHero'
import DailyCheckin from '@/components/educa/DailyCheckin'
import EducaSearch from './EducaSearch'

export default function EducaDashboard() {
  const { user } = useAuth()
  const { last: lastStudied } = useLastStudied(user?.id)
  const { isPremium, loading: subLoading } = useSubscription()

  return (
    <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 md:py-8 space-y-4">
      {/* 1. LevelHero */}
      <LevelHero />

      {/* 2. Sequência diária */}
      <DailyCheckin />

      {/* 3. Pergunte ao Magistério (IA) */}
      <EducaSearch />

      {/* 4. Continue de onde parou (se houver) */}
      {lastStudied && (
        <Link
          href={`/estudo/${lastStudied.groupSlug}`}
          className="block rounded-2xl p-4 active:scale-[0.99] transition-transform"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-1)',
              }}
            >
              <NotebookPen
                className="w-5 h-5"
                style={{ color: 'var(--accent)' }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] tracking-[0.15em] uppercase mb-0.5"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Continue de onde parou
              </p>
              <p
                className="text-sm truncate"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {lastStudied.subtopicTitle}
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {lastStudied.groupTitle}
              </p>
            </div>
            <ArrowRight
              className="w-4 h-4 flex-shrink-0 self-center"
              style={{ color: 'var(--text-3)' }}
            />
          </div>
        </Link>
      )}

      {/* 5. Estudo (atalho pro hub) */}
      <Link
        href="/educa/estudo"
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
            <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium mb-0.5"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            >
              Estudo
            </p>
            <p
              className="text-xs"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Trilhas, pilares, provas, selos e grupos.
            </p>
          </div>
          <ArrowRight
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--text-3)' }}
          />
        </div>
      </Link>

      {/* 6. Modo Debate — destaque com gradient vinho→preto (sacral) */}
      <Link
        href="/educa/debate"
        className="block rounded-2xl p-4 active:scale-[0.99] transition-transform"
        style={{
          background:
            'linear-gradient(135deg, #5A1625 0%, #2a0f15 60%, var(--surface-2) 100%)',
          border: '1px solid color-mix(in srgb, var(--wine-light) 35%, transparent)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
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
              style={{
                color: 'color-mix(in srgb, var(--text-1) 70%, transparent)',
                fontFamily: 'var(--font-body)',
              }}
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

      {/* 7. CTA pra assinar (só se ainda não tem plano) */}
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
