'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  useContentGroup,
  useContentTopicSubtopics,
  useTopicFullContent,
  type ContentSubtopic,
  type ContentTopic,
} from '@/lib/content/useContentGroup'
import { useContentProgress } from '@/lib/content/useContentProgress'
import { useAuth } from '@/contexts/AuthContext'
import StudyReader from './StudyReader'
import { computeNext, type PillarSequenceEntry } from '@/lib/study/navigation'
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
  const { group, topics, loading: groupLoading } = useContentGroup(pillarSlug)
  const { isStudied, markStudied, studiedIds } = useContentProgress(user?.id, pillarSlug)

  if (groupLoading) return <Loader />
  if (!group) {
    return (
      <EmptyPillar pillarSlug={pillarSlug} />
    )
  }

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
  group: { title: string; subtitle: string | null; description: string | null }
  topics: ContentTopic[]
}) {
  return (
    <div className="flex flex-col min-h-screen relative">
      <PillarHero title={group.title} subtitle={group.description || group.subtitle || ''} />
      <main className="relative z-10 flex-1 pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {topics.map((topic, i) => (
            <Link
              key={topic.id}
              href={`/estudo/${pillarSlug}/${topic.slug}`}
              className="text-left p-5 rounded-2xl fade-in active:scale-[0.99] transition-transform"
              style={{ ...CARD_STYLE, animationDelay: `${i * 0.06}s` }}
            >
              {topic.sort_order > 0 && topic.subtitle ? (
                <span
                  className="text-xs tracking-[0.15em] uppercase block mb-3"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                >
                  {topic.subtitle}
                </span>
              ) : null}
              <h3
                className="text-base font-semibold leading-snug mb-2 tracking-[0.04em]"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
              >
                {topic.title}
              </h3>
              {topic.description ? (
                <p
                  className="text-sm leading-relaxed line-clamp-2"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  {topic.description}
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

function PillarTopicView({
  pillarSlug,
  group,
  topics,
  topicSlug,
  subtopicSlug,
  studiedIds,
  isStudied,
  markStudied,
}: {
  pillarSlug: string
  group: { id: string; title: string }
  topics: ContentTopic[]
  topicSlug: string
  subtopicSlug?: string
  studiedIds: Set<string>
  isStudied: (id: string) => boolean
  markStudied: (id: string) => Promise<void>
}) {
  const topic = topics.find((t) => t.slug === topicSlug) || null
  const { subtopics, loading } = useTopicFullContent(topic?.id ?? null)

  if (!topic) {
    if (topics.length > 0) return <EmptyTopic pillarSlug={pillarSlug} />
    return <Loader />
  }
  if (loading) return <Loader />
  if (!subtopics.length) return <EmptyTopic pillarSlug={pillarSlug} />

  // Build pillar sequence across all topics in the pillar — used to compute "next".
  // Para simplificar, sequência = apenas subtopics deste tópico (Fase 2 expande).
  const sequence: PillarSequenceEntry[] = subtopics.map((s) => ({
    ref: s.slug,
    title: s.title,
    href: `/estudo/${pillarSlug}/${topicSlug}/${s.slug}`,
  }))

  // If there's a subtopic in URL, render reader. If single-subtopic topic, auto-open.
  const targetSubtopic = subtopicSlug
    ? subtopics.find((s) => s.slug === subtopicSlug) || null
    : subtopics.length === 1
      ? subtopics[0]
      : null

  const totalSubtopics = countTotalSubtopicsInPillar(topics)
  const pillar: StudyPillarContext = {
    slug: pillarSlug,
    title: group.title,
    total: totalSubtopics || subtopics.length,
    studiedCount: studiedIds.size,
  }

  if (targetSubtopic) {
    const next = computeNext(sequence, targetSubtopic.slug, `/estudo/${pillarSlug}`)
    return (
      <div className="flex flex-col min-h-screen relative">
        <header className="relative z-10 w-full pt-6 pb-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
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
        <main className="relative z-10 flex-1 pb-16">
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
            items={targetSubtopic.items}
            onMarkStudied={
              isStudied(targetSubtopic.id)
                ? undefined
                : () => markStudied(targetSubtopic.id)
            }
            isStudied={isStudied(targetSubtopic.id)}
            next={next}
          />
        </main>
      </div>
    )
  }

  // Subtopic grid when topic has multiple subtopics
  return (
    <div className="flex flex-col min-h-screen relative">
      <header className="relative z-10 w-full pt-6 pb-2 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <BackChip href={`/estudo/${pillarSlug}`} label={group.title} />
        </div>
      </header>
      <PillarHero title={topic.title} subtitle={topic.description} />
      <main className="relative z-10 flex-1 pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {subtopics.map((sub, i) => (
            <Link
              key={sub.id}
              href={`/estudo/${pillarSlug}/${topicSlug}/${sub.slug}`}
              className="text-left p-5 rounded-2xl fade-in active:scale-[0.99] transition-transform"
              style={{ ...CARD_STYLE, animationDelay: `${i * 0.06}s` }}
            >
              {sub.subtitle ? (
                <span
                  className="text-xs tracking-[0.15em] uppercase block mb-3"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
                >
                  {sub.subtitle}
                </span>
              ) : null}
              <h3
                className="text-base font-semibold leading-snug mb-2 tracking-[0.04em]"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
              >
                {sub.title}
              </h3>
              {sub.description ? (
                <p
                  className="text-sm leading-relaxed line-clamp-2"
                  style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                >
                  {sub.description}
                </p>
              ) : null}
              <span
                className="mt-3 inline-block text-[11px]"
                style={{
                  color: isStudied(sub.id) ? 'var(--accent)' : 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {isStudied(sub.id) ? '✓ estudado' : 'Abrir'}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
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

function countTotalSubtopicsInPillar(_topics: ContentTopic[]): number {
  // Placeholder — idealmente buscamos count agregado do Supabase.
  // Usar 0 faz StudyReader usar length do tópico atual.
  return 0
}

export type { ContentSubtopic }
