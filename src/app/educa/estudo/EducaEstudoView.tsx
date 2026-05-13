'use client'

/**
 * EducaEstudoView — hub principal de estudo, estilo área de membros premium.
 *
 * Topo cinematográfico:
 *  - Se admin cadastrou banners ativos → BannerSlider (auto-play).
 *  - Senão se o user tem progresso → CinematicHero "Continue de onde parou".
 *  - Senão → CinematicHero "welcome" com pitch.
 *
 * Conteúdo (com fade entre o hero e a próxima seção):
 *  - Pilares de estudo (rail horizontal com capas reais quando há cover_url).
 *  - Provas recentes + Selos (2 cols no desktop, stack no mobile).
 *  - Grupos de estudo (atalho).
 *
 * Trilhas foram removidas do hub — material ainda raso. Continuam
 * acessíveis em /educa/trilhas via URL direta (usuário não vai parar
 * lá por engano).
 */

import { useEffect, useState } from 'react'
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
import { createClient } from '@/lib/supabase/client'
import ContentRail, { RailItem } from '@/components/educa/ContentRail'
import BannerSlider, { useActiveBanners } from '@/components/educa/BannerSlider'
import CinematicHero from '@/components/educa/CinematicHero'
import GlassCard from '@/components/educa/GlassCard'
import { RARITY_META } from '@/types/gamification'

// Paleta sacra dos pilares (fallback quando não há cover_url cadastrado).
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

/** Carrega cover_url dos pilares (content_groups) indexado por slug. */
function usePillarCovers(): Record<string, string> {
  const [covers, setCovers] = useState<Record<string, string>>({})
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('content_groups')
        .select('slug, cover_url')
        .eq('visible', true)
      if (cancelled || !Array.isArray(data)) return
      const map: Record<string, string> = {}
      for (const row of data) {
        const slug = row.slug as string | null
        const url = row.cover_url as string | null
        if (slug && url) map[slug] = url
      }
      setCovers(map)
    })()
    return () => {
      cancelled = true
    }
  }, [])
  return covers
}

export default function EducaEstudoView() {
  const { user } = useAuth()
  const { last, loading: lastLoading } = useLastStudied(user?.id)
  const { attempts, pillars, loading: recentLoading } = useMyStudyRecent()
  const { catalog, unlockedIds, loading: relLoading } = useReliquias(user?.id)
  const { banners, loading: bannersLoading } = useActiveBanners()
  const pillarCovers = usePillarCovers()

  const unlockedSelos = catalog.filter((r) => unlockedIds.has(r.id))
  const hasBanners = banners.length > 0
  const heroLoading = bannersLoading || lastLoading

  return (
    <main className="pb-24 md:pb-16" style={{ background: 'var(--surface-1)' }}>
      {/* ─── HERO CINEMATOGRÁFICO ───────────────────────────────────── */}
      {!heroLoading && (
        hasBanners ? (
          <BannerSlider banners={banners} />
        ) : last ? (
          <CinematicHero
            eyebrow="Continue de onde parou"
            title={last.subtopicTitle}
            subtitle={last.groupTitle}
            primary={{ label: 'Continuar', href: `/estudo/${last.groupSlug}` }}
            secondary={{ label: 'Ver detalhes', href: '/educa/trilhas' }}
          />
        ) : (
          <CinematicHero
            eyebrow="Veritas Educa"
            title="Aprofunde sua fé católica com método."
            subtitle="Trilhas, IA católica, debate apologético e mais."
            primary={{ label: 'Começar agora', href: '/educa/trilhas' }}
          />
        )
      )}

      {/* Conteúdo. O fade infinito do CinematicHero já faz a transição
       *  visual com a página — não precisamos puxar o conteúdo pra dentro
       *  dele com margem negativa (estava causando sobreposição do título
       *  "Pilares de estudo" sobre os CTAs do hero). Mantemos um respiro
       *  generoso entre hero e primeiro título. */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12 relative space-y-10 md:space-y-14">
        {/* ─── PILARES (destaque principal) ───────────────────────── */}
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
                      coverUrl={pillarCovers[p.slug] ?? null}
                    />
                  </RailItem>
                </div>
              )
            })}
          </ContentRail>
        )}

        {/* ─── PROVAS + SELOS ─────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          <ProvasCard attempts={attempts} loading={recentLoading} />
          <SelosCard
            unlocked={unlockedSelos}
            total={catalog.length}
            loading={relLoading}
          />
        </section>

        {/* ─── GRUPOS DE ESTUDO ──────────────────────────────────── */}
        <Link href="/estudo/grupos" className="block">
          <GlassCard variant="default" padded interactive>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, rgba(0,0,0,0.3)) 0%, rgba(0,0,0,0.45) 100%)',
                  border:
                    '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
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
                style={{ color: 'var(--accent)' }}
              />
            </div>
          </GlassCard>
        </Link>
      </div>
    </main>
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
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-1)',
          }}
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
// Pillar poster
// ──────────────────────────────────────────────────────────────────────

function PillarPosterCard({
  slug,
  title,
  studied,
  total,
  percent,
  visual,
  coverUrl,
}: {
  slug: string
  title: string
  studied: number
  total: number
  percent: number
  visual: { gradient: string; icon: React.ElementType; color: string }
  coverUrl?: string | null
}) {
  const Icon = visual.icon
  const hasCover = Boolean(coverUrl)
  return (
    <Link
      href={`/estudo/${slug}`}
      className="group relative block rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
      style={{
        aspectRatio: '16 / 10',
        background: hasCover ? 'var(--surface-2)' : visual.gradient,
        border: '1px solid color-mix(in srgb, var(--accent) 12%, transparent)',
        boxShadow: `0 8px 32px -12px ${visual.color}55`,
      }}
    >
      {hasCover && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl as string}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(15,14,12,0.25) 0%, rgba(15,14,12,0.55) 70%, rgba(15,14,12,0.85) 100%)',
            }}
          />
        </>
      )}
      {!hasCover && (
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 60%)',
          }}
        />
      )}
      <div className="relative h-full flex flex-col justify-between p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(6px)',
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
              backdropFilter: 'blur(6px)',
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
              textShadow: '0 2px 12px rgba(0,0,0,0.6)',
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
    <GlassCard variant="default" padded>
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
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${
                  a.passed
                    ? 'color-mix(in srgb, var(--success) 22%, transparent)'
                    : 'color-mix(in srgb, var(--accent) 10%, transparent)'
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
    </GlassCard>
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
    <GlassCard variant="default" padded>
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
                  background: `color-mix(in srgb, ${meta.color} 18%, rgba(0,0,0,0.4))`,
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
    </GlassCard>
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
    <GlassCard variant="default" padded className="text-center">
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
    </GlassCard>
  )
}
