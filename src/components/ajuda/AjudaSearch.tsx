'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { searchFeatures, getCategoria } from '@/data/ajuda'
import AjudaIcon from './AjudaIcon'

export default function AjudaSearch() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchFeatures(query), [query])
  const showResults = query.trim().length >= 2

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-center gap-2 px-3 rounded-2xl"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-1)',
          minHeight: '46px',
        }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-3)' }} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ajuda (ex: novena, terço, perfil)"
          className="flex-1 bg-transparent outline-none text-sm py-2"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-body)',
          }}
          aria-label="Buscar na ajuda"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1 rounded-full active:scale-90"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" style={{ color: 'var(--text-3)' }} />
          </button>
        )}
      </div>

      {showResults && (
        <div className="flex flex-col gap-1.5">
          {results.length === 0 ? (
            <p
              className="text-center text-sm py-6"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Nada encontrado para "{query}".
            </p>
          ) : (
            results.map((f) => {
              const cat = getCategoria(f.categoria)
              return (
                <Link
                  key={`${f.categoria}-${f.slug}`}
                  href={`/ajuda/${f.categoria}/${f.slug}`}
                  className="flex items-center gap-3 p-3 rounded-xl active:scale-[0.985]"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-1)',
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'var(--surface-3)',
                      color: 'var(--text-2)',
                    }}
                  >
                    <AjudaIcon name={f.icone} className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[14px] truncate"
                      style={{
                        color: 'var(--text-1)',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                      }}
                    >
                      {f.titulo}
                    </p>
                    <p
                      className="text-[12px] truncate"
                      style={{
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {cat?.titulo} · {f.resumo}
                    </p>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
