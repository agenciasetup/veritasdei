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
  Check,
  GraduationCap,
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
import ContentRail, { RailItem } from '@/components/educa/ContentRail'
import { RARITY_META } from '@/types/gamification'
import { TRAILS_1 } from '@/features/trilhas/trails1'
import { TRAILS_2 } from '@/features/trilhas/trails2'
import { TRAILS_3 } from '@/features/trilhas/trails3'
import { TRAILS_4 } from '@/features/trilhas/trails4'
import { TRAILS_5 } from '@/features/trilhas/trails5'
import { TRAILS_6 } from '@/features/trilhas/trails6'
import type { Trail } from '@/features/trilhas/trails1'

// Paleta sacra: dourado (Bíblia — texto sagrado), vinho (Magistério —
// autoridade da Igreja, sangue de Cristo) e bronze/sépia (Patrística —
// Padres da Igreja, antiguidade). Quando virmos pra Fase B (image_url),
// trocamos por imagem real; até lá, gradient + ícone já carregam o tom.
const PILLAR_VISUAL: Record<
  string,
  { gradient: string; icon: React.ElementType; color: string }
> = {
  biblia: {
    gradient: 'linear-gradient(135deg, #C9A84C 0%, #6e5421 100%)',
    icon: Book,
    color: '#C9A84C',
  },
  magisterio: {
    gradient: 'linear-gradient(135deg, #8B3145 0%, #3D0F1A 100%)',
    icon: Building2,
    color: '#C66B7E',
  },
  patristica: {
    gradient: 'linear-gradient(135deg, #8B6F47 0%, #3a2d1a 100%)',
    icon: Scroll,
    color: '#C9A876',
  },
}

const DEFAULT_PILLAR_VISUAL = {
  gradient: 'linear-gradient(135deg, #4A3B28 0%, #1f1812 100%)',
  icon: BookOpen,
  color: '#B8AFA2',
}

// Catálogo de trilhas (estático — fallback do TrilhasView quando o DB
// não tem trails). Usamos só pra renderizar o rail; a abertura/detalhe
// continua acontecendo em /educa/trilhas.
const ALL_TRAILS: Trail[] = [
  ...TRAILS_1, ...TRAILS_2, ...TRAILS_3,
  ...TRAILS_4, ...TRAILS_5, ...TRAILS_6,
]

const DIFFICULTY_LABEL: Record<Trail['difficulty'], string> = {
  Iniciante: 'Iniciante',
  Intermediário: 'Intermediário',
  Avançado: 'Avançado',
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
        {/* ─── 2. TRILHAS (rail horizontal Netflix-style) ───────────── */}
        <ContentRail
          title="Trilhas guiadas"
          subtitle="Caminhos estruturados pra estudar com método."
          cta={{ label: 'Ver todas', href: '/educa/trilhas' }}
        >
          {ALL_TRAILS.map((t) => (
            <div key={t.id} className="contents">
              <RailItem widthClassName="w-72 md:w-80">
                <TrailPosterCard trail={t} />
              </RailItem>
            </div>
          ))}
        </ContentRail>

        {/* ─── 3. PILARES (rail horizontal) ──────────────────────── */}
        {recentLoading ? (
          <section>
            <SectionHeader
              title="Pilares de estudo"
              subtitle="Bíblia, Magistério e Patrística — o tripé da fé católica."
            />
            <PillarsSkeleton />
          </section>
        ) : pillars.length === 0 ? (
          <section>
            <SectionHeader
              title="Pilares de estudo"
              subtitle="Bíblia, Magistério e Patrística — o tripé da fé católica."
            />
            <EmptyState text="O conteúdo dos pilares aparece aqui assim que carregar." />
          </section>
        ) : (
          <ContentRail
            title="Pilares de estudo"
            subtitle="Bíblia, Magistério e Patrística — o tripé da fé católica."
          >
            {pillars.map((p) => {
              const v = PILLAR_VISUAL[p.slug] ?? DEFAULT_PILLAR_VISUAL
              const percent =
                p.total > 0 ? Math.round((p.studied / p.total) * 100) : 0
              return (
                <div key={p.slug} className="contents">
                  <RailItem widthClassName="w-[19rem] md:w-[24rem]">
                    <PillarPosterCard
                      slug={p.slug}
                      title={p.title}
                      studied={p.studied}
                      total={p.total}
                      percent={percent}
                      visual={v}
                    />
                  </RailItem>
                </div>
              )
            })}
          </ContentRail>
        )}

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
          'linear-gradient(135deg, #0f0e0c 0%, #14080b 60%, #0f0e0c 100%)',
        borderBottom: '1px solid var(--border-1)',
      }}
    >
      {/* Glow decorativo — dourado + acento vinho sutil */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 800px 300px at 20% 100%, rgba(201,168,76,0.22), transparent 70%), radial-gradient(ellipse 400px 200px at 90% 0%, rgba(139,49,69,0.18), transparent 70%)',
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
// Poster cards (estilo módulo Netflix)
// ──────────────────────────────────────────────────────────────────────

