'use client'

import {
  Sparkles, Lightbulb, ArrowRight, AlertTriangle, ShieldAlert, BookMarked,
} from 'lucide-react'
import RichText from '@/components/ui/RichText'
import PillarCard from '@/components/ui/PillarCard'
import DisclaimerBanner from '@/components/ui/DisclaimerBanner'
import type { QueryResponse, Pillar } from '@/types'

const PILLAR_ORDER: Pillar[] = ['biblia', 'magisterio', 'patristica']

interface SearchResultsProps {
  response: QueryResponse | null
  isLoading: boolean
  onRelatedClick: (topic: string) => void
  onCitationClick: (reference: string, rect: DOMRect) => void
}

export default function SearchResults({
  response,
  isLoading,
  onRelatedClick,
  onCitationClick,
}: SearchResultsProps) {
  const insight = response?.insight

  return (
    <section className="relative z-10 w-full px-4 md:px-6 lg:px-8 pb-16 pt-6 flex-1">

      {/* ── AI Insight: Catholic summary + Protestant view ── */}
      {insight && insight.summary && (
        <div className="mb-10 grid grid-cols-1 xl:grid-cols-5 gap-6 fade-in">

          {/* Catholic Summary Card (3/5) */}
          <CatholicSummaryCard
            insight={insight}
            onRelatedClick={onRelatedClick}
            onCitationClick={onCitationClick}
          />

          {/* Protestant View Card (2/5) */}
          {insight.protestantView && (
            <ProtestantViewCard
              protestantView={insight.protestantView}
              onCitationClick={onCitationClick}
            />
          )}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading && <LoadingSkeleton />}

      {/* ── Sources divider ── */}
      <div className="mb-6">
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

      {/* ── Pillar Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6" style={{ alignItems: 'start' }}>
        {PILLAR_ORDER.map((pillar, i) => {
          const pillarData = response?.pillars.find(p => p.pillar === pillar)
          return (
            <div key={pillar} className="fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
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
  )
}

/* ─── Sub-components ─── */

function CatholicSummaryCard({
  insight,
  onRelatedClick,
  onCitationClick,
}: {
  insight: NonNullable<QueryResponse['insight']>
  onRelatedClick: (topic: string) => void
  onCitationClick: (reference: string, rect: DOMRect) => void
}) {
  return (
    <div
      className="xl:col-span-3 rounded-2xl p-7 md:p-10"
      style={{
        background: 'rgba(16,16,16,0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(201,168,76,0.15)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <Sparkles className="w-5 h-5" style={{ color: '#C9A84C' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
            O que a Igreja Católica ensina
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Síntese fiel ao Magistério, gerada a partir das fontes abaixo
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-8" style={{ color: '#E8E2D8', fontSize: '1.05rem' }}>
        <RichText text={insight.summary} accentColor="#C9A84C" onCitationClick={onCitationClick} />
      </div>

      {/* Key Points */}
      {insight.keyPoints.length > 0 && (
        <div
          className="rounded-xl p-6 mb-8"
          style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <h3 className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
              Pontos-Chave
            </h3>
          </div>
          <ul className="space-y-3">
            {insight.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#C9A84C' }} />
                <span className="text-sm leading-relaxed" style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}>
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
          <h3 className="text-xs tracking-[0.15em] uppercase mb-3" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>
            Aprofunde
          </h3>
          <div className="flex flex-wrap gap-2">
            {insight.relatedTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => onRelatedClick(topic)}
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
  )
}

function ProtestantViewCard({
  protestantView,
  onCitationClick,
}: {
  protestantView: NonNullable<NonNullable<QueryResponse['insight']>['protestantView']>
  onCitationClick: (reference: string, rect: DOMRect) => void
}) {
  return (
    <div
      className="xl:col-span-2 rounded-2xl p-7 md:p-8 flex flex-col"
      style={{
        background: 'rgba(107,29,42,0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(107,29,42,0.2)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(139,49,69,0.15)', border: '1px solid rgba(139,49,69,0.25)' }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: '#D94F5C' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#D94F5C' }}>
            O que os protestantes costumam dizer
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Objeções comuns ao ensino católico
          </p>
        </div>
      </div>

      {/* Denominations */}
      {protestantView.denominations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {protestantView.denominations.map((d) => (
            <span
              key={d}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(139,49,69,0.12)',
                border: '1px solid rgba(139,49,69,0.2)',
                color: '#B8AFA2',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mb-6" style={{ color: '#B8AFA2', fontSize: '0.92rem' }}>
        <RichText text={protestantView.summary} accentColor="#D94F5C" />
      </div>

      {/* Divider with refutation label */}
      <div className="flex items-center gap-3 my-4">
        <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <span className="text-xs tracking-[0.1em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
            Refutação Católica
          </span>
        </div>
        <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
      </div>

      {/* Refutation */}
      <div className="mb-6" style={{ color: '#E8E2D8', fontSize: '0.92rem' }}>
        <RichText text={protestantView.refutation} accentColor="#C9A84C" onCitationClick={onCitationClick} />
      </div>

      {/* Disclaimer */}
      <div
        className="mt-auto rounded-xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(107,29,42,0.1)', border: '1px solid rgba(107,29,42,0.15)' }}
      >
        <BookMarked className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#7A7368' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Essas informações não são exatas pois há +40 mil denominações protestantes que podem mudar suas doutrinas de acordo com suas próprias interpretações da Bíblia.
        </p>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="mb-10 grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div
        className="xl:col-span-3 rounded-2xl p-7 md:p-10"
        style={{ background: 'rgba(16,16,16,0.8)', border: '1px solid rgba(201,168,76,0.1)' }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="skeleton w-11 h-11 !rounded-xl" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-6 w-72" />
            <div className="skeleton h-3 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-[95%]" />
          <div className="skeleton h-4 w-[88%]" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-[70%]" />
          <div className="skeleton h-8 w-full mt-4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-[82%]" />
        </div>
      </div>
      <div
        className="xl:col-span-2 rounded-2xl p-7 md:p-8"
        style={{ background: 'rgba(107,29,42,0.05)', border: '1px solid rgba(107,29,42,0.1)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="skeleton w-11 h-11 !rounded-xl" style={{ background: 'rgba(139,49,69,0.1)' }} />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-5 w-56" />
            <div className="skeleton h-3 w-36" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-[90%]" />
          <div className="skeleton h-4 w-[75%]" />
        </div>
      </div>
    </div>
  )
}
