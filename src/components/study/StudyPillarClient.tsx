'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import {
  useContentItems,
  type ContentSubtopic,
} from '@/lib/content/useContentGroup'
import { useContentProgress } from '@/lib/content/useContentProgress'
import { useAuth } from '@/contexts/AuthContext'
import StudyReader from './StudyReader'
import StudyLayout from './StudyLayout'
import StudyLessonsSidebar from './StudyLessonsSidebar'
import CinematicHero from '@/components/educa/CinematicHero'
import ContentRail, { RailItem } from '@/components/educa/ContentRail'
import StudyMobileChip from './StudyMobileChip'
import StudyNavBar from './StudyNavBar'
import StudyTopicQuizCard from './StudyTopicQuizCard'
import { usePillarTree, type PillarTreeNode } from '@/lib/study/usePillarTree'
import { useStudyNavigation } from '@/lib/study/useStudyNavigation'
import type { StudyPillarContext } from '@/lib/study/types'
import Divider from '@/components/ui/Divider'

interface Props {
  pillarSlug: string
  topicSlug?: string
  subtopicSlug?: string
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin"
        style={{ borderColor: 'var(--border-1)', borderTopColor: 'var(--accent)' }}
      />
    </div>
  )
}

function PillarHero({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <section className="relative z-10 text-center px-5 pt-8 pb-4">
      <h1
        className="text-2xl md:text-3xl tracking-[0.08em] uppercase"
        style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--text-1)',
          fontWeight: 700,
          lineHeight: 1.15,
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className="mt-2 text-sm max-w-md mx-auto"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {subtitle}
        </p>
      ) : null}
      <Divider variant="ornament" className="max-w-[180px] mx-auto" spacing="default" />
    </section>
  )
}

function BackChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-[0.08em] uppercase active:scale-[0.97] transition-transform"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
        color: 'var(--text-2)',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
      }}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  )
}

const CARD_STYLE: React.CSSProperties = {
  background: 'var(--surface-2)',
  border: '1px solid var(--border-1)',
}

export default function StudyPillarClient({ pillarSlug, topicSlug, subtopicSlug }: Props) {
  const { user } = useAuth()
  const { group, topics, totalSubtopics, loading } = usePillarTree(pillarSlug)
  const { isStudied, markStudied, studiedIds } = useContentProgress(user?.id, pillarSlug)

  if (loading) return <Loader />
  if (!group) return <EmptyPillar pillarSlug={pillarSlug} />

  if (!topicSlug) {
    return <PillarTopicGrid pillarSlug={pillarSlug} group={group} topics={topics} />
  }

  return (
    <PillarTopicView
      pillarSlug={pillarSlug}
      group={group}
      topics={topics}
      topicSlug={topicSlug}
      subtopicSlug={subtopicSlug}
      totalSubtopics={totalSubtopics}
      studiedIds={studiedIds}
      isStudied={isStudied}
      markStudied={markStudied}
    />
  )
}

function EmptyPillar({ pillarSlug }: { pillarSlug: string }) {
  useEffect(() => {
    // Pilares ainda não migrados para content_groups mostram 404 por enquanto.
    notFound()
  }, [pillarSlug])
  return null
}

function PillarTopicGrid({
  pillarSlug,
  group,
  topics,
}: {
  pillarSlug: string
  group: {
    title: string
    subtitle: string | null
    description: string | null
    cover_url?: string | null
  }
  topics: PillarTreeNode[]
}) {
  const firstTopic = topics[0]
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Hero cinematográfico — usa cover_url do pilar quando houver */}
      <CinematicHero
        eyebrow={group.subtitle || 'Pilar de estudo'}
        title={group.title}
        subtitle={group.description ?? undefined}
        imageUrl={group.cover_url ?? null}
        primary={
          firstTopic
            ? {
                label: 'Começar',
                href: `/estudo/${pillarSlug}/${firstTopic.slug}`,
              }
            : undefined
        }
      />

      <main
        className="relative z-10 flex-1 pb-16 -mt-16 md:-mt-24"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <ContentRail
            title="Tópicos"
            subtitle="Escolha por onde começar — ou avance em sequência."
          >
            {topics.map((topic) => (
              <div key={topic.id} className="contents">
                <RailItem widthClassName="w-72 md:w-80">
                  <TopicPosterCard
                    href={`/estudo/${pillarSlug}/${topic.slug}`}
                    title={topic.title}
                    subtitle={topic.subtitle ?? undefined}
                    description={topic.description ?? undefined}
                    coverUrl={topic.cover_url ?? null}
                  />
                </RailItem>
              </div>
            ))}
          </ContentRail>
        </div>
      </main>
    </div>
  )
}

