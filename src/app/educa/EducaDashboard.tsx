'use client'

/**
 * Dashboard do Veritas Educa — versão flat editorial.
 *
 * Mobile (< lg): coluna única, blocos compactos individuais.
 *
 * Desktop (lg+): grid 12-col até max-w-[1400px].
 *   Row 1 — Hero 4:5 (col-span-4)  +  TodayStack (col-span-8)
 *   Row 2 — Estudo · Debate · Magistério · Sequência  (4 × col-3)
 *   Row 3 — Selos (4) · Sua rede hoje (4) · Grupos (4)
 *   Row 4 — Pessoas pra seguir  (col-span-12)
 *   Row 5 — CTA Assine (só free)  (col-span-12)
 *
 * Direção visual: superfícies sólidas (sem gradient/glass), bordas 5%
 * branco, dourado só em números / sublinhe / "Retomar →". Sem eyebrows
 * ALL CAPS gritando. Tipografia serifa pra hierarquia. HubSpot Kit
 * filtrado pelo léxico sacro.
 */

import Link from 'next/link'
import { ArrowRight, BookOpen, Lock, Sparkles, Swords } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLastStudied } from '@/lib/content/useLastStudied'
import { useSubscription } from '@/contexts/SubscriptionContext'
import LevelHeroExpanded from '@/components/educa/LevelHeroExpanded'
import DailyCheckin from '@/components/educa/DailyCheckin'
import TodayStack from '@/components/educa/TodayStack'
import DashboardLiturgiaCard from '@/components/educa/DashboardLiturgiaCard'
import DashboardSelosStrip from '@/components/educa/DashboardSelosStrip'
import DashboardGruposStrip from '@/components/educa/DashboardGruposStrip'
import RosarioDoDiaCard from '@/components/educa/RosarioDoDiaCard'
import ContinueDeOndeParouCard from '@/components/educa/ContinueDeOndeParouCard'
import FriendsSuggestionsCard from '@/components/educa/FriendsSuggestionsCard'
import FriendsActivityCard from '@/components/educa/FriendsActivityCard'

export default function EducaDashboard() {
  const { user } = useAuth()
  const { last: lastStudied } = useLastStudied(user?.id)
  const { isPremium, loading: subLoading } = useSubscription()

  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'var(--surface-1)' }}
    >
      <main
        className="
          max-w-2xl mx-auto px-4 pt-5 pb-28
          md:py-10
          lg:max-w-[1400px] lg:px-8 lg:pt-10 lg:pb-16
        "
      >
        {/* MOBILE — flow vertical natural */}
        <div className="lg:hidden space-y-3 md:space-y-4">
          <LevelHeroExpanded />
          <RosarioDoDiaCard />
          <DashboardLiturgiaCard />
          {lastStudied && <ContinueDeOndeParouCard lastStudied={lastStudied} />}
          <MagisterioCard />
          <DailyCheckin />
          <div className="grid grid-cols-2 gap-3">
            <EstudoCard />
            <DebateCard />
          </div>
          <DashboardSelosStrip />
          <FriendsActivityCard />
          <FriendsSuggestionsCard />
          <DashboardGruposStrip />
          {!subLoading && !isPremium && <AssineCard />}
        </div>

        {/* DESKTOP — grid editorial flat */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-5">
          {/* Row 1: Hero 4:5 + Stack de ações */}
          <div className="lg:col-span-4">
            <LevelHeroExpanded />
          </div>
          <div className="lg:col-span-8">
            <TodayStack />
          </div>

          {/* Row 2: 4 cards de navegação iguais */}
          <div className="lg:col-span-3">
            <EstudoCard />
          </div>
          <div className="lg:col-span-3">
            <DebateCard />
          </div>
          <div className="lg:col-span-3">
            <MagisterioCard />
          </div>
          <div className="lg:col-span-3">
            <DailyCheckin />
          </div>

          {/* Row 3: Selos, Rede, Grupos */}
          <div className="lg:col-span-4">
            <DashboardSelosStrip />
          </div>
          <div className="lg:col-span-4">
            <FriendsActivityCard />
          </div>
          <div className="lg:col-span-4">
            <DashboardGruposStrip />
          </div>

          {/* Row 4: Sugestões */}
          <div className="lg:col-span-12">
            <FriendsSuggestionsCard />
          </div>

          {/* Row 5: CTA */}
          {!subLoading && !isPremium && (
            <div className="lg:col-span-12">
              <AssineCard />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────
 * Cards locais (flat) — extraídos do antigo grid pra reuso entre mobile e
 * desktop, sem o caos de imports condicionais. Cada um é um <Link> com
 * superfície sólida + borda 5%. Sem gradientes nem eyebrows.
 * ──────────────────────────────────────────────────────────────────────── */

function FlatNavCard({
  href,
  icon,
  title,
  hint,
  accent = false,
}: {
  href: string
  icon: React.ReactNode
  title: string
  hint?: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-[24px] p-5 transition-colors hover:bg-white/[0.01]"
      style={{
        background: accent ? 'rgba(139,36,53,0.18)' : 'var(--surface-2)',
        border: '1px solid rgba(255,255,255,0.05)',
        minHeight: 140,
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {icon}
      </div>
      <p
        className="text-base mt-3 leading-tight"
        style={{
          color: 'var(--text-1)',
          fontFamily: 'var(--font-elegant)',
          fontWeight: 500,
        }}
      >
        {title}
      </p>
      {hint && (
        <p
          className="text-[11px] mt-0.5"
          style={{
            color: 'var(--text-3)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {hint}
        </p>
      )}
      <ArrowRight
        className="w-4 h-4 mt-auto self-end"
        style={{ color: 'var(--accent)' }}
      />
    </Link>
  )
}

function EstudoCard() {
  return (
    <FlatNavCard
      href="/educa/estudo"
      icon={<BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} strokeWidth={1.6} />}
      title="Estudo"
    />
  )
}

function DebateCard() {
  return (
    <FlatNavCard
      href="/educa/debate"
      icon={<Swords className="w-5 h-5" style={{ color: 'var(--accent)' }} strokeWidth={1.6} />}
      title="Modo Debate"
      accent
    />
  )
}

function MagisterioCard() {
  return (
    <FlatNavCard
      href="/educa/magisterio"
      icon={<Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} strokeWidth={1.6} />}
      title="Magistério"
      hint="Pergunte à IA católica"
    />
  )
}

function AssineCard() {
  return (
    <Link
      href="/educa/assine"
      className="block rounded-[24px] p-5 transition-colors"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(201,168,76,0.25)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Lock
            className="w-4 h-4"
            style={{ color: 'var(--accent)' }}
            strokeWidth={1.6}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-base"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            Assine o Veritas Educa
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Trilhas completas, quizzes e IA católica liberados.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 text-[12px]"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
        >
          Ver
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  )
}
