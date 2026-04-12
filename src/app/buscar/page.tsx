'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SearchBox from '@/components/ui/SearchBox'
import SearchResults from '@/components/dashboard/SearchResults'
import CatechismPopup from '@/components/ui/CatechismPopup'
import AuthGuard from '@/components/auth/AuthGuard'
import HubHeader from '@/components/hubs/HubHeader'
import type { QueryResponse } from '@/types'

/**
 * Página dedicada de busca. Substitui o modo "busca inline na home".
 *
 * Aceita `?q=...` para abertura deep-link (IceBreakers linkam aqui).
 * Mantém o mesmo endpoint `/api/search` que já era usado.
 */
function BuscarInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') ?? ''

  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [catechismPopup, setCatechismPopup] = useState<{
    ref: string
    rect: DOMRect | null
  } | null>(null)
  const ranInitialRef = useRef(false)

  async function handleSearch(query: string) {
    if (!query.trim()) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao consultar as fontes.')
      }
      const data: QueryResponse = await res.json()
      setResponse(data)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Deep-link: busca automática se veio com ?q=
  useEffect(() => {
    if (ranInitialRef.current) return
    if (initialQuery) {
      ranInitialRef.current = true
      void handleSearch(initialQuery)
    }
  }, [initialQuery])

  function handleRelatedClick(topic: string) {
    void handleSearch(topic)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCitationClick(reference: string, rect: DOMRect) {
    setCatechismPopup({ ref: reference, rect })
  }

  return (
    <main className="min-h-screen pb-24">
      {catechismPopup && (
        <CatechismPopup
          reference={catechismPopup.ref}
          anchorRect={catechismPopup.rect}
          onClose={() => setCatechismPopup(null)}
        />
      )}

      <HubHeader title="Buscar" subtitle="Pergunte o que a Igreja ensina" />

      <div className="px-4 max-w-2xl mx-auto">
        <SearchBox onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {error && (
        <div className="px-4 max-w-2xl mx-auto mt-4">
          <div
            className="glass-card px-6 py-4 text-center"
            style={{ borderColor: 'rgba(107, 29, 42, 0.3)' }}
          >
            <p
              className="text-sm"
              style={{ color: '#8B3145', fontFamily: 'Poppins, sans-serif' }}
            >
              {error}
            </p>
          </div>
        </div>
      )}

      <div ref={resultsRef}>
        {(response || isLoading) && (
          <SearchResults
            response={response}
            isLoading={isLoading}
            onRelatedClick={handleRelatedClick}
            onCitationClick={handleCitationClick}
          />
        )}
      </div>
    </main>
  )
}

export default function BuscarPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen" />}>
        <BuscarInner />
      </Suspense>
    </AuthGuard>
  )
}
