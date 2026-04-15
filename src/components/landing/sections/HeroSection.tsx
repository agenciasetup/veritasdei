'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2, MapPin, Sparkles } from 'lucide-react'

import { getLiturgicalDay } from '@/lib/liturgical-calendar'
import type { GeoStatus } from '@/hooks/useGeolocation'

import { HERO_COPY } from '../copy'
import { ChurchChip } from '../components/ChurchChip'
import { ScrollCue } from '../components/ScrollCue'

interface HeroSectionProps {
  stats: { igrejas: number; convertidos: number; catolicos: number }
  heroChips: Array<{ id: string; label: string; meta: string; href: string }>
  searching: boolean
  geoStatus: GeoStatus
  onFindChurch: () => void
}

export function HeroSection({
  stats,
  heroChips,
  searching,
  geoStatus,
  onFindChurch,
}: HeroSectionProps) {
  const liturgical = useMemo(() => getLiturgicalDay(new Date()), [])
  const hoje = useMemo(
    () =>
      new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      }),
    [],
  )

  const showChips = heroChips.length > 0
  const chipsLabel = searching
    ? HERO_COPY.chipsLoading
    : showChips
      ? HERO_COPY.chipsNearbyLabel
      : geoStatus === 'granted'
        ? HERO_COPY.chipsEmpty
        : HERO_COPY.chipsIdle

  return (
    <section className="surface-velvet relative min-h-[100svh] md:min-h-screen overflow-hidden">
      {/* ── Floating orbs ── */}
      <div
        className="hero-orb glow-pulse"
        style={{
          top: '-120px',
          left: '-80px',
          width: '520px',
          height: '520px',
          background: 'radial-gradient(circle, rgba(107,29,42,0.55) 0%, transparent 70%)',
        }}
      />
      <div
        className="hero-orb glow-pulse"
        style={{
          bottom: '-100px',
          right: '-120px',
          width: '480px',
          height: '480px',
          background: 'radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)',
          animationDelay: '1.5s',
        }}
      />

      {/* ── Sparks dourados (detalhes mínimos) ── */}
      <span
        aria-hidden
        className="absolute hidden md:block rounded-full"
        style={{
          top: '22%',
          left: '14%',
          width: 3,
          height: 3,
          background: '#D9C077',
          boxShadow: '0 0 10px rgba(217,192,119,0.7)',
          opacity: 0.55,
        }}
      />
      <span
        aria-hidden
        className="absolute hidden md:block rounded-full"
        style={{
          top: '38%',
          right: '18%',
          width: 2,
          height: 2,
          background: '#E6D9B5',
          boxShadow: '0 0 8px rgba(201,168,76,0.6)',
          opacity: 0.45,
        }}
      />
      <span
        aria-hidden
        className="absolute hidden md:block rounded-full"
        style={{
          bottom: '28%',
          left: '22%',
          width: 2,
          height: 2,
          background: '#C9A84C',
          boxShadow: '0 0 7px rgba(201,168,76,0.6)',
          opacity: 0.5,
        }}
      />
      <span
        aria-hidden
        className="absolute hidden md:block rounded-full"
        style={{
          top: '58%',
          right: '28%',
          width: 3,
          height: 3,
          background: '#D9C077',
          boxShadow: '0 0 9px rgba(217,192,119,0.6)',
          opacity: 0.4,
        }}
      />
      <span
        aria-hidden
        className="absolute hidden lg:block rounded-full"
        style={{
          top: '30%',
          right: '10%',
          width: 2,
          height: 2,
          background: '#E6D9B5',
          boxShadow: '0 0 6px rgba(230,217,181,0.7)',
          opacity: 0.4,
        }}
      />

      {/* ── Top liturgical strip ── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 pt-6 md:pt-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 pointer-events-auto">
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#D9C077' }} />
              <span
                className="text-[11px] capitalize"
                style={{ color: '#E6D9B5', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.04em' }}
              >
                {hoje}
              </span>
              <span className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.4)' }} />
              <span
                className="text-[11px] hidden sm:inline"
                style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.04em' }}
              >
                Liturgia: {liturgical.name}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 pointer-events-auto">
              <span
                className="text-[10px] uppercase"
                style={{ color: 'rgba(242,237,228,0.5)', fontFamily: 'Cinzel, serif', letterSpacing: '0.2em' }}
              >
                Veritas Dei
              </span>
              <span className="w-px h-3" style={{ background: 'rgba(201,168,76,0.35)' }} />
              <Link
                href="/login?tab=login"
                className="text-[10px] uppercase underline-offset-4 hover:underline transition-colors"
                style={{ color: '#D9C077', fontFamily: 'Cinzel, serif', letterSpacing: '0.18em' }}
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 min-h-[100svh] md:min-h-screen flex items-center px-5 md:px-10 lg:px-16 pt-24 md:pt-28 pb-24 md:pb-16">
        <div className="max-w-5xl mx-auto w-full text-center md:text-left">
          {/* Inline ornament above title */}
          <div className="flex items-center justify-center md:justify-start gap-3 mb-6 opacity-70">
            <span
              className="w-12 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.8))' }}
            />
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <g stroke="#C9A84C" fill="none" strokeWidth="1">
                <path d="M7 1 L7 13 M1 7 L13 7" />
                <circle cx="7" cy="7" r="2" />
              </g>
            </svg>
            <span
              className="w-12 h-px"
              style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.8))' }}
            />
          </div>

          <h1
            className="hero-title display-cinzel text-5xl sm:text-6xl md:text-7xl lg:text-[88px] xl:text-[104px] leading-[0.98] mb-6 md:mb-8"
            style={{ color: '#F5EFE6', textWrap: 'balance', fontWeight: 500 }}
          >
            <span className="block">{HERO_COPY.titleLine1}</span>
            <span
              className="block italic"
              style={{ fontFamily: 'Cormorant Garamond, serif', color: '#E6D9B5', fontWeight: 500 }}
            >
              {HERO_COPY.titleLine2}
            </span>
          </h1>

          <p
            className="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto md:mx-0 mb-10"
            style={{
              color: '#CEC3B3',
              fontFamily: 'Cormorant Garamond, serif',
              lineHeight: 1.55,
              fontWeight: 400,
            }}
          >
            {HERO_COPY.lead}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-center md:justify-start mb-8">
            <button
              onClick={onFindChurch}
              className="btn-gold inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2"
            >
              <MapPin className="w-4 h-4" />
              {HERO_COPY.ctaPrimary}
              <ChevronRight className="w-4 h-4" />
            </button>

            <Link
              href="/login?tab=registro"
              className="btn-ghost-dark inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-[13px] focus-visible:outline-none focus-visible:ring-2"
            >
              {HERO_COPY.ctaSecondary}
            </Link>
          </div>

          <div
            className="flex items-center gap-3 text-xs justify-center md:justify-start mb-12"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <Link href="/login?tab=login" className="underline underline-offset-4" style={{ color: '#D9C077' }}>
              {HERO_COPY.alreadyHave}
            </Link>
          </div>

          {/* ── Nearby chips strip ── */}
          <div className="mt-2 max-w-4xl">
            <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
              <span className="w-6 h-px" style={{ background: 'rgba(201,168,76,0.5)' }} />
              <span
                className="eyebrow-label"
                style={{ color: '#D9C077' }}
              >
                {chipsLabel}
              </span>
              {searching && <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#D9C077' }} />}
            </div>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start min-h-[40px]">
              {showChips &&
                heroChips.map(chip => (
                  <ChurchChip
                    key={chip.id}
                    href={chip.href}
                    label={chip.label}
                    meta={chip.meta}
                    tone="dark"
                  />
                ))}

              {!showChips && !searching && (
                <button
                  onClick={onFindChurch}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs"
                  style={{
                    background: 'rgba(201,168,76,0.06)',
                    border: '1px dashed rgba(201,168,76,0.35)',
                    color: '#D9C077',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Ativar localização
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero bottom strip: stats + scroll cue ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 md:pb-10 pointer-events-none">
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16">
          <div className="gold-rule opacity-60 mb-6" />
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
            <div
              className="flex items-center gap-5 md:gap-8 pointer-events-auto"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              <MiniStat value={stats.igrejas} label={HERO_COPY.stats.igrejas} />
              <span className="w-px h-4" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <MiniStat value={stats.convertidos} label={HERO_COPY.stats.convertidos} />
              <span className="w-px h-4" style={{ background: 'rgba(201,168,76,0.3)' }} />
              <MiniStat value={stats.catolicos} label={HERO_COPY.stats.fieis} />
            </div>

            <ScrollCue label={HERO_COPY.scrollCue} className="hidden md:flex" />
          </div>
        </div>
      </div>
    </section>
  )
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-lg md:text-xl"
        style={{ color: '#F5EFE6', fontFamily: 'Cinzel, serif', fontWeight: 600 }}
      >
        {value}
      </span>
      <span
        className="text-[10px] uppercase"
        style={{ color: 'rgba(201,168,76,0.75)', letterSpacing: '0.22em' }}
      >
        {label}
      </span>
    </div>
  )
}

