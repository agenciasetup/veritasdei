'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

// Layout
import SearchBox from '@/components/ui/SearchBox'
import CatechismPopup from '@/components/ui/CatechismPopup'
import LandingPage from '@/components/landing/LandingPage'

// Dashboard sections
import WelcomeGreeting from '@/components/dashboard/WelcomeGreeting'
import IceBreakers from '@/components/dashboard/IceBreakers'
import ContinueLearning from '@/components/dashboard/ContinueLearning'
import FeatureGrid from '@/components/dashboard/FeatureGrid'
import ProgressOverview from '@/components/dashboard/ProgressOverview'
import StudyStreak from '@/components/dashboard/StudyStreak'
import SearchResults from '@/components/dashboard/SearchResults'

import type { QueryResponse } from '@/types'

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, profile, user } = useAuth()
  const router = useRouter()

  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [catechismPopup, setCatechismPopup] = useState<{ ref: string; rect: DOMRect | null } | null>(null)

  // ── Auth guards ──
  if (!authLoading && !isAuthenticated) {
    return <LandingPage />
  }

  if (!authLoading && isAuthenticated && profile && !profile.onboarding_completed) {
    router.push('/onboarding')
    return null
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  // ── Search handlers ──
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

  function handleCitationClick(reference: string, rect: DOMRect) {
    setCatechismPopup({ ref: reference, rect })
  }

  const hasResponse = response !== null

  return (
    <main className="flex flex-col min-h-screen relative" role="main">
      <div className="bg-glow" />

      {/* Catechism Popup */}
      {catechismPopup && (
        <CatechismPopup
          reference={catechismPopup.ref}
          anchorRect={catechismPopup.rect}
          onClose={() => setCatechismPopup(null)}
        />
      )}

      {/* ══════════════════════════════════════════════
          HERO — Welcome + Search (no results yet)
          ══════════════════════════════════════════════ */}
      {!hasResponse && !isLoading && (
        <section className="relative z-10 flex flex-col items-center px-4 pt-12 md:pt-16 pb-6 transition-all duration-700 ease-out">
          {/* Conversational greeting */}
          <WelcomeGreeting profile={profile} />

          {/* Search box */}
          <div className="w-full max-w-2xl mx-auto mt-6">
            <SearchBox onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {/* Ice-breaker questions */}
          <IceBreakers onSelect={handleSearch} disabled={isLoading} />

          {/* Continue where you left off */}
          <ContinueLearning userId={user?.id} />

          {/* Study progress overview */}
          <ProgressOverview userId={user?.id} />

          {/* Study streak */}
          <StudyStreak userId={user?.id} />
        </section>
      )}

      {/* ══════════════════════════════════════════════
          COMPACT SEARCH — Sticky header when showing results
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
            <span className="flex-shrink-0 md:hidden" style={{ color: '#C9A84C', fontSize: '1.2rem' }}>&#10013;</span>
            <div className="flex-1">
              <SearchBox onSearch={handleSearch} isLoading={isLoading} hideChips />
            </div>
          </div>
        </section>
      )}

      {/* Error banner */}
      {error && (
        <div className="relative z-10 w-full max-w-3xl mx-auto mt-6 px-4">
          <div className="glass-card px-6 py-4 text-center" style={{ borderColor: 'rgba(107, 29, 42, 0.3)' }}>
            <p className="text-sm" style={{ color: '#8B3145', fontFamily: 'Poppins, sans-serif' }}>{error}</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          FEATURE GRID — Explore sections (no results yet)
          ══════════════════════════════════════════════ */}
      {!hasResponse && !isLoading && <FeatureGrid />}

      {/* ══════════════════════════════════════════════
          SEARCH RESULTS
          ══════════════════════════════════════════════ */}
      {(hasResponse || isLoading) && (
        <div ref={resultsRef}>
          <SearchResults
            response={response}
            isLoading={isLoading}
            onRelatedClick={handleRelatedClick}
            onCitationClick={handleCitationClick}
          />
        </div>
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
          Veritas Dei — Fiel ao Magistério. Consulte sempre as fontes.
        </p>
      </footer>
    </main>
  )
}
