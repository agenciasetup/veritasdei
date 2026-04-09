'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
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
    <div className="flex flex-col min-h-screen relative">
      {/* Background glow */}
      <div className="bg-glow" />

      {/* ══════════════════════════════════════════════
          HERO — Search section (90vh when no results)
          ══════════════════════════════════════════════ */}
      <section
        className={`relative z-10 flex flex-col items-center transition-all duration-700 ease-out ${
          !hasResponse
            ? 'min-h-[90vh] justify-center'
            : 'pt-6'
        }`}
      >
        <Header />

        <div className={`w-full ${!hasResponse ? 'mt-8' : 'mt-4'}`}>
          <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Feature Navigation */}
        {!hasResponse && !isLoading && (
          <nav className="w-full max-w-3xl mx-auto mt-10 px-4 fade-in">
            <div className="ornament-divider mb-6">
              <span style={{ fontSize: '0.7rem' }}>&#10022;</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: '/dogmas', icon: '⛪', title: 'Dogmas', desc: '44 verdades de fé' },
                { href: '/sacramentos', icon: '🕯', title: 'Sacramentos', desc: '7 sinais da graça' },
                { href: '/preceitos', icon: '📜', title: 'Preceitos', desc: '5 mandamentos da Igreja' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="glass-card p-5 text-center transition-all duration-300 hover:scale-[1.03] block"
                >
                  <span className="text-2xl block mb-2">{item.icon}</span>
                  <h3
                    className="text-base font-bold tracking-wide uppercase"
                    style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                    {item.desc}
                  </p>
                </Link>
              ))}
            </div>
          </nav>
        )}

        {error && (
          <div className="w-full max-w-3xl mx-auto mt-6 px-4">
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
      </section>

      {/* ══════════════════════════════════════════════
          RESULTS — Pillar cards
          ══════════════════════════════════════════════ */}
      {(hasResponse || isLoading) && (
        <section ref={resultsRef} className="relative z-10 w-full px-4 md:px-8 pb-16 mt-8">
          {/* Section header */}
          <div className="max-w-7xl mx-auto mb-8">
            <div className="ornament-divider">
              <span style={{ fontSize: '0.8rem' }}>&#9766;</span>
            </div>
          </div>

          {/* Pillar grid — large, spacious blocks */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {PILLAR_ORDER.map((pillar, i) => {
              const pillarData = response?.pillars.find(p => p.pillar === pillar)
              return (
                <div
                  key={pillar}
                  className="fade-in"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <PillarCard
                    pillar={pillar}
                    results={pillarData?.results ?? []}
                    isLoading={isLoading}
                  />
                </div>
              )
            })}
          </div>

          <DisclaimerBanner visible={response?.sensitive ?? false} />
        </section>
      )}

      {/* ══════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════ */}
      <footer className="relative z-10 py-8 text-center mt-auto">
        <div className="flex items-center justify-center gap-3 mb-2 max-w-[200px] mx-auto">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.15)]" />
          <span style={{ color: '#C9A84C', opacity: 0.4, fontSize: '0.6rem' }}>&#10022;</span>
          <span className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.15)]" />
        </div>
        <p
          className="text-xs tracking-wider"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.1em' }}
        >
          Veritas Dei — A IA organiza, não ensina. Consulte sempre as fontes.
        </p>
      </footer>
    </div>
  )
}
