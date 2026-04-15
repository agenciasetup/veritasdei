'use client'

import { Loader2, Navigation, Search } from 'lucide-react'

import CityAutocomplete from '@/components/CityAutocomplete'
import type { UseLandingSearchReturn } from '../hooks/useLandingSearch'

import { FINDER_COPY } from '../copy'
import { EyebrowTag } from '../components/EyebrowTag'
import { ChurchChip } from '../components/ChurchChip'
import { QuatrefoilOrnament } from '../components/GothicOrnaments'

interface ChurchFinderSectionProps {
  search: UseLandingSearchReturn
}

export function ChurchFinderSection({ search }: ChurchFinderSectionProps) {
  const {
    geo,
    searchCity,
    setSearchCity,
    handleSearch,
    searching,
    phase,
    geoResults,
    searchResults,
    nearbyResults,
    clearGeo,
  } = search

  const geoActive = geo.status === 'granted'
  const geoLoading = geo.status === 'prompting' || geo.status === 'loading'

  return (
    <section
      id="church-finder"
      className="surface-wine relative py-24 md:py-32 overflow-hidden"
    >
      <QuatrefoilOrnament
        className="absolute top-10 right-10 w-32 hidden md:block"
        color="#C9A84C"
        opacity={0.15}
      />
      <QuatrefoilOrnament
        className="absolute bottom-10 left-10 w-24 hidden md:block"
        color="#C9A84C"
        opacity={0.12}
      />

      <div className="relative max-w-5xl mx-auto px-5 md:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-14">
          <EyebrowTag tone="gold" className="mb-6">
            {FINDER_COPY.eyebrow}
          </EyebrowTag>

          <h2
            className="display-cormorant text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-4"
            style={{ color: '#F5EFE6', textWrap: 'balance' }}
          >
            {FINDER_COPY.title}{' '}
            <span className="italic" style={{ color: '#E6D9B5' }}>
              {FINDER_COPY.titleEm}
            </span>
          </h2>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto"
            style={{
              color: 'rgba(242,237,228,0.72)',
              fontFamily: 'Cormorant Garamond, serif',
              lineHeight: 1.55,
            }}
          >
            {FINDER_COPY.lead}
          </p>
        </div>

        {/* Finder card */}
        <div className="card-noble-dark p-6 md:p-8">
          {/* Geo button row */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => geo.request()}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 transition-all"
              style={{
                background: geoActive
                  ? 'linear-gradient(135deg, rgba(76,175,80,0.15), rgba(76,175,80,0.05))'
                  : 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.04))',
                border: `1px solid ${geoActive ? 'rgba(118,211,123,0.4)' : 'rgba(201,168,76,0.4)'}`,
                color: geoActive ? '#76D37B' : '#E6D9B5',
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {geoLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              {geoActive && geo.coords?.label
                ? FINDER_COPY.geoGranted(geo.coords.label)
                : geoLoading
                  ? FINDER_COPY.geoLoading
                  : FINDER_COPY.geoIdle}
            </button>

            {geoActive && (
              <button
                onClick={clearGeo}
                className="text-xs underline underline-offset-4"
                style={{ color: '#A99F90', fontFamily: 'Poppins, sans-serif' }}
              >
                {FINDER_COPY.geoClear}
              </button>
            )}
          </div>

          {geo.error && (
            <p
              className="text-xs mb-4 px-3 py-2 rounded-lg"
              style={{
                color: '#F1A9B1',
                background: 'rgba(217,79,92,0.1)',
                border: '1px solid rgba(217,79,92,0.3)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {geo.error}
            </p>
          )}

          {/* Search row */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <CityAutocomplete
                value={searchCity}
                onChange={setSearchCity}
                onSelect={city => {
                  setSearchCity(city.cidade)
                  setTimeout(() => handleSearch(), 0)
                }}
                placeholder={FINDER_COPY.placeholder}
                biasLatitude={geo.coords?.latitude ?? null}
                biasLongitude={geo.coords?.longitude ?? null}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchCity.trim()}
              className="btn-gold px-6 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2"
              aria-label={FINDER_COPY.searchAria}
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>

          {/* Results */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-6 h-px" style={{ background: 'rgba(201,168,76,0.6)' }} />
              <p className="eyebrow-label" style={{ color: '#C9A84C' }}>
                {FINDER_COPY.resultsEyebrow}
              </p>
            </div>

            {phase === 'idle' && (
              <p
                className="text-sm italic"
                style={{ color: '#A99F90', fontFamily: 'Cormorant Garamond, serif' }}
              >
                {FINDER_COPY.stateInitial}
              </p>
            )}

            {phase === 'loading' && (
              <p
                className="text-sm inline-flex items-center gap-2"
                style={{ color: '#D9C077', fontFamily: 'Poppins, sans-serif' }}
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {FINDER_COPY.stateLoading}
              </p>
            )}

            {phase === 'success' && (
              <div className="flex flex-wrap gap-2">
                {geoResults.length > 0 &&
                  geoResults.map(p => (
                    <ChurchChip
                      key={p.id}
                      href={`/paroquias/${p.id}`}
                      label={p.nome}
                      meta={`${p.distancia_km.toFixed(1)} km`}
                      tone="dark"
                    />
                  ))}
                {geoResults.length === 0 &&
                  searchResults.map(p => (
                    <ChurchChip
                      key={p.id}
                      href={`/paroquias/${p.id}`}
                      label={p.nome}
                      meta={`${p.cidade}-${p.estado}`}
                      tone="dark"
                    />
                  ))}
                {geoResults.length === 0 &&
                  nearbyResults.map(p => (
                    <ChurchChip
                      key={p.id}
                      href={`/paroquias/${p.id}`}
                      label={p.nome}
                      meta={`${p.cidade}-${p.estado}`}
                      tone="dark"
                    />
                  ))}
              </div>
            )}

            {phase === 'empty' && (
              <p
                className="text-sm italic"
                style={{ color: '#A99F90', fontFamily: 'Cormorant Garamond, serif' }}
              >
                {FINDER_COPY.stateEmpty}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
