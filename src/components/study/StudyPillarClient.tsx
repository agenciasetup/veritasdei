'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
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
import InlineEditOverlay from '@/components/admin/InlineEditOverlay'
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
    return (
      <PillarTopicGrid
        pillarSlug={pillarSlug}
        group={group}
        topics={topics}
        studiedIds={studiedIds}
      />
    )
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
  studiedIds,
}: {
  pillarSlug: string
  group: {
    id: string
    title: string
    subtitle: string | null
    description: string | null
    cover_url?: string | null
  }
  topics: PillarTreeNode[]
  studiedIds: Set<string>
}) {
  const firstTopic = topics[0]
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Hero cinematográfico — usa cover_url do pilar quando houver.
       *  Admins veem um botão de lápis no canto pra editar a capa
       *  diretamente (sem precisar ir no /admin). */}
      <InlineEditOverlay
        table="content_groups"
        id={group.id}
        fields={['cover_url']}
        label="Editar capa do pilar"
      >
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
      </InlineEditOverlay>

      <main
        className="relative z-10 flex-1 pb-16 pt-8 md:pt-12"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-12 md:space-y-16">
          {chunkInto(topics, 4).map((sessionTopics, idx) => (
            <PillarSession
              key={idx}
              index={idx}
              total={Math.ceil(topics.length / 4)}
              topics={sessionTopics}
              pillarSlug={pillarSlug}
              studiedIds={studiedIds}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

/**
 * Quebra um array em pedaços de tamanho fixo. Usado pra renderizar tópicos
 * em "sessões" de no máximo 4 módulos cada — evita o slider único interminável
 * em pilares com muitos tópicos.
 */
function chunkInto<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items]
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

/**
 * Sessão de até 4 módulos do pilar. Cabeçalho minimalista numerado +
 * grid responsiva (1 col mobile, 2 cols tablet, 4 cols desktop).
 */
function PillarSession({
  index,
  total,
  topics,
  pillarSlug,
  studiedIds,
}: {
  index: number
  total: number
  topics: PillarTreeNode[]
  pillarSlug: string
  studiedIds: Set<string>
}) {
  const sessionNumber = index + 1
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4 md:mb-6">
        <span
          className="text-[10px] tracking-[0.22em] uppercase"
          style={{
            color: 'var(--text-3)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {total > 1 ? `Sessão ${sessionNumber} de ${total}` : 'Sessão'}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          ·
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {topics.length} {topics.length === 1 ? 'módulo' : 'módulos'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {topics.map((topic) => {
          const total = topic.subtopics.length
          const studied = topic.subtopics.reduce(
            (acc, s) => acc + (studiedIds.has(s.id) ? 1 : 0),
            0,
          )
          return (
            <TopicPosterCard
              key={topic.id}
              href={`/estudo/${pillarSlug}/${topic.slug}`}
              title={topic.title}
              subtitle={topic.subtitle ?? undefined}
              description={topic.description ?? undefined}
              coverUrl={topic.cover_url ?? null}
              studied={studied}
              total={total}
            />
          )
        })}
      </div>
    </section>
  )
}

function TopicPosterCard({
  href,
  title,
  subtitle,
  description,
  coverUrl,
  studied,
  total,
}: {
  href: string
  title: string
  subtitle?: string
  description?: string
  coverUrl?: string | null
  studied?: number
  total?: number
}) {
  const hasCover = Boolean(coverUrl)
  const hasProgress =
    typeof studied === 'number' && typeof total === 'number' && total > 0
  const percent = hasProgress
    ? Math.min(100, Math.round((studied! / total!) * 100))
    : 0

  return (
    <Link
      href={href}
      className="group relative block rounded-3xl overflow-hidden active:scale-[0.99] transition-transform"
      style={{
        aspectRatio: '3 / 4',
        background: hasCover
          ? 'var(--surface-1)'
          : 'var(--surface-2)',
        border: '1px solid rgba(255,255,255,0.05)',
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
          {/* Fade bottom-to-top: sólido embaixo pra leitura do texto,
           *  transparente em cima pra deixar a imagem respirar. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(0deg, var(--surface-1) 0%, rgba(15,14,12,0.95) 28%, rgba(15,14,12,0.55) 55%, rgba(15,14,12,0.1) 80%, transparent 100%)',
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(201,168,76,0.18), transparent 60%)',
          }}
        />
      )}

      <div className="relative h-full p-5 md:p-6 flex flex-col">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur"
          style={{
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <BookOpen
            className="w-4 h-4"
            style={{ color: 'var(--accent)' }}
            strokeWidth={1.6}
          />
        </div>

        <div className="flex-1" />

        <div>
          {subtitle && (
            <p
              className="text-[10px] tracking-[0.16em] uppercase mb-1.5"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {subtitle}
            </p>
          )}
          <h3
            className="text-lg md:text-xl leading-tight"
            style={{
              fontFamily: 'var(--font-elegant)',
              color: 'var(--text-1)',
              fontWeight: 500,
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              className="text-[12px] leading-relaxed line-clamp-2 mt-1.5"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {description}
            </p>
          )}

          {hasProgress && (
            <div className="mt-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <span
                  className="text-[10px]"
                  style={{
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Progresso
                </span>
                <span
                  className="text-[11px] tabular-nums"
                  style={{
                    color: studied! > 0 ? 'var(--accent)' : 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {studied}/{total}
                </span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${percent}%`,
                    background: 'var(--accent)',
                  }}
                />
              </div>
            </div>
          )}
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
              videoUrl={targetSubtopic.video_url}
              coverUrl={targetSubtopic.cover_url}
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
      <InlineEditOverlay
        table="content_topics"
        id={topic.id}
        fields={['cover_url']}
        label="Editar capa do tópico"
      >
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
      </InlineEditOverlay>

      <main
        className="relative z-10 flex-1 pb-16 pt-8 md:pt-12"
        style={{ background: 'var(--surface-1)' }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6 md:space-y-10">
          {/* Prova do tópico */}
          <StudyTopicQuizCard
            pillarSlug={pillarSlug}
            topicSlug={topicSlug}
            topicTitle={topic.title}
          />

          {/* Sessões de lições — quebradas em chunks de 4 pra evitar
           *  o slider único interminável. Mantém a numeração contínua
           *  entre sessões. */}
          {chunkInto(subtopics, 4).map((sessionSubs, sessionIdx) => {
            const totalSessions = Math.ceil(subtopics.length / 4)
            const sessionStart = sessionIdx * 4
            return (
              <section key={sessionIdx}>
                <div className="flex items-baseline gap-3 mb-4 md:mb-6">
                  <span
                    className="text-[10px] tracking-[0.22em] uppercase"
                    style={{
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {totalSessions > 1
                      ? `Sessão ${sessionIdx + 1} de ${totalSessions}`
                      : 'Lições'}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    ·
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {sessionSubs.length}{' '}
                    {sessionSubs.length === 1 ? 'lição' : 'lições'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                  {sessionSubs.map((sub, i) => {
                    const studied = isStudied(sub.id)
                    return (
                      <SubtopicPosterCard
                        key={sub.id}
                        href={`/estudo/${pillarSlug}/${topicSlug}/${sub.slug}`}
                        lessonNumber={sessionStart + i + 1}
                        title={sub.title}
                        subtitle={sub.subtitle ?? undefined}
                        description={sub.description ?? undefined}
                        coverUrl={sub.cover_url ?? null}
                        studied={studied}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
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
        aspectRatio: '3 / 4',
        background: hasCover ? 'var(--surface-1)' : 'var(--surface-2)',
        border: '1px solid rgba(255,255,255,0.05)',
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
          {/* Fade bottom-to-top: sólido embaixo, transparente em cima.
           *  Mesmo padrão dos cards de tópico — consistência visual. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(0deg, var(--surface-1) 0%, rgba(15,14,12,0.95) 28%, rgba(15,14,12,0.55) 55%, rgba(15,14,12,0.1) 80%, transparent 100%)',
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            background:
              'radial-gradient(circle at 80% 20%, rgba(201,168,76,0.18), transparent 60%)',
          }}
        />
      )}

      <div className="relative h-full p-5 md:p-6 flex flex-col">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur"
          style={{
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <BookOpen
            className="w-4 h-4"
            style={{ color: 'var(--accent)' }}
            strokeWidth={1.6}
          />
        </div>

        <div className="flex-1" />

        <div>
          <p
            className="text-[10px] tracking-[0.16em] uppercase mb-1.5"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Lição {lessonNumber}
            {subtitle ? ` · ${subtitle}` : ''}
          </p>
          <h3
            className="text-lg md:text-xl leading-tight"
            style={{
              fontFamily: 'var(--font-elegant)',
              color: 'var(--text-1)',
              fontWeight: 500,
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              className="text-[12px] leading-relaxed line-clamp-2 mt-1.5"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {description}
            </p>
          )}

          <div className="mt-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <span
                className="text-[10px]"
                style={{
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {studied ? 'Concluída' : 'Não iniciada'}
              </span>
              <span
                className="text-[11px] tabular-nums inline-flex items-center gap-1"
                style={{
                  color: studied ? 'var(--accent)' : 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {studied ? '✓' : ''}
                {studied ? '1/1' : '0/1'}
              </span>
            </div>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: studied ? '100%' : '0%',
                  background: 'var(--accent)',
                }}
              />
            </div>
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
