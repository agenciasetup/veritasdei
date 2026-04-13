'use client'

import { useState } from 'react'
import {
  Sparkles, Lightbulb, ArrowRight, AlertTriangle, ShieldAlert, BookMarked,
  BookOpen, Feather, ShieldCheck, ShieldAlert as ShieldWarn, ShieldQuestion,
  XCircle, CheckCircle2, AlertCircle, Flame, MessageCircle, Scale, Languages,
} from 'lucide-react'
import RichText from '@/components/ui/RichText'
import PillarCard from '@/components/ui/PillarCard'
import DisclaimerBanner from '@/components/ui/DisclaimerBanner'
import type { QueryResponse, Pillar, AIInsight, MoralTag, HeresyTag, EtymologyHit } from '@/types'

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
  const etymology = (response?.etymology ?? []).filter(e => e.original_meaning || e.modern_difference)

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
              <>
                <CatholicSummaryCard
                  insight={insight}
                  fullWidth={!hasSecondaryCard}
                  onRelatedClick={onRelatedClick}
                  onCitationClick={onCitationClick}
                />
                {etymology.length > 0 && <EtymologyCard terms={etymology} />}
              </>
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

          {/* ── Etymology (desktop, above confidence/sources) ── */}
          {etymology.length > 0 && (
            <div className="hidden xl:block mb-10 fade-in">
              <EtymologyCard terms={etymology} />
            </div>
          )}

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

      <ClassificationBadges insight={insight} />

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

      {/* Bloco 1 — O QUE O PROTESTANTE DIZ (visão geral) */}
      <BlockHeader
        icon={MessageCircle}
        color="#D94F5C"
        label="O que o protestante diz"
      />
      <div className="mb-5 md:mb-6" style={{ color: '#B8AFA2', fontSize: '0.92rem' }}>
        <RichText text={protestantView.summary} accentColor="#D94F5C" />
      </div>

      {/* Bloco 2+ — Objeções específicas: [Objeção] [Como a Igreja Católica responde] */}
      {protestantView.objections.length > 0 ? (
        <div className="space-y-4 md:space-y-5 mb-5 md:mb-6">
          {protestantView.objections.map((obj, i) => (
            <ObjectionBlockCard
              key={i}
              index={i + 1}
              claim={obj.claim}
              refutation={obj.refutation}
              onCitationClick={onCitationClick}
            />
          ))}
        </div>
      ) : (
        <>
          {/* Fallback legado: refutação consolidada (para respostas antigas) */}
          <BlockHeader
            icon={ShieldAlert}
            color="#C9A84C"
            label="Como a Igreja Católica combate"
          />
          <div className="mb-5 md:mb-6" style={{ color: '#E8E2D8', fontSize: '0.92rem' }}>
            <RichText text={protestantView.refutation} accentColor="#C9A84C" onCitationClick={onCitationClick} />
          </div>
        </>
      )}

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

/* ─── Block Header (shared between protestant card sections) ─── */

function BlockHeader({
  icon: Icon,
  color,
  label,
}: {
  icon: React.ElementType
  color: string
  label: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4" style={{ color }} />
      <span
        className="text-[11px] tracking-[0.12em] uppercase"
        style={{ fontFamily: 'Cinzel, serif', color }}
      >
        {label}
      </span>
      <span className="flex-1 h-px" style={{ background: `${color}22` }} />
    </div>
  )
}

/* ─── Objection Block (one pair: [claim] + [refutation]) ─── */

