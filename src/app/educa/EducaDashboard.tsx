'use client'

/**
 * Dashboard do Veritas Educa.
 *
 * Mobile (< lg): coluna única, glass cards generosos em ar.
 *
 * Desktop (lg+): grid de 12 colunas (max-w 1400px) com hierarquia:
 *   Row 1 — LevelHeroExpanded                          (12)
 *   Row 2 — Continue de onde parou (8) + Rosário (4)
 *   Row 3 — Liturgia (4) + Magistério (4) + Sequência (4)
 *   Row 4 — Estudo + Debate (sub-grid, 8) + Selos (4)
 *   Row 5 — Amigos sugeridos                          (12)
 *   Row 6 — Meus grupos                                (12)
 *   Row 7 — CTA Assine (só free)                       (12)
 *
 * Quando o usuário ainda não tem progresso (sem `lastStudied`), o card
 * "Continue" some e o Rosário promove pra col-span-12 na sua linha.
 */

import Link from 'next/link'
import { ArrowRight, BookOpen, Lock, Search, Sparkles, Swords } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLastStudied } from '@/lib/content/useLastStudied'
import { useSubscription } from '@/contexts/SubscriptionContext'
import LevelHeroExpanded from '@/components/educa/LevelHeroExpanded'
import DailyCheckin from '@/components/educa/DailyCheckin'
import GlassCard from '@/components/educa/GlassCard'
import DashboardLiturgiaCard from '@/components/educa/DashboardLiturgiaCard'
import DashboardSelosStrip from '@/components/educa/DashboardSelosStrip'
import DashboardGruposStrip from '@/components/educa/DashboardGruposStrip'
import RosarioDoDiaCard from '@/components/educa/RosarioDoDiaCard'
import ContinueDeOndeParouCard from '@/components/educa/ContinueDeOndeParouCard'
import FriendsSuggestionsCard from '@/components/educa/FriendsSuggestionsCard'

export default function EducaDashboard() {
  const { user } = useAuth()
  const { last: lastStudied } = useLastStudied(user?.id)
  const { isPremium, loading: subLoading } = useSubscription()

  return (
    <div
      className="relative min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse 800px 500px at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%), radial-gradient(ellipse 500px 400px at 90% 30%, color-mix(in srgb, var(--wine) 12%, transparent), transparent 70%), var(--surface-1)',
      }}
    >
      <main
        className="
          max-w-2xl mx-auto px-4 pt-5 pb-28
          md:py-10
          lg:max-w-[1400px] lg:px-8 lg:pt-10 lg:pb-16
        "
      >
        <div
          className="
            space-y-3
            md:space-y-4
            lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5
          "
        >
          {/* 1. Hero — mobile compacto / desktop expandido */}
          <div className="lg:col-span-12">
            <LevelHeroExpanded />
          </div>

          {/* 2. Continue de onde parou (com banner se houver) */}
          {lastStudied && (
            <div className="lg:col-span-8">
              <ContinueDeOndeParouCard lastStudied={lastStudied} />
            </div>
          )}

          {/* 3. Rosário do dia — promove pra 12 se não tem Continue */}
          <div className={lastStudied ? 'lg:col-span-4' : 'lg:col-span-12'}>
            <RosarioDoDiaCard />
          </div>

          {/* 4. Liturgia do dia */}
          <div className="lg:col-span-4">
            <DashboardLiturgiaCard />
          </div>

          {/* 5. Pergunte ao Magistério */}
          <div className="lg:col-span-4">
            <Link href="/educa/magisterio" className="block h-full">
              <GlassCard variant="default" padded interactive className="h-full">
                <div className="flex items-center gap-3 md:gap-4 h-full">
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
                      Bíblia, Magistério, Padres da Igreja
                    </p>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
              </GlassCard>
            </Link>
          </div>

          {/* 6. Sequência diária */}
          <div className="lg:col-span-4">
            <DailyCheckin />
          </div>

          {/* 7. Estudo + Modo Debate (sub-grid 2 cols) */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-3 md:gap-4 h-full">
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
          </div>

          {/* 8. Selos de devoção */}
          <div className="lg:col-span-4">
            <DashboardSelosStrip />
          </div>

          {/* 9. Amigos sugeridos (paróquia/diocese) */}
          <div className="lg:col-span-12">
            <FriendsSuggestionsCard />
          </div>

          {/* 10. Meus grupos */}
          <div className="lg:col-span-12">
            <DashboardGruposStrip />
          </div>

          {/* 11. CTA Assine */}
          {!subLoading && !isPremium && (
            <div className="lg:col-span-12">
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
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
