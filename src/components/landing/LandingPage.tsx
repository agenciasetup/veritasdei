'use client'

import { useCallback } from 'react'

import { useAuth } from '@/contexts/AuthContext'

import { useLandingSearch } from './hooks/useLandingSearch'
import { DEVOTION_COPY } from './copy'
import { MobileStickyCta } from './components/MobileStickyCta'
import {
  LiturgiaMockup,
  OracoesMockup,
  TercoMockup,
  ExameMockup,
} from './components/DevotionMockups'

import { HeroSection } from './sections/HeroSection'
import { ManifestoSection } from './sections/ManifestoSection'
import { ChurchFinderSection } from './sections/ChurchFinderSection'
import { DevotionSection } from './sections/DevotionSection'
import { QuoteSection } from './sections/QuoteSection'
import { DonationSection } from './sections/DonationSection'
import { LandingFooter } from './sections/LandingFooter'

/**
 * Alternância de tons: ChurchFinder (wine) → Liturgia (light) → Oracoes (dark) → …
 * Invertida pra nunca ter duas seções vinho ou duas claras em sequência.
 */
const DEVOTION_LAYOUT = [
  { tone: 'light', Mockup: LiturgiaMockup, reverse: false },
  { tone: 'dark', Mockup: OracoesMockup, reverse: true },
  { tone: 'light', Mockup: TercoMockup, reverse: false },
  { tone: 'dark', Mockup: ExameMockup, reverse: true },
] as const

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const search = useLandingSearch()

  const jumpToChurchFinder = useCallback(() => {
    document
      .getElementById('church-finder')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (search.geo.status === 'idle') search.geo.request()
  }, [search.geo])

  if (isAuthenticated) return null

  return (
    <main className="relative overflow-x-hidden pb-24 md:pb-0">
      <HeroSection
        stats={{
          igrejas: search.stats.igrejas,
          convertidos: search.stats.convertidos,
          catolicos: search.stats.catolicos,
        }}
        heroChips={search.heroChips}
        searching={search.searching}
        geoStatus={search.geo.status}
        onFindChurch={jumpToChurchFinder}
      />

      <ManifestoSection />

      <ChurchFinderSection search={search} />

      {DEVOTION_COPY.map((section, idx) => {
        const layout = DEVOTION_LAYOUT[idx]
        const Mockup = layout.Mockup
        return (
          <DevotionSection
            key={section.key}
            tone={layout.tone}
            reverse={layout.reverse}
            eyebrow={section.eyebrow}
            title={section.title}
            titleEm={section.titleEm}
            description={section.description}
            href={section.href}
            features={section.features}
            mockup={<Mockup tone={layout.tone} className="w-full h-auto block" />}
          />
        )
      })}

      <QuoteSection />

      <DonationSection />

      <LandingFooter />

      <MobileStickyCta onFindChurch={jumpToChurchFinder} />
    </main>
  )
}