/** Cor de label de dificuldade (paleta sacra). */
const DIFFICULTY_BG: Record<Trail['difficulty'], string> = {
  Iniciante:
    'color-mix(in srgb, var(--accent) 18%, transparent)',
  Intermediário:
    'color-mix(in srgb, #C9A876 22%, transparent)',
  Avançado:
    'color-mix(in srgb, var(--wine-light) 28%, transparent)',
}

function TrailPosterCard({ trail }: { trail: Trail }) {
  return (
    <Link
      href="/educa/trilhas"
      className="group block rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
      style={{
        aspectRatio: '4 / 5',
        background: `linear-gradient(180deg, ${trail.color}33 0%, var(--surface-2) 60%, var(--surface-1) 100%)`,
        border: `1px solid color-mix(in srgb, ${trail.color} 30%, transparent)`,
        boxShadow: `0 6px 22px -8px ${trail.color}40`,
      }}
    >
      <div className="relative h-full p-4 md:p-5 flex flex-col">
        {/* Topo: ícone + nivel */}
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: `${trail.color}26`,
              border: `1px solid ${trail.color}55`,
            }}
          >
            <GraduationCap
              className="w-6 h-6"
              style={{ color: trail.color }}
            />
          </div>
          <span
            className="text-[10px] tracking-wider uppercase px-2 py-1 rounded-full"
            style={{
              background: DIFFICULTY_BG[trail.difficulty],
              color: trail.color,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            {DIFFICULTY_LABEL[trail.difficulty]}
          </span>
        </div>

        {/* Meio: título + descrição */}
        <div className="flex-1 min-h-0">
          <h3
            className="text-lg md:text-xl leading-tight mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
            }}
          >
            {trail.title}
          </h3>
          <p
            className="text-[11px] mb-3 opacity-80"
            style={{
              color: trail.color,
              fontFamily: 'var(--font-body)',
            }}
          >
            {trail.subtitle}
          </p>
          <p
            className="text-xs leading-relaxed line-clamp-3"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {trail.description}
          </p>
        </div>

        {/* Rodapé: steps preview + CTA */}
        <div
          className="mt-3 pt-3 flex items-center justify-between"
          style={{
            borderTop: '1px solid var(--border-1)',
          }}
        >
          <span
            className="text-[11px] inline-flex items-center gap-1"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Check className="w-3 h-3" />
            {trail.steps.length} etapas
          </span>
          <ArrowRight
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            style={{ color: trail.color }}
          />
        </div>
      </div>
    </Link>
  )
}

function PillarPosterCard({
  slug,
  title,
  studied,
  total,
  percent,
  visual,
}: {
  slug: string
  title: string
  studied: number
  total: number
  percent: number
  visual: { gradient: string; icon: React.ElementType; color: string }
}) {
  const Icon = visual.icon
  return (
    <Link
      href={`/estudo/${slug}`}
      className="group relative block rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
      style={{
        aspectRatio: '16 / 10',
        background: visual.gradient,
        border: '1px solid var(--border-1)',
        boxShadow: `0 6px 24px -8px ${visual.color}55`,
      }}
    >
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
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(0,0,0,0.4)',
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
            {title}
          </h3>
          <div className="flex items-center justify-between mt-3">
            <span
              className="text-xs"
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {studied}/{total} estudados
            </span>
            <ArrowRight className="w-4 h-4 text-white opacity-80 group-hover:translate-x-1 transition-transform" />
          </div>
          <div
            className="mt-2 h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${percent}%`, background: 'white' }}
            />
          </div>
        </div>
      </div>
    </Link>
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
