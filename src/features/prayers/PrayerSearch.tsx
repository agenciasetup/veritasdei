'use client'

import { BookOpenText, Loader2, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type SearchResult = {
  id: string
  slug: string
  title: string
  subtitle: string
  snippet: string
  rank: number
  icon_name: string | null
}

const DEBOUNCE_MS = 250

/**
 * Busca textual na biblioteca de orações.
 * Chama a RPC search_prayers (sprint 1) via supabase client.
 * Resultados ranqueados com snippet destacado em <mark>.
 *
 * Não abre overlay — renderiza inline abaixo do input. Fecha ao
 * perder foco OU clicar resultado OU apertar Esc OU limpar input.
 */
export default function PrayerSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Debounced search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_prayers', {
        q,
        group_slug: 'oracoes',
      })
      if (!error && data) setResults(data as SearchResult[])
      else setResults([])
      setLoading(false)
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Esc clears + closes
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('')
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label
        className="flex items-center gap-2 rounded-2xl px-4 py-3"
        style={{
          background: 'rgba(20,18,14,0.55)',
          border: `1px solid ${open ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.15)'}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--gold)' }} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Busque: Ângelus, São Miguel, antes de dormir…"
          aria-label="Buscar oração"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: 'var(--text-primary)',
          }}
        />
        {loading ? (
          <Loader2
            className="w-4 h-4 animate-spin shrink-0"
            style={{ color: 'var(--gold)' }}
          />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults([])
              inputRef.current?.focus()
            }}
            aria-label="Limpar busca"
            className="shrink-0 transition-colors"
          >
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        ) : null}
      </label>

      {open && query.trim().length >= 2 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 rounded-2xl overflow-hidden z-30"
          style={{
            background: 'rgba(14,12,9,0.95)',
            border: '1px solid rgba(201,168,76,0.22)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          {results.length === 0 && !loading ? (
            <p
              className="text-center py-6 px-4 text-sm"
              style={{
                fontFamily: 'Poppins, sans-serif',
                color: 'var(--text-muted)',
              }}
            >
              Nenhuma oração encontrada.
            </p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/oracoes/${r.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors border-b"
                    style={{
                      borderColor: 'rgba(201,168,76,0.08)',
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-lg shrink-0 mt-0.5"
                      style={{
                        width: 32,
                        height: 32,
                        background: 'rgba(201,168,76,0.08)',
                        border: '1px solid rgba(201,168,76,0.15)',
                        color: 'var(--gold)',
                      }}
                    >
                      <BookOpenText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{
                          fontFamily: 'Cinzel, serif',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {r.title}
                      </p>
                      {r.subtitle && (
                        <p
                          className="truncate text-[11px] mt-0.5"
                          style={{
                            fontFamily: 'Poppins, sans-serif',
                            color: 'var(--text-muted)',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {r.subtitle}
                        </p>
                      )}
                      {r.snippet && (
                        <p
                          className="text-xs mt-1 leading-snug"
                          style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontStyle: 'italic',
                            color: 'var(--text-secondary)',
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitizeSnippet(r.snippet) }}
                        />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * O snippet do PostgreSQL ts_headline vem com <mark>...</mark> dourado.
 * Escapamos qualquer outra tag HTML para ser seguro.
 */
function sanitizeSnippet(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/<(?!\/?mark\b)/g, '&lt;')
    .replace(
      /<mark>/g,
      '<mark style="background:rgba(201,168,76,0.25);color:var(--gold);padding:0 2px;border-radius:2px;">'
    )
}
