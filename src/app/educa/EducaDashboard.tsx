'use client'

/**
 * Dashboard do Veritas Educa — versão flat editorial unificada.
 *
 * Mobile e desktop usam EXATAMENTE os mesmos componentes. Mobile = stack
 * vertical natural; desktop = grid 12-col (max-w-[1400px]).
 *
 * Hierarquia (todas as larguras lg+):
 *   Row 1 — Hero 4:5 (4)  +  ContinueHeroCard com banner (8)        ← destaque
 *   Row 2 — Rosário (4)   +  Liturgia (4)        +  Magistério (4)
 *   Row 3 — Estudo (4)    +  Debate (4)          +  Sequência (4)
 *   Row 4 — Selos (4)     +  Sua rede hoje (4)   +  Grupos (4)
 *   Row 5 — Pessoas pra seguir (12)
 *   Row 6 — CTA Assine (12, só free)
 *
 * Visual: superfícies sólidas em --surface-2, bordas 5% branco, dourado
 * só em acentos (números, barras, "Continuar →"). Tipografia serifa nos
 * títulos. Sem gradientes, sem eyebrows ALL CAPS.
 */

import Link from 'next/link'
import { ArrowRight, BookOpen, Lock, Sparkles, Swords } from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import LevelHeroExpanded from '@/components/educa/LevelHeroExpanded'
import DailyCheckin from '@/components/educa/DailyCheckin'
import ContinueHeroCard from '@/components/educa/ContinueHeroCard'
import DashboardLiturgiaCard from '@/components/educa/DashboardLiturgiaCard'
import DashboardSelosStrip from '@/components/educa/DashboardSelosStrip'
import DashboardGruposStrip from '@/components/educa/DashboardGruposStrip'
import RosarioDoDiaCard from '@/components/educa/RosarioDoDiaCard'
import FriendsSuggestionsCard from '@/components/educa/FriendsSuggestionsCard'
import FriendsActivityCard from '@/components/educa/FriendsActivityCard'

const SHELL_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid rgba(255,255,255,0.05)',
}

export default function EducaDashboard() {
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
        <div
          className="
            space-y-3
            md:space-y-4
            lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5
          "
        >
          {/* Row 1: Hero 4:5 + ContinueHero (mesma altura no desktop) */}
          <div className="lg:col-span-4">
            <LevelHeroExpanded />
          </div>
          <div className="lg:col-span-8">
            <ContinueHeroCard />
          </div>

          {/* Row 2: Rosário + Liturgia + Magistério */}
          <div className="lg:col-span-4">
            <RosarioDoDiaCard />
          </div>
          <div className="lg:col-span-4">
            <DashboardLiturgiaCard />
          </div>
          <div className="lg:col-span-4">
            <MagisterioCard />
          </div>

          {/* Row 3: Estudo + Debate + Sequência */}
          <div className="lg:col-span-4">
            <EstudoCard />
          </div>
          <div className="lg:col-span-4">
            <DebateCard />
          </div>
          <div className="lg:col-span-4">
            <DailyCheckin />
          </div>

          {/* Row 4: Selos + Rede + Grupos */}
          <div className="lg:col-span-4">
            <DashboardSelosStrip />
          </div>
          <div className="lg:col-span-4">
            <FriendsActivityCard />
          </div>
          <div className="lg:col-span-4">
            <DashboardGruposStrip />
          </div>

          {/* Row 5: Pessoas pra seguir */}
          <div className="lg:col-span-12">
            <FriendsSuggestionsCard />
          </div>

          {/* Row 6: CTA Assine (só free) */}
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
 * Cards locais flat. Estrutura idêntica entre eles pra manter ritmo.
 * ──────────────────────────────────────────────────────────────────────── */

function NavCard({
  href,
  icon,
  title,
  hint,
}: {
  href: string
  icon: React.ReactNode
  title: string
  hint?: string
}) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-[24px] p-6 transition-colors hover:bg-white/[0.01]"
      style={{ ...SHELL_STYLE, minHeight: 160 }}
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
        className="text-lg mt-3 leading-tight"
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
          className="text-xs mt-1"
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
    <NavCard
      href="/educa/estudo"
      icon={
        <BookOpen
          className="w-5 h-5"
          style={{ color: 'var(--accent)' }}
          strokeWidth={1.6}
        />
      }
      title="Estudo"
      hint="Trilhas, pilares e provas"
    />
  )
}

function DebateCard() {
  return (
    <NavCard
      href="/educa/debate"
      icon={
        <Swords
          className="w-5 h-5"
          style={{ color: 'var(--accent)' }}
          strokeWidth={1.6}
        />
      }
      title="Modo Debate"
      hint="Treine apologética com IA"
    />
  )
}

function MagisterioCard() {
  return (
    <NavCard
      href="/educa/magisterio"
      icon={
        <Sparkles
          className="w-5 h-5"
          style={{ color: 'var(--accent)' }}
          strokeWidth={1.6}
        />
      }
      title="Magistério"
      hint="Pergunte à IA católica"
    />
  )
}

function AssineCard() {
  return (
    <Link
      href="/educa/assine"
      className="block rounded-[24px] p-6 transition-colors"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(201,168,76,0.2)',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
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
            className="text-lg leading-tight"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            Assine o Veritas Educa
          </p>
          <p
            className="text-xs mt-1"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Trilhas completas, quizzes e IA católica liberados.
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 text-sm flex-shrink-0"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
        >
          Ver planos
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  )
}
