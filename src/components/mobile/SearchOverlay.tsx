'use client'

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, Sparkles, ArrowUpRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { getDailyIceBreakers } from '@/lib/icebreakers'
import { useHaptic } from '@/hooks/useHaptic'

const RECENTS_KEY = 'veritasdei:search:recents'
const MAX_RECENTS = 6

const QUICK_CATEGORIES = [
  { label: 'Catecismo', href: '/catecismo-pio-x' },
  { label: 'Sacramentos', href: '/sacramentos' },
  { label: 'Mandamentos', href: '/mandamentos' },
  { label: 'Dogmas', href: '/dogmas' },
  { label: 'Orações', href: '/oracoes' },
  { label: 'Igrejas próximas', href: '/paroquias/buscar?mode=nearby' },
] as const

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

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter()
  const haptic = useHaptic()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  // Lazy init: roda 1x na mount client-side. Browser-safe via guard interno.
  const [recents, setRecents] = useState<string[]>(() => loadRecents())
  const ice = useMemo(() => getDailyIceBreakers(4), [])

  // Focus o input quando o overlay abrir; limpar query é feito via "store
  // previous" no render (sem effect → sem cascading rerenders).
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    if (wasOpen && !open && query !== '') setQuery('')
    setWasOpen(open)
  }

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

  function commitSearch(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    haptic.pulse('selection')
    const next = [trimmed, ...recents.filter((r) => r !== trimmed)].slice(0, MAX_RECENTS)
    setRecents(next)
    saveRecents(next)
    onClose()
    router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    commitSearch(query)
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
            background: 'rgba(10,9,7,0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="safe-top px-4 pt-3 pb-2">
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 rounded-2xl px-3 h-12"
              style={{
                background: 'rgba(20,18,14,0.85)',
                border: '1px solid rgba(201,168,76,0.18)',
              }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--gold)' }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no catecismo, orações, paróquias…"
                aria-label="Buscar"
                enterKeyHint="search"
                className="flex-1 h-full bg-transparent outline-none text-sm"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Cancelar"
                className="touch-target flex items-center justify-center -mr-2"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>

          <div className="px-4 pb-8 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
            {/* Recentes */}
            {recents.length > 0 && (
              <section className="mt-4">
                <div className="flex items-center justify-between px-1 mb-2">
                  <span
                    className="text-xs uppercase tracking-[0.18em]"
                    style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                  >
                    Recentes
                  </span>
                  <button
                    type="button"
                    onClick={clearRecents}
                    className="text-xs"
                    style={{ color: 'var(--gold)' }}
                  >
                    Limpar
                  </button>
                </div>
                <ul className="flex flex-col gap-1">
                  {recents.map((r) => (
                    <li key={r}>
                      <button
                        type="button"
                        onClick={() => commitSearch(r)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left active:scale-[0.99]"
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        <span className="text-sm truncate flex-1">{r}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Categorias rápidas */}
            <section className="mt-5">
              <div className="px-1 mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
                <span
                  className="text-xs uppercase tracking-[0.18em]"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                >
                  Categorias
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_CATEGORIES.map((c) => (
                  <button
                    key={c.href}
                    type="button"
                    onClick={() => {
                      haptic.pulse('tap')
                      onClose()
                      router.push(c.href)
                    }}
                    className="theme-chip active:scale-95"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Sugestões pastorais */}
            <section className="mt-6">
              <div className="px-1 mb-2 flex items-center gap-2">
                <span
                  className="text-xs uppercase tracking-[0.18em]"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                >
                  Comece por aqui
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {ice.map((ib) => (
                  <li key={ib.question}>
                    <button
                      type="button"
                      onClick={() => commitSearch(ib.question)}
                      className="w-full flex items-start gap-2 px-3 py-3 rounded-xl text-left active:scale-[0.99]"
                      style={{
                        background: 'rgba(20,18,14,0.6)',
                        border: '1px solid rgba(201,168,76,0.12)',
                      }}
                    >
                      <span
                        className="text-sm leading-relaxed flex-1"
                        style={{
                          color: 'var(--text-secondary)',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {ib.question}
                      </span>
                      <ArrowUpRight
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchOverlay
