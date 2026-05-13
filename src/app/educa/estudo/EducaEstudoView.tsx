'use client'

/**
 * EducaEstudoView — hub principal de estudo, estilo área de membros.
 *
 * Hierarquia visual (do mais "marketing" pro mais "operacional"):
 *
 *  1. Hero — "Continue de onde parou" (banner cheio com gradient + título)
 *     ou, sem progresso, um pitch de boas-vindas.
 *  2. Trilhas — grade de cards bonitos (reusa TrilhasView com hideHeader + limit=6),
 *     com link "Ver todas" pra /educa/trilhas que ainda mostra a lista completa.
 *  3. Pilares — Bíblia/Magistério/Patrística como cards grandes coloridos
 *     (gradient + ícone grande + barra de progresso). Links pra /estudo/{slug}.
 *  4. Provas recentes + Selos — bloco de 2 colunas (lg) com link pra perfil.
 *  5. Grupos de estudo — card de atalho discreto no fim.
 *
 * Nada novo no banco — só composição visual sobre os hooks existentes.
 */

import Link from 'next/link'
import {
  ArrowRight,
  Book,
  BookOpen,
  Building2,
  Loader2,
  NotebookPen,
  Scroll,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyStudyRecent } from '@/lib/study/useMyStudyRecent'
import { useLastStudied } from '@/lib/content/useLastStudied'
import { useReliquias } from '@/lib/gamification/useReliquias'
import TrilhasView from '@/features/trilhas/TrilhasView'
import { RARITY_META } from '@/types/gamification'

// Visual canônico dos 3 pilares de estudo. Cor + ícone aplicados em todos
// os lugares do Educa pra dar consistência. Quando virmos pra Fase B
// (image_url no banco), trocamos por imagem; até lá, gradient + ícone
// já dão presença bem maior que um card cinza.
const PILLAR_VISUAL: Record<
  string,
  { gradient: string; icon: React.ElementType; color: string }
> = {
  biblia: {
    gradient: 'linear-gradient(135deg, #C9A84C 0%, #8a6e2e 100%)',
    icon: Book,
    color: '#C9A84C',
  },
  magisterio: {
    gradient: 'linear-gradient(135deg, #7B5BA8 0%, #4a3568 100%)',
    icon: Building2,
    color: '#A98DDB',
  },
  patristica: {
    gradient: 'linear-gradient(135deg, #6B8E5A 0%, #3f5634 100%)',
    icon: Scroll,
    color: '#A9C998',
  },
}

const DEFAULT_PILLAR_VISUAL = {
  gradient: 'linear-gradient(135deg, #5C5648 0%, #2f2c26 100%)',
  icon: BookOpen,
  color: '#B8AFA2',
}