function ObjectionBlockCard({
  index,
  claim,
  refutation,
  onCitationClick,
}: {
  index: number
  claim: string
  refutation: string
  onCitationClick: (reference: string, rect: DOMRect) => void
}) {
  return (
    <div
      className="rounded-xl p-4 md:p-5"
      style={{
        background: 'rgba(16,16,16,0.35)',
        border: '1px solid rgba(201,168,76,0.12)',
      }}
    >
      {/* Objeção do protestante */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{
              background: 'rgba(139,49,69,0.2)',
              color: '#D94F5C',
              fontFamily: 'Cinzel, serif',
            }}
          >
            {index}
          </span>
          <span
            className="text-[11px] tracking-[0.1em] uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#D94F5C' }}
          >
            Objeção
          </span>
        </div>
        <div
          className="pl-7 text-[0.88rem] leading-relaxed"
          style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
        >
          <RichText text={claim} accentColor="#D94F5C" />
        </div>
      </div>

      {/* Refutação católica */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4" style={{ color: '#C9A84C' }} />
          <span
            className="text-[11px] tracking-[0.1em] uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            Como a Igreja Católica responde
          </span>
        </div>
        <div
          className="pl-6 text-[0.9rem] leading-relaxed"
          style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif' }}
        >
          <RichText text={refutation} accentColor="#C9A84C" onCitationClick={onCitationClick} />
        </div>
      </div>
    </div>
  )
}

/* ─── Classification Badges (moral + heresy) ─── */

interface BadgeVisual {
  icon: React.ElementType
  label: string
  description: string
  color: string
  bg: string
  border: string
}

const MORAL_BADGE_CONFIG: Record<Exclude<MoralTag, 'not_applicable'>, BadgeVisual> = {
  sin: {
    icon: XCircle,
    label: 'Pecado',
    description: 'Contrário ao ensino católico',
    color: '#E04E5C',
    bg: 'rgba(224,78,92,0.08)',
    border: 'rgba(224,78,92,0.25)',
  },
  moderate: {
    icon: AlertCircle,
    label: 'Precisa de moderação',
    description: 'Depende das circunstâncias e da intenção',
    color: '#E8B642',
    bg: 'rgba(232,182,66,0.08)',
    border: 'rgba(232,182,66,0.25)',
  },
  not_sin: {
    icon: CheckCircle2,
    label: 'Não é pecado',
    description: 'Permitido segundo o Catecismo',
    color: '#5BA86E',
    bg: 'rgba(91,168,110,0.08)',
    border: 'rgba(91,168,110,0.25)',
  },
}

const HERESY_BADGE_CONFIG: Record<Exclude<HeresyTag, 'not_applicable'>, BadgeVisual> = {
  heresy: {
    icon: Flame,
    label: 'Heresia',
    description: 'Condenada pelo Magistério',
    color: '#E04E5C',
    bg: 'rgba(224,78,92,0.08)',
    border: 'rgba(224,78,92,0.3)',
  },
  orthodox: {
    icon: Scale,
    label: 'Doutrina católica',
    description: 'Ensino fiel ao Magistério',
    color: '#C9A84C',
    bg: 'rgba(201,168,76,0.08)',
    border: 'rgba(201,168,76,0.25)',
  },
}

function ClassificationBadge({
  visual,
  suffix,
}: {
  visual: BadgeVisual
  suffix?: string
}) {
  const Icon = visual.icon
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{
        background: visual.bg,
        border: `1px solid ${visual.border}`,
      }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color: visual.color }} />
      <span
        className="text-[11px] font-semibold tracking-[0.05em]"
        style={{ color: visual.color, fontFamily: 'Poppins, sans-serif' }}
      >
        {visual.label}
        {suffix ? `: ${suffix}` : ''}
      </span>
      <span
        className="text-[11px] hidden md:inline"
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
      >
        · {visual.description}
      </span>
    </div>
  )
}

function ClassificationBadges({ insight }: { insight: AIInsight }) {
  const moralVisual = insight.moralTag && insight.moralTag !== 'not_applicable'
    ? MORAL_BADGE_CONFIG[insight.moralTag]
    : null
  const heresyVisual = insight.heresyTag && insight.heresyTag !== 'not_applicable'
    ? HERESY_BADGE_CONFIG[insight.heresyTag]
    : null

  if (!moralVisual && !heresyVisual) return null

  return (
    <div className="flex flex-wrap gap-2 mb-5 md:mb-6">
      {moralVisual && <ClassificationBadge visual={moralVisual} />}
      {heresyVisual && (
        <ClassificationBadge
          visual={heresyVisual}
          suffix={insight.heresyTag === 'heresy' ? insight.heresyName ?? undefined : undefined}
        />
      )}
    </div>
  )
}

/* ─── Etymology Card ─── */

function EtymologyCard({ terms }: { terms: EtymologyHit[] }) {
  // Cap at 3 so the card stays visually tight.
  const visible = terms.slice(0, 3)
  return (
    <div
      className="rounded-2xl p-6 md:p-8 mb-6"
      style={{
        background: 'rgba(16,16,16,0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(201,168,76,0.15)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex items-center gap-3 mb-5 md:mb-6">
        <div
          className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
        >
          <Languages className="w-5 h-5" style={{ color: '#C9A84C' }} />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
            Raízes da palavra
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
            Do grego, do latim e do hebraico — a palavra original e seu sentido.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {visible.map((term) => (
          <EtymologyEntry key={term.id} term={term} />
        ))}
      </div>
    </div>
  )
}

function EtymologyEntry({ term }: { term: EtymologyHit }) {
  const langLabel = (term.original_language ?? '').trim()
  return (
    <div
      className="rounded-xl p-4 md:p-5"
      style={{
        background: 'rgba(201,168,76,0.04)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
        <span
          className="text-base md:text-lg font-bold"
          style={{ color: '#E8DFC7', fontFamily: 'Cinzel, serif' }}
        >
          {term.term_pt}
        </span>
        <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          vem de
        </span>
        <span
          className="text-base md:text-lg"
          style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
        >
          {term.term_original}
        </span>
        {term.transliteration && (
          <span
            className="text-xs italic"
            style={{ color: '#9C9488', fontFamily: 'Poppins, sans-serif' }}
          >
            ({term.transliteration})
          </span>
        )}
        {langLabel && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.2)',
              color: '#C9A84C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {langLabel}
          </span>
        )}
      </div>

      {term.original_meaning && (
        <p
          className="text-sm leading-relaxed mb-2"
          style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif' }}
        >
          <span style={{ color: '#7A7368' }}>Significado original: </span>
          {term.original_meaning}
        </p>
      )}

      {term.modern_difference && (
        <p
          className="text-sm leading-relaxed"
          style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
        >
          <span style={{ color: '#7A7368' }}>Hoje em dia: </span>
          {term.modern_difference}
        </p>
      )}
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
