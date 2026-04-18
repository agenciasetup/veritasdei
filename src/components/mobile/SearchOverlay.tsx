'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Clock } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import SearchPrompt from '@/components/search/SearchPrompt'
import { useHaptic } from '@/hooks/useHaptic'

const RECENTS_KEY = 'veritasdei:search:recents'
const MAX_RECENTS = 6

function loadRecents(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : []
  } catch {
    return []
  }
}

function saveRecents(list: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)))
  } catch {}
}

interface SearchOverlayProps {
  open: boolean
  onClose: () => void
}

/**
 * Overlay da lupa na home. Foco numa única ação: pesquisar.
 * Sem blocos de categorias ou sugestões pastorais — isso mora em /aprender.
 */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter()
  const haptic = useHaptic()
  const [recents, setRecents] = useState<string[]>(() => loadRecents())

  // ESC fecha
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  function commit(q: string) {
    const next = [q, ...recents.filter((r) => r !== q)].slice(0, MAX_RECENTS)
    setRecents(next)
    saveRecents(next)
    onClose()
    router.push(`/buscar?q=${encodeURIComponent(q)}`)
  }

  function clearRecents() {
    setRecents([])
    saveRecents([])
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Buscar"
          style={{
            background: 'rgba(10,9,7,0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div className="safe-top flex items-center justify-end px-4 pt-3">
            <button
              type="button"
              onClick={() => {
                haptic.pulse('tap')
                onClose()
              }}
              aria-label="Fechar"
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-primary)',
              }}
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>

          <div className="pb-8 overflow-y-auto" style={{ height: 'calc(100% - 64px)' }}>
            <SearchPrompt autoFocus onSubmit={commit} />

            {recents.length > 0 && (
              <section className="mt-7 max-w-2xl mx-auto px-5">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[11px] uppercase"
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      letterSpacing: '0.14em',
                      fontWeight: 500,
                    }}
                  >
                    Recentes
                  </span>
                  <button
                    type="button"
                    onClick={clearRecents}
                    className="text-[12px] active:scale-95 transition-transform"
                    style={{ color: 'var(--gold-light)', fontFamily: 'var(--font-body)' }}
                  >
                    Limpar
                  </button>
                </div>
                <ul className="flex flex-col">
                  {recents.map((r, i) => (
                    <li key={r}>
                      <button
                        type="button"
                        onClick={() => commit(r)}
                        className="w-full flex items-center gap-3 py-3 text-left active:opacity-70"
                        style={{
                          borderBottom:
                            i < recents.length - 1
                              ? '1px solid rgba(255,255,255,0.04)'
                              : 'none',
                        }}
                      >
                        <Clock
                          className="w-[15px] h-[15px] flex-shrink-0"
                          strokeWidth={1.8}
                          style={{ color: 'var(--text-muted)' }}
                        />
                        <span
                          className="text-[14px] truncate flex-1"
                          style={{
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {r}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchOverlay
