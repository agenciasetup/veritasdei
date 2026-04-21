'use client'

import { X } from 'lucide-react'
import StudyLessonsTree from './StudyLessonsTree'
import type { PillarTreeNode } from '@/lib/study/usePillarTree'

interface Props {
  pillarSlug: string
  pillarTitle: string
  topics: PillarTreeNode[]
  activeTopicSlug?: string
  activeSubtopicSlug?: string
  studiedIds: Set<string>
  /**
   * `inline` = renderizado como coluna lateral (aside sticky em desktop);
   * `drawer` = renderizado como overlay deslizante da direita (mobile/tablet).
   */
  variant?: 'inline' | 'drawer'
  open?: boolean
  onClose?: () => void
}

/**
 * Wrapper que serve tanto como aside sticky (desktop lg+) quanto como
 * drawer modal (mobile/tablet). No modo `inline` o componente é
 * posicionado pelo container pai (StudyLayout já fornece sticky).
 */
export default function StudyLessonsSidebar({
  pillarSlug,
  pillarTitle,
  topics,
  activeTopicSlug,
  activeSubtopicSlug,
  studiedIds,
  variant = 'inline',
  open,
  onClose,
}: Props) {
  if (variant === 'drawer') {
    if (!open) return null
    return (
      <div
        className="fixed inset-0 z-[60] flex"
        role="dialog"
        aria-modal="true"
        aria-label="Índice de lições"
      >
        <button
          type="button"
          className="flex-1 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Fechar índice"
        />
        <aside
          className="w-full max-w-sm flex flex-col h-full overflow-hidden"
          style={{
            background: 'rgba(15,14,12,0.98)',
            borderLeft: '1px solid rgba(201,168,76,0.18)',
          }}
        >
          <header
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(201,168,76,0.12)' }}
          >
            <span
              className="text-xs tracking-[0.15em] uppercase"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
            >
              Lições
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95"
              style={{
                color: 'var(--text-2)',
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.15)',
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto py-4 px-2">
            <StudyLessonsTree
              pillarSlug={pillarSlug}
              pillarTitle={pillarTitle}
              topics={topics}
              activeTopicSlug={activeTopicSlug}
              activeSubtopicSlug={activeSubtopicSlug}
              studiedIds={studiedIds}
              onNavigate={onClose}
            />
          </div>
        </aside>
      </div>
    )
  }

  // inline
  return (
    <StudyLessonsTree
      pillarSlug={pillarSlug}
      pillarTitle={pillarTitle}
      topics={topics}
      activeTopicSlug={activeTopicSlug}
      activeSubtopicSlug={activeSubtopicSlug}
      studiedIds={studiedIds}
    />
  )
}
