'use client'

import { useState } from 'react'
import {
  Sparkles, Lightbulb, ArrowRight, AlertTriangle, ShieldAlert, BookMarked,
  BookOpen, Feather, ShieldCheck, ShieldAlert as ShieldWarn, ShieldQuestion,
} from 'lucide-react'
import RichText from '@/components/ui/RichText'
import PillarCard from '@/components/ui/PillarCard'
import DisclaimerBanner from '@/components/ui/DisclaimerBanner'
import type { QueryResponse, Pillar } from '@/types'

const PILLAR_ORDER: Pillar[] = ['biblia', 'magisterio', 'patristica']

type TabId = 'sintese' | 'fontes' | 'objecoes'

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
  const [activeTab, setActiveTab] = useState<TabId>('sintese')
  const insight = response?.insight
  const hasProtestantView = !!insight?.protestantView
  const hasCuriosity = !!insight?.curiosity
  const hasSecondaryCard = hasProtestantView || hasCuriosity

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'sintese', label: 'Síntese', icon: Sparkles },
    { id: 'fontes', label: 'Fontes', icon: BookOpen },
    ...(hasProtestantView
      ? [{ id: 'objecoes' as TabId, label: 'Objeções', icon: AlertTriangle }]
      : hasCuriosity
        ? [{ id: 'objecoes' as TabId, label: 'Curiosidade', icon: Feather }]
        : []),
  ]

  return (
    <section className="relative z-10 w-full px-4 md:px-6 lg:px-8 pb-16 pt-6 flex-1">

      {/* ── Loading skeleton ── */}
      {isLoading && <LoadingSkeleton />}

      {/* ── Tab navigation (mobile) ── */}
      {insight && insight.summary && (
        <>
          <div className="flex gap-1 mb-6 xl:hidden overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200"
                  style={{
                    background: isActive ? 'rgba(201,168,76,0.12)' : 'rgba(16,16,16,0.5)',
                    border: `1px solid ${isActive ? 'rgba(201,168,76,0.3)' : 'rgba(201,168,76,0.08)'}`,
                    color: isActive ? '#C9A84C' : '#7A7368',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* ── Mobile: show active tab content ── */}
          <div className="xl:hidden">
            {activeTab === 'sintese' && (
              <CatholicSummaryCard
                insight={insight}
                fullWidth={!hasSecondaryCard}
                onRelatedClick={onRelatedClick}
                onCitationClick={onCitationClick}
              />
            )}
            {activeTab === 'fontes' && (
              <SourcesSection response={response} isLoading={isLoading} />
            )}
            {activeTab === 'objecoes' && hasProtestantView && (
              <ProtestantViewCard
                protestantView={insight.protestantView!}
                onCitationClick={onCitationClick}
              />
            )}
            {activeTab === 'objecoes' && !hasProtestantView && hasCuriosity && (
              <CuriosityCard curiosity={insight.curiosity!} />
            )}
          </div>

          {/* ── Desktop: show all side-by-side (original layout) ── */}
          <div className="hidden xl:grid xl:grid-cols-5 gap-6 mb-10 fade-in">
            <CatholicSummaryCard
              insight={insight}
              fullWidth={!hasSecondaryCard}
              onRelatedClick={onRelatedClick}
              onCitationClick={onCitationClick}
            />
            {hasProtestantView && (
              <ProtestantViewCard
                protestantView={insight.protestantView!}
                onCitationClick={onCitationClick}
              />
            )}
            {!hasProtestantView && hasCuriosity && (
              <CuriosityCard curiosity={insight.curiosity!} />
            )}
          </div>

          {/* ── Confidence indicator ── */}
          {insight.confidenceLevel && (
            <ConfidenceIndicator level={insight.confidenceLevel} />
          )}

          {/* ── Desktop: sources below ── */}
          <div className="hidden xl:block">
            <SourcesSection response={response} isLoading={isLoading} />
          </div>
        </>
      )}

      <DisclaimerBanner visible={response?.sensitive ?? false} />
    </section>
  )
}

/* ─── Sources section ─── */

function SourcesSection({
  response,
  isLoading,
}: {
  response: QueryResponse | null
  isLoading: boolean
}) {
  return (
    <div>
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
    </div>
  )
}

/* ─── Catholic Summary Card ─── */