export default function EducaEstudoView() {
  const { user } = useAuth()
  const { last, loading: lastLoading } = useLastStudied(user?.id)
  const { attempts, pillars, loading: recentLoading } = useMyStudyRecent()
  const { catalog, unlockedIds, loading: relLoading } = useReliquias(user?.id)

  const unlockedSelos = catalog.filter((r) => unlockedIds.has(r.id))

  return (
    <main className="pb-24 md:pb-16">
      {/* ─── 1. HERO ─────────────────────────────────────────────────── */}
      <HeroSection
        loading={lastLoading}
        last={
          last
            ? {
                href: `/estudo/${last.groupSlug}`,
                title: last.subtopicTitle,
                subtitle: last.groupTitle,
              }
            : null
        }
      />

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-10 md:space-y-12">
        {/* ─── 2. TRILHAS ──────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Trilhas guiadas"
            subtitle="Caminhos estruturados pra estudar com método."
            cta={{ label: 'Ver todas', href: '/educa/trilhas' }}
          />
          <TrilhasView hideHeader limit={6} />
        </section>

        {/* ─── 3. PILARES ──────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Pilares de estudo"
            subtitle="Bíblia, Magistério e Patrística — o tripé da fé católica."
          />
          {recentLoading ? (
            <PillarsSkeleton />
          ) : pillars.length === 0 ? (
            <EmptyState text="O conteúdo dos pilares aparece aqui assim que carregar." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
              {pillars.map((p) => {
                const v = PILLAR_VISUAL[p.slug] ?? DEFAULT_PILLAR_VISUAL
                const Icon = v.icon
                const percent =
                  p.total > 0 ? Math.round((p.studied / p.total) * 100) : 0
                return (
                  <Link
                    key={p.slug}
                    href={`/estudo/${p.slug}`}
                    className="group relative block rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
                    style={{
                      aspectRatio: '16 / 10',
                      background: v.gradient,
                      border: '1px solid var(--border-1)',
                      boxShadow: `0 6px 24px -8px ${v.color}40`,
                    }}
                  >
                    {/* Pattern decorativo */}
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-30"
                      style={{
                        background:
                          'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 60%)',
                      }}
                    />
                    <div className="relative h-full flex flex-col justify-between p-5 md:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <span
                          className="text-xs px-2.5 py-1 rounded-full"
                          style={{
                            background: 'rgba(0,0,0,0.35)',
                            color: 'white',
                            fontFamily: 'var(--font-body)',
                            fontWeight: 600,
                          }}
                        >
                          {percent}%
                        </span>
                      </div>
                      <div>
                        <h3
                          className="text-2xl md:text-3xl"
                          style={{
                            fontFamily: 'var(--font-display)',
                            color: 'white',
                            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          }}
                        >
                          {p.title}
                        </h3>
                        <div className="flex items-center justify-between mt-3">
                          <span
                            className="text-xs"
                            style={{
                              color: 'rgba(255,255,255,0.85)',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            {p.studied}/{p.total} estudados
                          </span>
                          <ArrowRight className="w-4 h-4 text-white opacity-80 group-hover:translate-x-1 transition-transform" />
                        </div>
                        {/* progress bar */}
                        <div
                          className="mt-2 h-1 rounded-full overflow-hidden"
                          style={{ background: 'rgba(0,0,0,0.3)' }}
                        >
                          <div
                            className="h-full transition-all duration-700"
                            style={{
                              width: `${percent}%`,
                              background: 'white',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* ─── 4. PROVAS + SELOS ──────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          <ProvasCard attempts={attempts} loading={recentLoading} />
          <SelosCard
            unlocked={unlockedSelos}
            total={catalog.length}
            loading={relLoading}
          />
        </section>

        {/* ─── 5. GRUPOS DE ESTUDO ────────────────────────────────── */}
        <Link
          href="/estudo/grupos"
          className="block rounded-2xl p-5 active:scale-[0.99] transition-transform"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-1)',
              }}
            >
              <Users className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium mb-0.5"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Grupos de estudo
              </p>
              <p
                className="text-xs"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Estude com outras pessoas — entre num grupo por código.
              </p>
            </div>
            <ArrowRight
              className="w-4 h-4 flex-shrink-0"
              style={{ color: 'var(--text-3)' }}
            />
          </div>
        </Link>
      </div>
    </main>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Hero
// ──────────────────────────────────────────────────────────────────────

function HeroSection({
  loading,
  last,
}: {
  loading: boolean
  last: { href: string; title: string; subtitle: string } | null
}) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: 220,
        background:
          'linear-gradient(135deg, #1a1612 0%, #0f0e0c 60%, #2a1d10 100%)',
        borderBottom: '1px solid var(--border-1)',
      }}
    >
      {/* Glow decorativo */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 800px 300px at 20% 100%, rgba(201,168,76,0.18), transparent 70%)',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <p
          className="text-[11px] md:text-xs tracking-[0.25em] uppercase mb-2 md:mb-3"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          {last ? 'Continue de onde parou' : 'Seu estudo'}
        </p>
        {loading ? (
          <div className="h-9 w-72 rounded-md animate-pulse bg-white/5" />
        ) : last ? (
          <Link
            href={last.href}
            className="group inline-flex flex-col gap-1"
          >
            <h1
              className="text-2xl md:text-4xl leading-tight"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-1)',
              }}
            >
              {last.title}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 text-xs md:text-sm"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {last.subtitle}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ) : (
          <h1
            className="text-2xl md:text-4xl leading-tight max-w-2xl"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
            }}
          >
            Comece a estudar a fé católica com profundidade.
          </h1>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Section helpers
