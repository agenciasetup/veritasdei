'use client'

/**
 * Dashboard do Veritas Educa.
 *
 * Reusa hooks/dados existentes (sem duplicar lógica):
 *  - `useAuth`           — usuário + perfil
 *  - `useGamification`   — XP, nível, streak, relíquia equipada
 *  - `useMyStudyRecent`  — pilares, anotações, tentativas de quiz
 *  - `useSubscription`   — checa se assinatura ativa (CTA pra /educa/assine se não)
 *
 * Layout mobile-first com 7 seções verticais:
 *  1. Header  — saudação + XP/Nível + streak
 *  2. Search  — "Pergunte ao Magistério" (Verbum AI)
 *  3. Continue — último estudo + CTA
 *  4. Pilares — Bíblia/Magistério/Patrística com progresso
 *  5. Trilhas — atalhos pra /trilhas
 *  6. Provas  — últimas 3 tentativas de quiz
 *  7. Footer  — link pra assinar (se não premium) ou /perfil
 */

import Link from 'next/link'
import { BookOpen, Flame, GraduationCap, NotebookPen, Trophy, ArrowRight, Sparkles, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'
import { useMyStudyRecent } from '@/lib/study/useMyStudyRecent'
import { useSubscription } from '@/contexts/SubscriptionContext'
import LevelBadge from '@/components/gamification/LevelBadge'
import XpBar from '@/components/gamification/XpBar'
import ProgressTrack from '@/components/study/ProgressTrack'
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
  const { notes, attempts, pillars, loading } = useMyStudyRecent()
  const { isPremium, loading: subLoading } = useSubscription()

  const firstName = (profile?.name || user?.email?.split('@')[0] || '')
    .split(' ')[0]

  const lastNote = notes[0]

  return (
    <main className="max-w-3xl mx-auto px-4 pt-6 pb-24 md:py-10 space-y-5">
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

        <div className="flex items-center justify-between mt-3 text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" style={{
              color: gami.currentStreak > 0 ? 'var(--accent)' : 'var(--text-3)'
            }} />
            {gami.currentStreak > 0
              ? `${gami.currentStreak} dia${gami.currentStreak === 1 ? '' : 's'} seguidos`
              : 'Estude hoje pra começar uma sequência'}
          </span>
          <span>{gami.totalXp} XP</span>
        </div>
      </header>

      {/* 2. Pergunte ao Magistério */}
      <EducaSearch />

      {/* 3. Continue de onde parou */}
      {lastNote && (
        <ContinueCard
          contentType={lastNote.content_type}
          contentRef={lastNote.content_ref}
          updatedAt={lastNote.updated_at}
          preview={lastNote.body}
        />
      )}

      {/* 4. Progresso por pilar */}
      <section>
        <h2
          className="text-sm tracking-[0.15em] uppercase mb-3 px-1"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Pilares de estudo
        </h2>
        {loading && pillars.length === 0 ? (
          <PillarsSkeleton />
        ) : pillars.length === 0 ? (
          <EmptyState
            text="Os pilares aparecem aqui assim que o conteúdo carregar."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pillars.map((p) => {
              const percent = p.total > 0 ? Math.round((p.studied / p.total) * 100) : 0
              return (
                <Link
                  key={p.slug}
                  href={`/estudo/${p.slug}`}
                  className="rounded-2xl p-4 active:scale-[0.99] transition-transform"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-1)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
                    >
                      {p.title}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                    >
                      {percent}%
                    </span>
                  </div>
                  <ProgressTrack percent={percent} label={`${p.studied}/${p.total}`} />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* 5. Trilhas */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2
            className="text-sm tracking-[0.15em] uppercase"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
          >
            Trilhas guiadas
          </h2>
          <Link
            href="/trilhas"
            className="text-xs flex items-center gap-0.5"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
          >
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <Link
          href="/trilhas"
          className="block rounded-2xl p-4"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-1)',
              }}
            >
              <GraduationCap className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-medium mb-0.5"
                style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
              >
                Comece uma trilha de estudo
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                Católico iniciante, Apologética, Pais da Igreja e mais.
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* 6. Provas recentes */}
      {attempts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2
              className="text-sm tracking-[0.15em] uppercase flex items-center gap-2"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              <Trophy className="w-3.5 h-3.5" />
              Provas recentes
            </h2>
          </div>
          <ul className="space-y-2">
            {attempts.slice(0, 3).map((a) => (
              <li
                key={a.id}
                className="rounded-2xl p-3 flex items-center justify-between"
                style={{
                  background: 'var(--surface-2)',
                  border: `1px solid ${
                    a.passed
                      ? 'color-mix(in srgb, var(--success) 25%, transparent)'
                      : 'var(--border-1)'
                  }`,
                }}
              >
                <div className="min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
                  >
                    {a.quiz_title}
                  </p>
                  <p
                    className="text-[11px] mt-0.5"
                    style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                  >
                    {new Date(a.completed_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span
                  className="text-lg flex-shrink-0 ml-3"
                  style={{
                    color: a.passed ? 'var(--accent)' : 'var(--text-3)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                  }}
                >
                  {a.score}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 7. CTA pra assinar se ainda não tem plano */}
      {!subLoading && !isPremium && (
        <Link
          href="/educa/assine"
          className="block rounded-2xl p-4"
          style={{
            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          }}
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
              >
                Assine o Veritas Educa
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
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

function ContinueCard({
  contentType,
  contentRef,
  updatedAt,
  preview,
}: {
  contentType: string
  contentRef: string
  updatedAt: string
  preview: string
}) {
  const date = new Date(updatedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
  return (
    <Link
      href={`/estudo/${contentType}`}
      className="block rounded-2xl p-4"
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
          <NotebookPen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <p
              className="text-[11px] tracking-[0.15em] uppercase"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              Continue de onde parou
            </p>
            <span
              className="text-[10px] flex-shrink-0"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {date}
            </span>
          </div>
          <p
            className="text-sm line-clamp-2"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
          >
            {preview || `Voltar para ${contentRef}`}
          </p>
        </div>
        <ArrowRight
          className="w-4 h-4 flex-shrink-0 self-center"
          style={{ color: 'var(--text-3)' }}
        />
      </div>
    </Link>
  )
}

function PillarsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4 animate-pulse"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
            height: 76,
          }}
        />
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl p-4 text-center"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      <BookOpen
        className="w-5 h-5 mx-auto mb-2"
        style={{ color: 'var(--text-3)' }}
      />
      <p
        className="text-sm"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {text}
      </p>
    </div>
  )
}
