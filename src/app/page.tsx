'use client'

import { useState, useRef } from 'react'
import Header from '@/components/layout/Header'
import SearchBox from '@/components/ui/SearchBox'
import PillarCard from '@/components/ui/PillarCard'
import DisclaimerBanner from '@/components/ui/DisclaimerBanner'
import type { QueryResponse, Pillar } from '@/types'

const PILLAR_ORDER: Pillar[] = ['biblia', 'magisterio', 'patristica']

export default function Home() {
  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  async function handleSearch(query: string) {
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

      // Scroll suave para os resultados
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const hasResponse = response !== null

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className={`flex-1 flex flex-col px-4 pb-12 ${!hasResponse ? 'justify-center' : 'pt-6'}`}>
        <div className={!hasResponse ? 'mb-8' : 'mb-8'}>
          <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {error && (
          <div className="w-full max-w-2xl mx-auto mb-6">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}

        {(hasResponse || isLoading) && (
          <div ref={resultsRef} className="w-full max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PILLAR_ORDER.map((pillar) => {
                const pillarData = response?.pillars.find(p => p.pillar === pillar)
                return (
                  <PillarCard
                    key={pillar}
                    pillar={pillar}
                    results={pillarData?.results ?? []}
                    isLoading={isLoading}
                  />
                )
              })}
            </div>

            <DisclaimerBanner visible={response?.sensitive ?? false} />
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        Veritas Dei — A IA organiza, não ensina. Consulte sempre as fontes.
      </footer>
    </div>
  )
}