// ──────────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
  cta,
}: {
  title: string
  subtitle?: string
  cta?: { label: string; href: string }
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 md:mb-5">
      <div className="min-w-0">
        <h2
          className="text-xl md:text-2xl"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs md:text-sm mt-0.5"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1 text-xs flex-shrink-0"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
        >
          {cta.label} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Provas
// ──────────────────────────────────────────────────────────────────────

function ProvasCard({
  attempts,
  loading,
}: {
  attempts: Array<{
    id: string
    quiz_id: string
    score: number
    passed: boolean
    completed_at: string
    quiz_title: string
  }>
  loading: boolean
}) {
  return (
    <div
      className="rounded-3xl p-5 md:p-6"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm tracking-[0.15em] uppercase flex items-center gap-2"
          style={{
            color: 'var(--accent)',
            fontFamily: 'var(--font-display)',
          }}
        >
          <Trophy className="w-4 h-4" />
          Provas recentes
        </h3>
        <span
          className="text-[10px]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {attempts.length} feita{attempts.length === 1 ? '' : 's'}
        </span>
      </div>
      {loading ? (
        <div className="py-4 flex justify-center">
          <Loader2
            className="w-4 h-4 animate-spin"
            style={{ color: 'var(--text-3)' }}
          />
        </div>
      ) : attempts.length === 0 ? (
        <p
          className="text-sm py-2"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Faça sua primeira prova ao final de um tópico de estudo.
        </p>
      ) : (
        <ul className="space-y-2">
          {attempts.slice(0, 4).map((a) => (
            <li
              key={a.id}
              className="rounded-xl p-3 flex items-center justify-between"
              style={{
                background: 'var(--surface-inset)',
                border: `1px solid ${
                  a.passed
                    ? 'color-mix(in srgb, var(--success) 22%, transparent)'
                    : 'var(--border-1)'
                }`,
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {a.quiz_title}
                </p>
                <p
                  className="text-[11px] mt-0.5"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {new Date(a.completed_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span
                className="text-lg ml-3 flex-shrink-0"
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
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Selos com raridade visual
// ──────────────────────────────────────────────────────────────────────

function SelosCard({
  unlocked,
  total,
  loading,
}: {
  unlocked: Array<{
    id: string
    name: string
    rarity: keyof typeof RARITY_META
    image_url: string | null
  }>
  total: number
  loading: boolean
}) {
  return (
    <div
      className="rounded-3xl p-5 md:p-6"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm tracking-[0.15em] uppercase flex items-center gap-2"
          style={{
            color: 'var(--accent)',
            fontFamily: 'var(--font-display)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          Selos de devoção
        </h3>
        <Link
          href="/perfil?tab=reliquias"
          className="text-[11px]"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
        >
          {unlocked.length}/{total} →
        </Link>
      </div>
      {loading ? (
        <div className="py-4 flex justify-center">
          <Loader2
            className="w-4 h-4 animate-spin"
            style={{ color: 'var(--text-3)' }}
          />
        </div>
      ) : unlocked.length === 0 ? (
        <p
          className="text-sm py-2"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Conclua estudos e gabarite provas pra desbloquear selos.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {unlocked.slice(0, 8).map((r) => {
            const meta = RARITY_META[r.rarity]
            return (
              <div
                key={r.id}
                title={r.name}
                className="aspect-square rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  background: `color-mix(in srgb, ${meta.color} 18%, var(--surface-inset))`,
                  border: `1px solid color-mix(in srgb, ${meta.color} 40%, transparent)`,
                  boxShadow: `0 2px 12px -4px ${meta.color}55`,
                }}
              >
                {r.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image_url}
                    alt=""
                    className="w-2/3 h-2/3 object-contain"
                  />
                ) : (
                  <Sparkles
                    className="w-1/3 h-1/3"
                    style={{ color: meta.color }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────
// Skeletons / empty
// ──────────────────────────────────────────────────────────────────────

function PillarsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-3xl animate-pulse"
          style={{
            aspectRatio: '16 / 10',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        />
      ))}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      <NotebookPen
        className="w-6 h-6 mx-auto mb-2"
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
