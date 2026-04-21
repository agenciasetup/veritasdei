'use client'

import { useEffect, useMemo, useState } from 'react'
import StudyLessonNode from './StudyLessonNode'
import type { PillarTreeNode } from '@/lib/study/usePillarTree'

interface Props {
  pillarSlug: string
  pillarTitle: string
  topics: PillarTreeNode[]
  activeTopicSlug?: string
  activeSubtopicSlug?: string
  studiedIds: Set<string>
  /** Chamado ao clicar um subtópico — útil para fechar o drawer em mobile */
  onNavigate?: () => void
}

const STORAGE_KEY = (pillarSlug: string) => `veritasdei:study:toc:open:${pillarSlug}`

/**
 * Árvore de lições do pilar. Abre o tópico ativo por padrão; demais
 * seguem o estado persistido em localStorage (por pilar).
 */
export default function StudyLessonsTree({
  pillarSlug,
  pillarTitle,
  topics,
  activeTopicSlug,
  activeSubtopicSlug,
  studiedIds,
  onNavigate,
}: Props) {
  const [openTopics, setOpenTopics] = useState<Set<string>>(() => new Set())
  const [hydrated, setHydrated] = useState(false)

  // Hydrate da storage na primeira render client-side.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY(pillarSlug))
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setOpenTopics(new Set(arr))
      }
    } catch {
      /* ok */
    }
    setHydrated(true)
  }, [pillarSlug])

  // Auto-expande o tópico ativo. Não fecha outros — respeita preferência do usuário.
  useEffect(() => {
    if (!activeTopicSlug) return
    setOpenTopics((prev) => {
      if (prev.has(activeTopicSlug)) return prev
      const next = new Set(prev)
      next.add(activeTopicSlug)
      return next
    })
  }, [activeTopicSlug])

  // Persiste.
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        STORAGE_KEY(pillarSlug),
        JSON.stringify(Array.from(openTopics)),
      )
    } catch {
      /* ok */
    }
  }, [openTopics, pillarSlug, hydrated])

  const totalStudied = useMemo(() => {
    let c = 0
    for (const t of topics) for (const s of t.subtopics) if (studiedIds.has(s.id)) c++
    return c
  }, [topics, studiedIds])
  const totalSubs = useMemo(
    () => topics.reduce((acc, t) => acc + t.subtopics.length, 0),
    [topics],
  )

  function toggle(slug: string) {
    setOpenTopics((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <nav aria-label="Lições do pilar" className="flex flex-col">
      <header className="px-3 pb-3 mb-2" style={{ borderBottom: '1px solid var(--border-2)' }}>
        <p
          className="text-[10px] tracking-[0.2em] uppercase"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Pilar
        </p>
        <h2
          className="text-sm tracking-[0.06em] uppercase mt-1"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-1)',
            fontWeight: 700,
          }}
        >
          {pillarTitle}
        </h2>
        {totalSubs > 0 ? (
          <p
            className="text-[11px] mt-1 tabular-nums"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            {totalStudied}/{totalSubs} lições estudadas
          </p>
        ) : null}
      </header>

      <div className="flex flex-col">
        {topics.map((topic) => (
          <StudyLessonNode
            key={topic.id}
            pillarSlug={pillarSlug}
            topic={topic}
            isOpen={openTopics.has(topic.slug)}
            onToggle={() => toggle(topic.slug)}
            activeSubtopicSlug={
              activeTopicSlug === topic.slug ? activeSubtopicSlug : undefined
            }
            studiedIds={studiedIds}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  )
}
