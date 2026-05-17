'use client'

import Link from 'next/link'
import { ChevronDown, ChevronRight, Check, Circle } from 'lucide-react'
import type { PillarTreeNode } from '@/lib/study/usePillarTree'

interface Props {
  pillarSlug: string
  topic: PillarTreeNode
  isOpen: boolean
  onToggle: () => void
  activeSubtopicSlug: string | undefined
  studiedIds: Set<string>
  onNavigate?: () => void
}

export default function StudyLessonNode({
  pillarSlug,
  topic,
  isOpen,
  onToggle,
  activeSubtopicSlug,
  studiedIds,
  onNavigate,
}: Props) {
  const studiedCount = topic.subtopics.filter((s) => studiedIds.has(s.id)).length
  const total = topic.subtopics.length
  const Chevron = isOpen ? ChevronDown : ChevronRight

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
        style={{
          color: 'var(--text-2)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <Chevron
          className="w-4 h-4 flex-shrink-0 transition-transform"
          style={{ color: 'var(--text-3)' }}
        />
        <span
          className="text-xs tracking-[0.08em] uppercase flex-1 truncate"
          style={{ fontWeight: 600 }}
        >
          {topic.title}
        </span>
        {total > 0 ? (
          <span
            className="text-[10px] tabular-nums flex-shrink-0"
            style={{ color: 'var(--text-3)' }}
          >
            {studiedCount}/{total}
          </span>
        ) : null}
      </button>

      {isOpen && total > 0 ? (
        <ul className="mt-0.5 mb-2 pl-4">
          {topic.subtopics.map((sub) => {
            const isActive = activeSubtopicSlug === sub.slug
            const isStudied = studiedIds.has(sub.id)
            return (
              <li key={sub.id}>
                <Link
                  href={`/estudo/${pillarSlug}/${topic.slug}/${sub.slug}`}
                  onClick={onNavigate}
                  title={sub.title}
                  className="group flex items-start gap-2 pl-3 pr-2 py-1.5 rounded-md text-sm transition-colors relative"
                  style={{
                    color: isActive ? 'var(--accent)' : 'var(--text-2)',
                    fontFamily: 'var(--font-body)',
                    background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                  }}
                >
                  {isActive ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  ) : null}
                  {isStudied ? (
                    <Check
                      className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                      style={{ color: 'var(--accent)' }}
                    />
                  ) : (
                    <Circle
                      className="w-3 h-3 flex-shrink-0 mt-1"
                      style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)', opacity: 0.5 }}
                    />
                  )}
                  <span className="flex-1 line-clamp-2 leading-snug">{sub.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
