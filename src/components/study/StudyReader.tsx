'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, NotebookPen, ArrowRight } from 'lucide-react'
import ImmersiveReader from '@/components/content/ImmersiveReader'
import StudyDeepdive from './StudyDeepdive'
import StudyNotesPanel from './StudyNotesPanel'
import ProgressTrack from './ProgressTrack'
import { useStudyDeepdive } from '@/lib/study/useStudyDeepdive'
import type {
  ContentItem,
  StudyNextHint,
  StudyPillarContext,
} from '@/lib/study/types'

export interface StudyReaderProps {
  contentType: string
  contentRef: string
  pillar: StudyPillarContext
  topic?: { title: string; href?: string } | null
  title: string
  subtitle?: string
  description?: string
  items: ContentItem[]
  onMarkStudied?: () => void
  isStudied?: boolean
  next?: StudyNextHint | null
}

export default function StudyReader({
  contentType,
  contentRef,
  pillar,
  topic,
  title,
  subtitle,
  description,
  items,
  onMarkStudied,
  isStudied,
  next,
}: StudyReaderProps) {
  const { deepdive } = useStudyDeepdive(contentType, contentRef)
  const [notesOpen, setNotesOpen] = useState(false)

  const pillarPercent = useMemo(() => {
    if (!pillar.total) return 0
    return Math.round((pillar.studiedCount / pillar.total) * 100)
  }, [pillar.studiedCount, pillar.total])

  return (
    <>
      <ImmersiveReader
        title={title}
        subtitle={subtitle}
        description={description}
        items={items}
        onMarkStudied={onMarkStudied}
        isStudied={isStudied}
        topSlot={
          <ProgressTrack
            percent={pillarPercent}
            label={`${pillar.title} · ${pillar.studiedCount}/${pillar.total}`}
          />
        }
        headerSlot={
          <Breadcrumb pillar={pillar} topic={topic} currentTitle={title} />
        }
        afterItems={
          <>
            {deepdive ? <StudyDeepdive deepdive={deepdive} /> : null}
            <ActionBar onOpenNotes={() => setNotesOpen(true)} />
          </>
        }
        footerSlot={next ? <NextCallout next={next} /> : null}
      />

      <StudyNotesPanel
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        contentType={contentType}
        contentRef={contentRef}
        contentTitle={title}
      />
    </>
  )
}

function Breadcrumb({
  pillar,
  topic,
  currentTitle,
}: {
  pillar: StudyPillarContext
  topic?: { title: string; href?: string } | null
  currentTitle: string
}) {
  return (
    <nav
      className="flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase overflow-x-auto no-scrollbar"
      style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
      aria-label="Navegação do estudo"
    >
      <Link
        href={`/estudo/${pillar.slug}`}
        className="hover:text-[var(--gold)] transition-colors whitespace-nowrap"
      >
        {pillar.title}
      </Link>
      {topic ? (
        <>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          {topic.href ? (
            <Link
              href={topic.href}
              className="hover:text-[var(--gold)] transition-colors whitespace-nowrap"
            >
              {topic.title}
            </Link>
          ) : (
            <span className="whitespace-nowrap">{topic.title}</span>
          )}
        </>
      ) : null}
      <ChevronRight className="w-3 h-3 flex-shrink-0" />
      <span className="whitespace-nowrap" style={{ color: 'var(--gold)' }}>
        {currentTitle}
      </span>
    </nav>
  )
}

function ActionBar({ onOpenNotes }: { onOpenNotes: () => void }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={onOpenNotes}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all duration-200"
        style={{
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.2)',
          color: 'var(--gold)',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <NotebookPen className="w-4 h-4" />
        Minhas anotações
      </button>
    </div>
  )
}

function NextCallout({ next }: { next: StudyNextHint }) {
  return (
    <div className="text-center">
      <Link
        href={next.href}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm transition-all duration-200"
        style={{
          background: next.isPillarComplete
            ? 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(168,139,58,0.2))'
            : 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.3)',
          color: 'var(--gold)',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {next.label}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
