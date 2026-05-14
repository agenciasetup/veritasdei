'use client'

/**
 * Dashboard do Veritas Educa — redesenho por zonas (UX).
 *
 * Antes: 13 cards de peso visual idêntico, mobile = web empilhado inteiro.
 * Agora: layouts DEDICADOS (desktop x mobile) organizados em 4 zonas com
 * hierarquia clara.
 *
 *   ZONA 1 — HOJE        → Continuar + bloco "Hoje" (missão/sequência/XP)
 *   ZONA 2 — ESTUDAR     → Trilhas (pilares) + ferramentas + devocional
 *   ZONA 3 — COMUNIDADE  → módulo único + convite
 *   + Conversão          → Assine (só free)
 *
 * Desktop: grid 12-col (max-w-[1400px]). Mobile: stack curto e priorizado
 * — corta o que não serve numa sessão de celular (selos cheios, lista de
 * mistérios, sugestões de seguir).
 *
 * Visual: superfícies sólidas em --surface-2, bordas 5% branco, dourado
 * só em acentos. Tipografia serifa nos títulos.
 */

import Link from 'next/link'
import { ArrowRight, Lock, Sparkles, Swords } from 'lucide-react'
import { useSubscription } from '@/contexts/SubscriptionContext'
import GreetingStrip from '@/components/educa/GreetingStrip'
import TodayCard from '@/components/educa/TodayCard'
import ContinueHeroCard from '@/components/educa/ContinueHeroCard'
import TrilhasProgressCard from '@/components/educa/TrilhasProgressCard'
import RosarioDoDiaCard from '@/components/educa/RosarioDoDiaCard'
import DashboardLiturgiaCard from '@/components/educa/DashboardLiturgiaCard'
import DashboardCartasStrip from '@/components/educa/DashboardCartasStrip'
import CommunityModule from '@/components/educa/CommunityModule'
import InviteCard from '@/components/educa/InviteCard'

const SHELL_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid rgba(255,255,255,0.05)',
}

export default function EducaDashboard() {
  const { isPremium, loading: subLoading } = useSubscription()
  const showAssine = !subLoading && !isPremium

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--surface-1)' }}>
      {/* ───────────── MOBILE ───────────── */}
      <main className="lg:hidden max-w-2xl mx-auto px-4 pt-5 pb-28 space-y-4">
        <GreetingStrip />
        <ContinueHeroCard />
        <TodayCard />
        <TrilhasProgressCard compact />

        <div className="grid grid-cols-2 gap-3">
          <RosarioDoDiaCard compact />
          <DashboardLiturgiaCard compact />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MagisterioCard compact />
          <DebateCard compact />
        </div>

        <CommunityModule compact />
        <InviteCard compact />

        {showAssine && <AssineCard />}
      </main>

      {/* ───────────── DESKTOP ───────────── */}
      <main className="hidden lg:block max-w-[1400px] mx-auto px-8 pt-8 pb-16">
        <GreetingStrip />

        <div className="mt-6 grid grid-cols-12 gap-5">
          {/* Zona 1 — Hoje */}
          <div className="col-span-8">
            <ContinueHeroCard />
          </div>
          <div className="col-span-4">
            <TodayCard />
          </div>

          {/* Zona 2 — Estudar */}
          <div className="col-span-8">
            <TrilhasProgressCard />
          </div>
          <div className="col-span-4 flex flex-col gap-5">
            <RosarioDoDiaCard compact />
            <DashboardLiturgiaCard compact />
          </div>

          <div className="col-span-4">
            <MagisterioCard />
          </div>
          <div className="col-span-4">
            <DebateCard />
          </div>
          <div className="col-span-4">
            <DashboardCartasStrip />
          </div>

          {/* Zona 3 — Comunidade */}
          <div className="col-span-8">
            <CommunityModule />
          </div>
          <div className="col-span-4">
            <InviteCard />
          </div>

          {/* Conversão */}
          {showAssine && (
            <div className="col-span-12">
              <AssineCard />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────
 * Cards de navegação locais (ferramentas de estudo).
 * ──────────────────────────────────────────────────────────────────────── */

function NavCard({
  href,
  icon,
  title,
  hint,
  compact = false,
}: {
  href: string
  icon: React.ReactNode
  title: string
  hint?: string
  compact?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-[24px] p-5 lg:p-6 transition-colors hover:bg-white/[0.01]"
      style={{ ...SHELL_STYLE, minHeight: compact ? 0 : 150 }}
    >
      <div
        className="w-10 h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {icon}
      </div>
      <p
        className="text-base lg:text-lg mt-3 leading-tight"
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
          className="text-[11px] lg:text-xs mt-1"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {hint}
        </p>
      )}
      <ArrowRight
        className="w-4 h-4 mt-auto pt-3 self-end"
        style={{ color: 'var(--accent)' }}
      />
    </Link>
  )
}

function MagisterioCard({ compact = false }: { compact?: boolean }) {
  return (
    <NavCard
      href="/educa/magisterio"
      compact={compact}
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

function DebateCard({ compact = false }: { compact?: boolean }) {
  return (
    <NavCard
      href="/educa/debate"
      compact={compact}
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
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
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
