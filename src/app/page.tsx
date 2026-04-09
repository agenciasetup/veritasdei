'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import SearchBox from '@/components/ui/SearchBox'
import PillarCard from '@/components/ui/PillarCard'
import DisclaimerBanner from '@/components/ui/DisclaimerBanner'
import { Church, Droplets, ScrollText, Tablets, BookOpen, Scale, Heart } from 'lucide-react'
import type { QueryResponse, Pillar } from '@/types'

const PILLAR_ORDER: Pillar[] = ['biblia', 'magisterio', 'patristica']

const FEATURES = [
  { href: '/dogmas', icon: Church, title: 'Dogmas', desc: '44 verdades de fé reveladas', color: '#C9A84C' },
  { href: '/sacramentos', icon: Droplets, title: 'Sacramentos', desc: '7 sinais eficazes da graça', color: '#C9A84C' },
  { href: '/preceitos', icon: ScrollText, title: 'Preceitos', desc: '5 mandamentos da Igreja', color: '#C9A84C' },
  { href: '/mandamentos', icon: Tablets, title: 'Mandamentos', desc: '10 leis de Deus', color: '#C9A84C' },
  { href: '/oracoes', icon: BookOpen, title: 'Orações', desc: '8 orações fundamentais', color: '#C9A84C' },
  { href: '/virtudes-pecados', icon: Scale, title: 'Virtudes e Pecados', desc: '14 virtudes e vícios capitais', color: '#C9A84C' },
  { href: '/obras-misericordia', icon: Heart, title: 'Obras de Misericórdia', desc: '14 ações de caridade', color: '#C9A84C' },
]

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
          HERO — Search section
          ══════════════════════════════════════════════ */}
      <section
        className={`relative z-10 flex flex-col items-center transition-all duration-700 ease-out ${
          !hasResponse
            ? 'min-h-[85vh] justify-center'
            : 'pt-6'
        }`}
      >
        <Header />

        <div className={`w-full ${!hasResponse ? 'mt-10' : 'mt-4'}`}>
          <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        </div>

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
          FEATURE NAVIGATION — All 7 features
          ══════════════════════════════════════════════ */}
      {!hasResponse && !isLoading && (
        <section className="relative z-10 w-full px-4 md:px-8 pb-16 fade-in">
          <div className="max-w-6xl mx-auto">
            <div className="ornament-divider max-w-sm mx-auto mb-10">
              <span style={{ fontSize: '0.7rem' }}>&#10022;</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {FEATURES.map((item, i) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="feature-card group text-center flex flex-col items-center fade-in"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: 'rgba(201,168,76,0.08)',
                        border: '1px solid rgba(201,168,76,0.15)',
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: '#C9A84C' }} />
                    </div>
                    <h3
                      className="text-lg font-bold tracking-wide uppercase mb-2"
                      style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {item.desc}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

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

          {/* Pillar grid */}
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
      <footer className="relative z-10 py-10 text-center mt-auto">
        <div className="flex items-center justify-center gap-3 mb-3 max-w-[200px] mx-auto">
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
