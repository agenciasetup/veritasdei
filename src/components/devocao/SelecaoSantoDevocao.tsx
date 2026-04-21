'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Check, Loader2, Search, X } from 'lucide-react'
import type { SantoResumo } from '@/types/santo'
import SantoCoverFallback from './SantoCoverFallback'

interface SelecaoSantoDevocaoProps {
  value: string | null
  onChange: (santoId: string | null, resumo: SantoResumo | null) => void
  canSkip?: boolean
  onSkip?: () => void
}

export default function SelecaoSantoDevocao({
  value,
  onChange,
  canSkip = false,
  onSkip,
}: SelecaoSantoDevocaoProps) {
  const [top30, setTop30] = useState<SantoResumo[]>([])
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SantoResumo[]>([])
  const [loadingTop, setLoadingTop] = useState(true)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingTop(true)
    fetch('/api/santos/buscar?top=1', { cache: 'force-cache' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then((j: { santos: SantoResumo[] }) => {
        if (!cancelled) setTop30(j.santos ?? [])
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro ao carregar santos')
      })
      .finally(() => {
        if (!cancelled) setLoadingTop(false)
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSearchResults([])
      setLoadingSearch(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const res = await fetch(`/api/santos/buscar?q=${encodeURIComponent(q)}&limit=40`)
        if (!res.ok) throw new Error(String(res.status))
        const j = await res.json() as { santos: SantoResumo[] }
        setSearchResults(j.santos ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro na busca')
      } finally {
        setLoadingSearch(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const isSearching = query.trim().length >= 2
  const list = isSearching ? searchResults : top30

  const handleSelect = useCallback((santo: SantoResumo) => {
    if (value === santo.id) {
      onChange(null, null)
    } else {
      onChange(santo.id, santo)
      if (navigator.vibrate) navigator.vibrate(10)
    }
  }, [value, onChange])

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Busca */}
      <div className="relative">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
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
            placeholder="Buscar por nome, patronato ou invocação…"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="flex-none p-0.5 rounded-full touch-target"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" style={{ color: 'rgba(242,237,228,0.6)' }} />
            </button>
          )}
        </div>
        {loadingSearch && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'rgba(201,168,76,0.7)' }} />
          </div>
        )}
      </div>

      {/* Título da seção */}
      {!isSearching && (
        <div
          style={{
            fontFamily: 'Cinzel, Georgia, serif',
            color: 'rgba(242,237,228,0.85)',
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Santos em destaque
        </div>
      )}

      {isSearching && !loadingSearch && searchResults.length === 0 && (
        <div
          className="text-sm py-6 text-center"
          style={{ color: 'rgba(242,237,228,0.55)', fontFamily: 'Poppins, sans-serif' }}
        >
          Nenhum santo encontrado para «{query}».
        </div>
      )}

      {loadingTop && !isSearching && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-xl animate-pulse"
              style={{ background: 'rgba(16,16,16,0.5)' }}
            />
          ))}
        </div>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {list.map(santo => {
            const selected = value === santo.id
            return (
              <button
                key={santo.id}
                type="button"
                onClick={() => handleSelect(santo)}
                className="group relative overflow-hidden rounded-xl text-left active:scale-[0.98] transition-transform"
                style={{
                  aspectRatio: '3 / 4',
                  border: selected
                    ? '2px solid rgb(201,168,76)'
                    : '1px solid rgba(242,237,228,0.12)',
                  boxShadow: selected ? '0 0 0 2px rgba(201,168,76,0.25)' : undefined,
                }}
              >
                {santo.imagem_url ? (
                  <Image
                    src={santo.imagem_url}
                    alt={santo.nome}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <SantoCoverFallback nome={santo.nome} invocacao={santo.invocacao} />
                )}
                {/* Overlay gradient */}
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
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      lineHeight: 1.15,
                    }}
                  >
                    {santo.nome}
                  </div>
                  {santo.patronatos && santo.patronatos.length > 0 && (
                    <div
                      className="truncate mt-0.5"
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        color: 'rgba(242,237,228,0.65)',
                        fontSize: '0.65rem',
                      }}
                    >
                      {santo.patronatos.slice(0, 2).join(' · ')}
                    </div>
                  )}
                </div>
                {selected && (
                  <div
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgb(201,168,76)',
                      color: '#0A0A0A',
                    }}
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Pular */}
      {canSkip && onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="self-center mt-2 px-4 py-2 rounded-xl text-sm touch-target-lg active:scale-95"
          style={{
            background: 'transparent',
            color: 'rgba(242,237,228,0.6)',
            fontFamily: 'Poppins, sans-serif',
            border: '1px solid rgba(242,237,228,0.14)',
          }}
        >
          Decidir depois
        </button>
      )}

      {error && (
        <div
          className="text-xs px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(180,40,40,0.15)',
            color: 'rgb(220,140,140)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
