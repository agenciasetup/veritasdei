'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, NotebookPen, ArrowRight } from 'lucide-react'
import ImmersiveReader from '@/components/content/ImmersiveReader'
import StudyDeepdive from './StudyDeepdive'
import StudyNotesPanel from './StudyNotesPanel'
import ProgressTrack from './ProgressTrack'
import { useStudyDeepdive } from '@/lib/study/useStudyDeepdive'
import InlineEditOverlay from '@/components/admin/InlineEditOverlay'
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
  /** Vídeo opcional do YouTube/Vimeo. Renderiza embed acima do conteúdo. */
  videoUrl?: string | null
  /** Capa opcional da lição. Hoje só usada pra preview (não renderiza
   *  hero — o ImmersiveReader já tem identidade própria). Fica aqui pra
   *  o InlineEditOverlay editar quando admin. */
  coverUrl?: string | null
}

/**
 * Extrai o ID do YouTube de uma URL comum (watch?v=, youtu.be/, embed/).
 * Retorna null se não conseguir extrair — nesse caso não renderiza player.
 */
function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.slice(1).split('/')[0] || null
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      // /embed/{id} ou /shorts/{id}
      const parts = u.pathname.split('/').filter(Boolean)
      if (parts[0] === 'embed' || parts[0] === 'shorts') return parts[1] ?? null
    }
    return null
  } catch {
    return null
  }
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
  videoUrl,
}: StudyReaderProps) {
  const { deepdive } = useStudyDeepdive(contentType, contentRef)
  const [notesOpen, setNotesOpen] = useState(false)
  const ytId = youtubeId(videoUrl)

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
          <>
            <ProgressTrack
              percent={pillarPercent}
              label={`${pillar.title} · ${pillar.studiedCount}/${pillar.total}`}
            />
            {/* Botão de edição inline da lição (capa + vídeo). Só admin vê. */}
            <div className="mt-3">
              <InlineEditOverlay
                table="content_subtopics"
                id={contentRef}
                fields={['cover_url', 'video_url']}
                label="Editar lição"
                position="top-right"
              >
                {ytId ? (
                  <div
                    className="relative w-full rounded-2xl overflow-hidden mb-4"
                    style={{
                      aspectRatio: '16 / 9',
                      background: 'rgba(0,0,0,0.5)',
                      border:
                        '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
                      boxShadow:
                        '0 8px 32px -12px color-mix(in srgb, var(--accent) 24%, transparent)',
                    }}
                  >
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                      title="Vídeo da lição"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 0 }}
                    />
                  </div>
                ) : (
                  /* Slot vazio (sem vídeo) — só o botão de edição flutua sobre
                   *  um placeholder discreto pra que admin saiba que pode editar.
                   *  Pra não-admin, o InlineEditOverlay renderiza só children, e
                   *  como children está vazio, nada aparece. */
                  <div />
                )}
              </InlineEditOverlay>
            </div>
          </>
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