function CatholicSummaryCard({
  insight,
  fullWidth,
  onRelatedClick,
  onCitationClick,
}: {
  insight: NonNullable<QueryResponse['insight']>
  fullWidth: boolean
  onRelatedClick: (topic: string) => void
  onCitationClick: (reference: string, rect: DOMRect) => void
}) {
  return (
    <div
      className={`${fullWidth ? 'xl:col-span-5' : 'xl:col-span-3'} rounded-2xl p-6 md:p-10 mb-6 xl:mb-0`}
      style={{
        background: 'rgba(16,16,16,0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(201,168,76,0.15)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <Sparkles className="w-5 h-5" style={{ color: '#C9A84C' }} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
            O que a Igreja ensina
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Síntese fiel ao Magistério
          </p>
        </div>
      </div>

      <div className={`mb-6 md:mb-8 ${fullWidth ? 'max-w-4xl' : ''}`} style={{ color: '#E8E2D8', fontSize: '1.05rem' }}>
        <RichText text={insight.summary} accentColor="#C9A84C" onCitationClick={onCitationClick} />
      </div>

      {insight.keyPoints.length > 0 && (
        <div
          className={`rounded-xl p-5 md:p-6 mb-6 md:mb-8 ${fullWidth ? 'max-w-4xl' : ''}`}
          style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3 md:mb-4">
            <Lightbulb className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <h3 className="text-xs tracking-[0.15em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
              Pontos-Chave
            </h3>
          </div>
          <ul className="space-y-2.5">
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

/* ─── Protestant View Card ─── */

function ProtestantViewCard({
  protestantView,
  onCitationClick,
}: {
  protestantView: NonNullable<NonNullable<QueryResponse['insight']>['protestantView']>
  onCitationClick: (reference: string, rect: DOMRect) => void
}) {
  return (
    <div
      className="xl:col-span-2 rounded-2xl p-6 md:p-8 flex flex-col mb-6 xl:mb-0"
      style={{
        background: 'rgba(107,29,42,0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(107,29,42,0.2)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center gap-3 mb-5 md:mb-6">
        <div
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(139,49,69,0.15)', border: '1px solid rgba(139,49,69,0.25)' }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: '#D94F5C' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#D94F5C' }}>
            Objeções protestantes
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Objeções comuns ao ensino católico
          </p>
        </div>
      </div>

      {protestantView.denominations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4 md:mb-5">
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

      <div className="mb-5 md:mb-6" style={{ color: '#B8AFA2', fontSize: '0.92rem' }}>
        <RichText text={protestantView.summary} accentColor="#D94F5C" />
      </div>

      <div className="flex items-center gap-3 my-3 md:my-4">
        <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <span className="text-xs tracking-[0.1em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}>
            Refutação Católica
          </span>
        </div>
        <span className="flex-1 h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />
      </div>

      <div className="mb-5 md:mb-6" style={{ color: '#E8E2D8', fontSize: '0.92rem' }}>
        <RichText text={protestantView.refutation} accentColor="#C9A84C" onCitationClick={onCitationClick} />
      </div>

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

/* ─── Curiosity Card (for non-controversial topics) ─── */

function CuriosityCard({ curiosity }: { curiosity: string }) {
  return (
    <div
      className="xl:col-span-2 rounded-2xl p-6 md:p-8 flex flex-col mb-6 xl:mb-0"
      style={{
        background: 'rgba(74,124,89,0.06)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(74,124,89,0.15)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center gap-3 mb-5 md:mb-6">
        <div
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(74,124,89,0.12)', border: '1px solid rgba(74,124,89,0.2)' }}
        >
          <Feather className="w-5 h-5" style={{ color: '#4A7C59' }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#4A7C59' }}>
            Você sabia?
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Curiosidade sobre este tema
          </p>
        </div>
      </div>

      <div style={{ color: '#E8E2D8', fontSize: '0.92rem' }}>
        <RichText text={curiosity} accentColor="#4A7C59" />
      </div>
    </div>
  )
}

/* ─── Confidence Indicator ─── */

function ConfidenceIndicator({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config = {
    high: {
      icon: ShieldCheck,
      label: 'Alta confiança',
      description: 'Múltiplas fontes em todos os pilares',
      color: '#4A7C59',
      bg: 'rgba(74,124,89,0.08)',
      border: 'rgba(74,124,89,0.2)',
    },
    medium: {
      icon: ShieldWarn,
      label: 'Confiança moderada',
      description: 'Fontes encontradas, mas cobertura parcial',
      color: '#C9A84C',
      bg: 'rgba(201,168,76,0.06)',
      border: 'rgba(201,168,76,0.15)',
    },
    low: {
      icon: ShieldQuestion,
      label: 'Base limitada',
      description: 'Poucas fontes — enriqueça este tema na Base IA',
      color: '#D94F5C',
      bg: 'rgba(217,79,92,0.06)',
      border: 'rgba(217,79,92,0.15)',
    },
  }

  const c = config[level]
  const Icon = c.icon

  return (
    <div
      className="flex items-center gap-2.5 mb-6 px-4 py-2.5 rounded-xl w-fit mx-auto"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      <Icon className="w-4 h-4" style={{ color: c.color }} />
      <span className="text-xs font-medium" style={{ color: c.color, fontFamily: 'Poppins, sans-serif' }}>
        {c.label}
      </span>
      <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
        — {c.description}
      </span>
    </div>
  )
}

/* ─── Loading Skeleton ─── */

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
