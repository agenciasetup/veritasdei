'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchBox from '@/components/ui/SearchBox'
import SearchResults from '@/components/dashboard/SearchResults'
import CatechismPopup from '@/components/ui/CatechismPopup'
import AuthGuard from '@/components/auth/AuthGuard'
import type { QueryResponse } from '@/types'
import { getDailyIceBreakers } from '@/lib/icebreakers'
import { useAuth } from '@/contexts/AuthContext'
import { getDisplayName } from '@/lib/greetings'

function buildPastoralGreeting(name: string) {
  const hour = new Date().getHours()
  if (hour < 12) return `Bom dia, ${name}. Qual sua dúvida hoje?`
  if (hour < 18) return `A paz de Cristo, ${name}. Vamos conversar?`
  return `Boa noite, ${name}. Qual sua dúvida hoje?`
}

function BuscarInner() {
  const searchParams = useSearchParams()
  const { profile } = useAuth()

  const initialQuery = searchParams.get('q') ?? ''
  const displayName = getDisplayName(profile?.vocacao, profile?.name ?? null) || 'irmão(ã)'

  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [catechismPopup, setCatechismPopup] = useState<{
    ref: string
    rect: DOMRect | null
  } | null>(null)
  const ranInitialRef = useRef(false)

  const iceBreakers = useMemo(() => getDailyIceBreakers(6), [])

  const handleSearch = useCallback(async (query: string) => {
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
        const data = (await res.json()) as { error?: string }
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
  }, [])

  useEffect(() => {
    if (ranInitialRef.current) return
    if (initialQuery) {
      ranInitialRef.current = true
      void handleSearch(initialQuery)
    }
  }, [initialQuery, handleSearch])

  function handleRelatedClick(topic: string) {
    void handleSearch(topic)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCitationClick(reference: string, rect: DOMRect) {
    setCatechismPopup({ ref: reference, rect })
  }

  const hasResponse = Boolean(response) || isLoading || Boolean(error)

  return (
    <main className="min-h-screen pb-24">
      {catechismPopup && (
        <CatechismPopup
          reference={catechismPopup.ref}
          anchorRect={catechismPopup.rect}
          onClose={() => setCatechismPopup(null)}
        />
      )}

      {!hasResponse ? (
        <section className="px-4 max-w-3xl mx-auto min-h-[68vh] flex flex-col justify-center">
          <div className="text-center mb-8">
            <p
              className="text-2xl md:text-3xl leading-tight tracking-[0.04em]"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
              }}
            >
              {buildPastoralGreeting(displayName)}
            </p>
            <p
              className="text-sm mt-3"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Pergunte com liberdade. Eu respondo com base na fé católica e nas fontes.
            </p>
          </div>

          <SearchBox
            onSearch={handleSearch}
            isLoading={isLoading}
            hideChips
            placeholderText="Alguma dúvida?"
            initialValue={initialQuery}
          />

          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {iceBreakers.map((item) => (
              <button
                key={item.question}
                type="button"
                onClick={() => void handleSearch(item.question)}
                className="px-4 py-2 rounded-xl text-sm active:scale-[0.97] transition-transform"
                style={{
                  minHeight: 44,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-1)',
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {item.question}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="px-4 pt-6 max-w-2xl mx-auto">
            <p
              className="text-sm mb-3"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              {buildPastoralGreeting(displayName)}
            </p>
            <SearchBox
              onSearch={handleSearch}
              isLoading={isLoading}
              hideChips
              placeholderText="Alguma dúvida?"
              initialValue={initialQuery}
            />
          </section>

          {error && (
            <div className="px-4 max-w-2xl mx-auto mt-4">
              <div
                className="px-6 py-4 text-center rounded-2xl"
                style={{
                  background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--danger)', fontFamily: 'var(--font-body)' }}
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
        </>
      )}
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