function TopicPosterCard({
  href,
  title,
  subtitle,
  description,
  coverUrl,
}: {
  href: string
  title: string
  subtitle?: string
  description?: string
  coverUrl?: string | null
}) {
  const hasCover = Boolean(coverUrl)
  return (
    <Link
      href={href}
      className="group relative block rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
      style={{
        aspectRatio: '4 / 5',
        background: hasCover
          ? 'var(--surface-2)'
          : 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 18%, var(--surface-2)) 0%, var(--surface-1) 100%)',
        border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
        boxShadow: '0 8px 32px -12px rgba(0,0,0,0.6)',
      }}
    >
      {hasCover ? (
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
                'linear-gradient(180deg, rgba(15,14,12,0.3) 0%, rgba(15,14,12,0.55) 55%, rgba(15,14,12,0.95) 100%)',
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 60%)',
          }}
        />
      )}

      <div className="relative h-full p-4 md:p-5 flex flex-col">
        {/* Ícone topo (se não há cover, fica visível; com cover, fica subtle) */}
        <div
          className="w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center backdrop-blur"
          style={{
            background: hasCover ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.3)',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
          }}
        >
          <BookOpen
            className="w-5 h-5 md:w-6 md:h-6"
            style={{ color: 'var(--accent)' }}
          />
        </div>

        <div className="flex-1" />

        <div>
          {subtitle && (
            <p
              className="text-[10px] tracking-[0.2em] uppercase mb-1 opacity-90"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {subtitle}
            </p>
          )}
          <h3
            className="text-lg md:text-xl leading-tight mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
              textShadow: hasCover ? '0 2px 10px rgba(0,0,0,0.6)' : 'none',
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              className="text-xs leading-relaxed line-clamp-2 mt-1"
              style={{
                color: 'rgba(232,226,216,0.78)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {description}
            </p>
          )}
          <div className="flex items-center justify-end mt-2">
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              style={{ color: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

function PillarTopicView({
  pillarSlug,
  group,
  topics,
  topicSlug,
  subtopicSlug,
  totalSubtopics,
  studiedIds,
  isStudied,
  markStudied,
}: {
  pillarSlug: string
  group: { id: string; title: string }
  topics: PillarTreeNode[]
  topicSlug: string
  subtopicSlug?: string
  totalSubtopics: number
  studiedIds: Set<string>
  isStudied: (id: string) => boolean
  markStudied: (id: string) => Promise<void>
}) {
  const topic = topics.find((t) => t.slug === topicSlug) || null
  const subtopics = topic?.subtopics ?? []

  // Auto-abrir único subtópico quando o tópico só tem um.
  const targetSubtopic = subtopicSlug
    ? subtopics.find((s) => s.slug === subtopicSlug) || null
    : subtopics.length === 1
      ? subtopics[0]
      : null

  // Navegação é sempre no contexto do pilar inteiro — atravessa fronteiras
  // de tópico. O slug efetivo é `subtopicSlug` da URL OU o do único-auto-aberto.
  const effectiveSubtopicSlug = subtopicSlug ?? targetSubtopic?.slug
  const nav = useStudyNavigation(pillarSlug, topics, topicSlug, effectiveSubtopicSlug)

  const { items, loading: itemsLoading } = useContentItems(targetSubtopic?.id ?? null)

  const [tocOpen, setTocOpen] = useState(false)

  // Scroll-to-top coordenado ao trocar de subtópico — previne "page jump"
  // e garante que o usuário comece a nova lição do topo.
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [effectiveSubtopicSlug])

  if (!topic) {
    if (topics.length > 0) return <EmptyTopic pillarSlug={pillarSlug} />
    return <Loader />
  }

  if (!subtopics.length) return <EmptyTopic pillarSlug={pillarSlug} />

  const pillar: StudyPillarContext = {
    slug: pillarSlug,
    title: group.title,
    total: totalSubtopics || subtopics.length,
    studiedCount: studiedIds.size,
  }

  if (targetSubtopic) {
    if (itemsLoading) return <Loader />
    return (
      <div className="flex flex-col min-h-screen relative">
        <StudyLayout
          sidebar={
            <StudyLessonsSidebar
              pillarSlug={pillarSlug}
              pillarTitle={group.title}
              topics={topics}
              activeTopicSlug={topicSlug}
              activeSubtopicSlug={targetSubtopic.slug}
              studiedIds={studiedIds}
            />
          }
        >
          <header className="relative z-10 w-full pt-6 pb-2 px-4 md:px-8">
            <div className="max-w-[1200px] mx-auto">
              <BackChip
                href={
                  subtopics.length > 1
                    ? `/estudo/${pillarSlug}/${topicSlug}`
                    : `/estudo/${pillarSlug}`
                }
                label={subtopics.length > 1 ? topic.title : group.title}
              />
            </div>
          </header>
          <StudyMobileChip
            currentIndex={nav.currentIndex}
            total={nav.totalInPillar}
            onOpen={() => setTocOpen(true)}
          />
          <main
            key={targetSubtopic.slug}
            className="relative z-10 flex-1 pb-[calc(var(--bottom-nav-h,72px)+env(safe-area-inset-bottom,0px)+88px)] lg:pb-8 fade-in"
          >
            <StudyReader
              contentType={pillarSlug}
              contentRef={targetSubtopic.id}
              pillar={pillar}
              topic={{
                title: topic.title,
                href: `/estudo/${pillarSlug}/${topicSlug}`,
              }}
              title={targetSubtopic.title}
              subtitle={targetSubtopic.subtitle || undefined}
              description={targetSubtopic.description || undefined}
              items={items}
              onMarkStudied={
                isStudied(targetSubtopic.id)
                  ? undefined
                  : () => markStudied(targetSubtopic.id)
              }
              isStudied={isStudied(targetSubtopic.id)}
            />
            <StudyNavBar prev={nav.prev} next={nav.next} />
          </main>
        </StudyLayout>

        <StudyLessonsSidebar
          variant="drawer"
          open={tocOpen}
          onClose={() => setTocOpen(false)}
          pillarSlug={pillarSlug}
          pillarTitle={group.title}
          topics={topics}
          activeTopicSlug={topicSlug}
          activeSubtopicSlug={targetSubtopic.slug}
          studiedIds={studiedIds}
        />
      </div>
    )
  }

  // Subtopic grid when topic has multiple subtopics — versão premium
  // (hero cinematográfico + rail horizontal de cards).
  const firstSub = subtopics[0]
  return (
    <div className="flex flex-col min-h-screen relative">
      <CinematicHero
        eyebrow={group.title}
        title={topic.title}
        subtitle={topic.description ?? undefined}
        imageUrl={topic.cover_url ?? null}
        primary={
          firstSub
            ? {
                label: 'Começar',
                href: `/estudo/${pillarSlug}/${topicSlug}/${firstSub.slug}`,
              }
            : undefined
        }
        secondary={{
          label: 'Voltar',
          href: `/estudo/${pillarSlug}`,
        }}
      />

      <main
        className="relative z-10 flex-1 pb-16 -mt-16 md:-mt-24"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6 md:space-y-10">
          {/* Prova do tópico */}
          <StudyTopicQuizCard
            pillarSlug={pillarSlug}
            topicSlug={topicSlug}
            topicTitle={topic.title}
          />

          {/* Rail de subtópicos */}
          <ContentRail
            title="Lições"
            subtitle={`${subtopics.length} ${subtopics.length === 1 ? 'lição' : 'lições'} neste tópico`}
          >
            {subtopics.map((sub, i) => {
              const studied = isStudied(sub.id)
              return (
                <div key={sub.id} className="contents">
                  <RailItem widthClassName="w-72 md:w-80">
                    <SubtopicPosterCard
                      href={`/estudo/${pillarSlug}/${topicSlug}/${sub.slug}`}
                      lessonNumber={i + 1}
                      title={sub.title}
                      subtitle={sub.subtitle ?? undefined}
                      description={sub.description ?? undefined}
                      coverUrl={sub.cover_url ?? null}
                      studied={studied}
                    />
                  </RailItem>
                </div>
              )
            })}
          </ContentRail>
        </div>
      </main>
    </div>
  )
}

function SubtopicPosterCard({
  href,
  lessonNumber,
  title,
  subtitle,
  description,
  coverUrl,
  studied,
}: {
  href: string
  lessonNumber: number
  title: string
  subtitle?: string
  description?: string
  coverUrl?: string | null
  studied?: boolean
}) {
  const hasCover = Boolean(coverUrl)
  return (
    <Link
      href={href}
      className="group relative block rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
      style={{
        aspectRatio: '4 / 5',
        background: hasCover
          ? 'var(--surface-2)'
          : 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 14%, var(--surface-2)) 0%, var(--surface-1) 100%)',
        border: studied
          ? '1px solid color-mix(in srgb, var(--accent) 38%, transparent)'
          : '1px solid color-mix(in srgb, var(--accent) 12%, transparent)',
        boxShadow: studied
          ? '0 8px 32px -12px color-mix(in srgb, var(--accent) 30%, transparent)'
          : '0 8px 32px -12px rgba(0,0,0,0.6)',
      }}
    >
      {hasCover ? (
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
                'linear-gradient(180deg, rgba(15,14,12,0.3) 0%, rgba(15,14,12,0.55) 55%, rgba(15,14,12,0.95) 100%)',
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18), transparent 60%)',
          }}
        />
      )}

      <div className="relative h-full p-4 md:p-5 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          {/* Numero da lição num badge dourado */}
          <div
            className="px-3 py-1 rounded-full"
            style={{
              background: studied
                ? 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)'
                : 'rgba(0,0,0,0.45)',
              border:
                '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
              color: studied ? 'var(--accent-contrast)' : 'var(--accent)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.1em',
              backdropFilter: 'blur(6px)',
            }}
          >
            LIÇÃO {lessonNumber}
          </div>
          {studied && (
            <span
              className="text-[10px] tracking-wider uppercase px-2 py-1 rounded-full backdrop-blur"
              style={{
                background: 'color-mix(in srgb, var(--accent) 16%, rgba(0,0,0,0.5))',
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                border:
                  '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
              }}
            >
              ✓ estudado
            </span>
          )}
        </div>

        <div className="flex-1" />

        <div>
          {subtitle && (
            <p
              className="text-[10px] tracking-[0.2em] uppercase mb-1 opacity-90"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {subtitle}
            </p>
          )}
          <h3
            className="text-lg md:text-xl leading-tight mb-1"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
              textShadow: hasCover ? '0 2px 10px rgba(0,0,0,0.6)' : 'none',
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              className="text-xs leading-relaxed line-clamp-2 mt-1"
              style={{
                color: 'rgba(232,226,216,0.78)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {description}
            </p>
          )}
          <div className="flex items-center justify-end mt-2">
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              style={{ color: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyTopic({ pillarSlug }: { pillarSlug: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-5">
      <p
        className="text-lg mb-2 tracking-[0.06em] uppercase"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}
      >
        Conteúdo não disponível
      </p>
      <Link
        href={`/estudo/${pillarSlug}`}
        className="inline-flex items-center gap-2 mt-4 text-sm"
        style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao pilar
      </Link>
    </div>
  )
}

export type { ContentSubtopic }
