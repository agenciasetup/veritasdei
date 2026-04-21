'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, Search, X } from 'lucide-react'
import type { SantoResumo } from '@/types/santo'
import SantoCoverFallback from '@/components/devocao/SantoCoverFallback'

export default function SantosSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SantoResumo[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/santos/buscar?q=${encodeURIComponent(q)}&limit=40`)
        if (res.ok) {
          const j = await res.json() as { santos: SantoResumo[] }
          setResults(j.santos ?? [])
        }
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const showing = query.trim().length >= 2

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl max-w-xl mx-auto"
        style={{
          background: 'rgba(16,16,16,0.7)',
          border: '1px solid rgba(242,237,228,0.14)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Search className="w-4 h-4 flex-none" style={{ color: 'rgba(242,237,228,0.6)' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar qualquer santo por nome, patronato…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(201,168,76,0.7)' }} />}
        {query && !loading && (
          <button type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
            <X className="w-4 h-4" style={{ color: 'rgba(242,237,228,0.6)' }} />
          </button>
        )}
      </div>

      {showing && !loading && results.length === 0 && (
        <div
          className="mt-6 text-sm text-center"
          style={{ color: 'rgba(242,237,228,0.55)', fontFamily: 'Poppins, sans-serif' }}
        >
          Nenhum santo encontrado para «{query}».
        </div>
      )}

      {showing && results.length > 0 && (
        <div className="mt-6">
          <div
            className="mb-3"
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: 'rgba(242,237,228,0.85)',
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Resultados ({results.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {results.map(santo => (
              <Link
                key={santo.id}
                href={`/santos/${santo.slug}`}
                className="group relative overflow-hidden rounded-xl active:scale-[0.98] transition-transform"
                style={{
                  aspectRatio: '3 / 4',
                  border: '1px solid rgba(242,237,228,0.12)',
                }}
              >
                {santo.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={santo.imagem_url}
                    alt={santo.nome}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <SantoCoverFallback nome={santo.nome} invocacao={santo.invocacao} />
                )}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 p-2.5 pt-10"
                  style={{
                    background: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.55) 60%, transparent 100%)',
                  }}
                >
                  <div
                    className="truncate"
                    style={{
                      fontFamily: 'Cinzel, Georgia, serif',
                      color: '#F2EDE4',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      lineHeight: 1.15,
                    }}
                  >
                    {santo.nome}
                  </div>
                  {santo.festa_texto && (
                    <div
                      className="truncate mt-0.5"
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        color: 'rgba(242,237,228,0.5)',
                        fontSize: '0.6rem',
                      }}
                    >
                      {santo.festa_texto}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
