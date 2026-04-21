'use client'

import { Menu } from 'lucide-react'

interface Props {
  currentIndex: number
  total: number
  onOpen: () => void
}

/**
 * Chip no topo do conteúdo em telas <lg que abre o TOC como drawer.
 * Mostra progresso atual "Lição 3 · 12" para contexto imediato.
 */
export default function StudyMobileChip({ currentIndex, total, onOpen }: Props) {
  return (
    <div className="lg:hidden px-4 md:px-6 pt-2">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir índice — lição ${currentIndex} de ${total}`}
        className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl active:scale-[0.98] transition-transform"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
          color: 'var(--text-2)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <span className="inline-flex items-center gap-2.5 text-xs tracking-[0.12em] uppercase">
          <Menu className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          Lições
        </span>
        {total > 0 ? (
          <span
            className="text-[11px] tabular-nums"
            style={{ color: 'var(--text-3)' }}
          >
            {currentIndex} de {total}
          </span>
        ) : null}
      </button>
    </div>
  )
}
