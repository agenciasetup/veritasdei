'use client'

/**
 * Dashboard do Veritas Educa — versão premium app-native.
 *
 * Hierarquia (mobile-first, generosa em ar):
 *   1. LevelHero        — saudação + level + XP (glass dourado)
 *   2. DailyCheckin     — 7 dias compacto (glass inset)
 *   3. EducaSearch      — Pergunte ao Magistério (glass)
 *   4. Continue card    — card horizontal com thumb (se houver progresso)
 *   5. Grid 2 colunas   — Estudo + Modo Debate (glass + variant wine)
 *   6. CTA Assine       — só pra free, glass dourado discreto
 *
 * Glass via <GlassCard> em todos os blocos. Sem mais "lista de cards
 * full-width amontoados".
 */

import Link from 'next/link'
import { ArrowRight, BookOpen, Lock, NotebookPen, Search, Sparkles, Swords } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLastStudied } from '@/lib/content/useLastStudied'
import { useSubscription } from '@/contexts/SubscriptionContext'
import LevelHero from '@/components/educa/LevelHero'
import DailyCheckin from '@/components/educa/DailyCheckin'
import GlassCard from '@/components/educa/GlassCard'

export default function EducaDashboard() {
  const { user } = useAuth()
  const { last: lastStudied } = useLastStudied(user?.id)
  const { isPremium, loading: subLoading } = useSubscription()

  return (
    <div
      className="relative min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse 600px 400px at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%), radial-gradient(ellipse 400px 300px at 90% 30%, color-mix(in srgb, var(--wine) 12%, transparent), transparent 70%), var(--surface-1)',
      }}
    >
      <main className="max-w-2xl mx-auto px-4 pt-5 pb-28 md:py-10 space-y-3 md:space-y-4">
        {/* 1. Saudação + Level */}
        <LevelHero />

        {/* 2. Sequência diária */}
        <DailyCheckin />

        {/* 3. Pergunte ao Magistério — atalho pra página dedicada
             (antes era inline; ficava espremido com a resposta longa). */}
        <Link href="/educa/magisterio" className="block">
          <GlassCard variant="default" padded interactive>
            <div className="flex items-center gap-3 md:gap-4">
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative"
                style={{
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--accent) 32%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.5) 100%)',
                  border:
                    '1px solid color-mix(in srgb, var(--accent) 45%, transparent)',
                  boxShadow:
                    '0 0 18px color-mix(in srgb, var(--accent) 28%, transparent)',
                }}
              >
                <Sparkles
                  className="w-5 h-5 md:w-6 md:h-6"
                  style={{ color: 'var(--accent)' }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[10px] tracking-[0.2em] uppercase mb-0.5"
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  IA Católica
                </p>
                <p
                  className="text-sm md:text-base font-medium"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Pergunte ao Magistério
                </p>
                <p
                  className="text-[11px] mt-0.5 truncate flex items-center gap-1"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <Search className="w-3 h-3" />
                  Bíblia, Magistério e Padres da Igreja
                </p>
              </div>
              <ArrowRight
                className="w-4 h-4 flex-shrink-0"
                style={{ color: 'var(--accent)' }}
              />
            </div>
          </GlassCard>
        </Link>

        {/* 4. Continue de onde parou */}
        {lastStudied && (
          <Link
            href={`/estudo/${lastStudied.groupSlug}`}
            className="block"
          >
            <GlassCard variant="default" padded interactive>
              <div className="flex items-start gap-3 md:gap-4">
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      'linear-gradient(135deg, color-mix(in srgb, var(--accent) 28%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.5) 100%)',
                    border:
                      '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                  }}
                >
                  <NotebookPen
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[10px] tracking-[0.2em] uppercase mb-1"
                    style={{
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-display)',
                      opacity: 0.85,
                    }}
                  >
                    Continue de onde parou
                  </p>
                  <p
                    className="text-sm md:text-base font-medium truncate"
                    style={{
                      color: 'var(--text-1)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {lastStudied.subtopicTitle}
                  </p>
                  <p
                    className="text-[11px] mt-0.5 truncate"
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
                  style={{ color: 'var(--accent)' }}
                />
              </div>
            </GlassCard>
          </Link>
        )}

        {/* 5. Grid 2 colunas: Estudo + Debate */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Link href="/educa/estudo" className="block h-full">
            <GlassCard variant="default" interactive className="h-full">
              <div className="p-4 md:p-5 h-full flex flex-col">
                <div
                  className="w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background:
                      'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, rgba(0,0,0,0.3)) 0%, rgba(0,0,0,0.45) 100%)',
                    border:
                      '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                  }}
                >
                  <BookOpen
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
                <p
                  className="text-sm md:text-base font-medium mb-0.5"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Estudo
                </p>
                <p
                  className="text-[11px] leading-snug"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Trilhas, pilares, provas e selos.
                </p>
                <ArrowRight
                  className="w-4 h-4 mt-auto self-end"
                  style={{ color: 'var(--accent)' }}
                />
              </div>
            </GlassCard>
          </Link>

          <Link href="/educa/debate" className="block h-full">
            <GlassCard variant="wine" interactive className="h-full">
              <div className="p-4 md:p-5 h-full flex flex-col">
                <div
                  className="w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, color-mix(in srgb, var(--wine) 40%, rgba(0,0,0,0.4)) 100%)',
                    border:
                      '1px solid color-mix(in srgb, var(--accent) 28%, transparent)',
                  }}
                >
                  <Swords
                    className="w-5 h-5 md:w-6 md:h-6"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
                <p
                  className="text-sm md:text-base font-medium mb-0.5"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Modo Debate
                </p>
                <p
                  className="text-[11px] leading-snug"
                  style={{
                    color: 'var(--text-2)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Treine apologética contra objeções.
                </p>
                <ArrowRight
                  className="w-4 h-4 mt-auto self-end"
                  style={{ color: 'var(--accent)' }}
                />
              </div>
            </GlassCard>
          </Link>
        </div>

        {/* 6. CTA Assine — só se ainda não tem plano */}
        {!subLoading && !isPremium && (
          <Link href="/educa/assine" className="block">
            <GlassCard variant="gold" padded interactive>
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
                    className="text-[11px] mt-0.5"
                    style={{
                      color: 'var(--text-2)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Desbloqueie trilhas, quizzes e a IA católica.
                  </p>
                </div>
                <ArrowRight
                  className="w-4 h-4"
                  style={{ color: 'var(--accent)' }}
                />
              </div>
            </GlassCard>
          </Link>
        )}
      </main>
    </div>
  )
}
