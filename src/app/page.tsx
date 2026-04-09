'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import SearchBox from '@/components/ui/SearchBox'
import PillarCard from '@/components/ui/PillarCard'
import DisclaimerBanner from '@/components/ui/DisclaimerBanner'
import { Church, Droplets, ScrollText, Tablets, BookOpen, Scale, Heart, Sparkles, Lightbulb, ArrowRight } from 'lucide-react'
import type { QueryResponse, Pillar } from '@/types'

const PILLAR_ORDER: Pillar[] = ['biblia', 'magisterio', 'patristica']

const FEATURES = [
  { href: '/dogmas', icon: Church, title: 'Dogmas', desc: '44 verdades de fé reveladas' },
  { href: '/sacramentos', icon: Droplets, title: 'Sacramentos', desc: '7 sinais eficazes da graça' },
  { href: '/preceitos', icon: ScrollText, title: 'Preceitos', desc: '5 mandamentos da Igreja' },
  { href: '/mandamentos', icon: Tablets, title: 'Mandamentos', desc: '10 leis de Deus' },
  { href: '/oracoes', icon: BookOpen, title: 'Orações', desc: '8 orações fundamentais' },
  { href: '/virtudes-pecados', icon: Scale, title: 'Virtudes e Pecados', desc: '14 virtudes e vícios capitais' },
  { href: '/obras-misericordia', icon: Heart, title: 'Obras de Misericórdia', desc: '14 ações de caridade' },
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

  function handleRelatedClick(topic: string) {
    handleSearch(topic)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasResponse = response !== null
  const insight = response?.insight

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {/* ══════════════════════════════════════════════
          HERO — Full header when no results
          ══════════════════════════════════════════════ */}
      {!hasResponse && !isLoading && (
        <section className="relative z-10 flex flex-col items-center min-h-[85vh] justify-center transition-all duration-700 ease-out">
          <Header />
          <div className="w-full mt-10">
            <SearchBox onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          COMPACT SEARCH — When results are showing
          ══════════════════════════════════════════════ */}
      {(hasResponse || isLoading) && (
        <section
          className="relative z-10 w-full pt-5 pb-4 px-4 md:px-8"
          style={{
            background: 'rgba(10,10,10,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(201,168,76,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div className="flex items-center gap-4 max-w-full mx-auto">
            <span
              className="text-lg font-bold tracking-widest uppercase flex-shrink-0 hidden md:block"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Veritas Dei
            </span>
            <span
              className="flex-shrink-0 md:hidden"
              style={{ color: '#C9A84C', fontSize: '1.2rem' }}
            >
              ✝
            </span>
            <div className="flex-1">
              <SearchBox onSearch={handleSearch} isLoading={isLoading} hideChips />
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="relative z-10 w-full max-w-3xl mx-auto mt-6 px-4">
          <div
            className="glass-card px-6 py-4 text-center"
            style={{ borderColor: 'rgba(107, 29, 42, 0.3)' }}
          >
            <p className="text-sm" style={{ color: '#8B3145', fontFamily: 'Poppins, sans-serif' }}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FEATURE NAVIGATION
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
                    <p className="text-sm leading-relaxed" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
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
          RESULTS — AI Summary + Sources
          ══════════════════════════════════════════════ */}
      {(hasResponse || isLoading) && (
        <section ref={resultsRef} className="relative z-10 w-full px-4 md:px-6 lg:px-8 pb-16 pt-6 flex-1">

          {/* ── AI Summary Card ── */}
          {insight && insight.summary && (
            <div
              className="w-full max-w-4xl mx-auto mb-8 rounded-2xl p-8 md:p-10 fade-in"
              style={{
                background: 'rgba(16,16,16,0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(201,168,76,0.15)',
                boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: '#C9A84C' }} />
                </div>
                <div>
                  <h2
                    className="text-lg font-bold"
                    style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                  >
                    O que a Igreja ensina sobre isso
                  </h2>
                  <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
                    Síntese gerada a partir das fontes abaixo
                  </p>
                </div>
              </div>

              {/* Summary text with inline citations */}
              <div
                className="text-base md:text-lg leading-[2] mb-8"
                style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
              >
                {insight.summary.split(/(\[[^\]]+\])/).map((part, i) => {
                  if (part.startsWith('[') && part.endsWith(']')) {
                    return (
                      <span
                        key={i}
                        className="text-sm font-medium px-1 py-0.5 rounded mx-0.5"
                        style={{
                          color: '#C9A84C',
                          background: 'rgba(201,168,76,0.08)',
                          fontFamily: 'Cinzel, serif',
                          fontSize: '0.75em',
                        }}
                      >
                        {part}
                      </span>
                    )
                  }
                  return <span key={i}>{part}</span>
                })}
              </div>

              {/* Key Points */}
              {insight.keyPoints.length > 0 && (
                <div
                  className="rounded-xl p-6 mb-6"
                  style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.08)' }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-4 h-4" style={{ color: '#C9A84C' }} />
                    <h3
                      className="text-xs tracking-[0.15em] uppercase"
                      style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
                    >
                      Pontos-Chave
                    </h3>
                  </div>
                  <ul className="space-y-3">
                    {insight.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: '#C9A84C' }}
                        />
                        <span
                          className="text-sm leading-relaxed"
                          style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
                        >
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Topics */}
              {insight.relatedTopics.length > 0 && (
                <div>
                  <h3
                    className="text-xs tracking-[0.15em] uppercase mb-3"
                    style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}
                  >
                    Aprofunde
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {insight.relatedTopics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => handleRelatedClick(topic)}
                        className="theme-chip inline-flex items-center gap-1.5 !text-xs"
                      >
                        {topic}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Loading state for AI summary ── */}
          {isLoading && (
            <div
              className="w-full max-w-4xl mx-auto mb-8 rounded-2xl p-8 md:p-10"
              style={{
                background: 'rgba(16,16,16,0.8)',
                border: '1px solid rgba(201,168,76,0.1)',
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="skeleton w-10 h-10 !rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-5 w-64" />
                  <div className="skeleton h-3 w-40" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-[95%]" />
                <div className="skeleton h-4 w-[88%]" />
                <div className="skeleton h-4 w-[92%]" />
                <div className="skeleton h-4 w-[70%]" />
              </div>
            </div>
          )}

          {/* ── Section divider: Sources ── */}
          {(hasResponse || isLoading) && (
            <div className="max-w-4xl mx-auto mb-6">
              <h3
                className="text-xs tracking-[0.2em] uppercase text-center"
                style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}
              >
                Fontes consultadas
              </h3>
              <div className="ornament-divider max-w-xs mx-auto" style={{ margin: '0.75rem auto' }}>
                <span style={{ fontSize: '0.6rem' }}>&#10022;</span>
              </div>
            </div>
          )}

          {/* ── Pillar Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6" style={{ alignItems: 'start' }}>
            {PILLAR_ORDER.map((pillar, i) => {
              const pillarData = response?.pillars.find(p => p.pillar === pillar)
              return (
                <div
                  key={pillar}
                  className="fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
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
