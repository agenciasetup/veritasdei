'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Church, Droplets, Shield, Heart, GraduationCap,
  Flame, Crown, Star, Globe, ScrollText, Sparkles,
  ChevronDown, ChevronLeft, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

// Legacy imports for fallback
import type { Trail as LegacyTrail } from './trails1'
import { TRAILS_1 } from './trails1'
import { TRAILS_2 } from './trails2'
import { TRAILS_3 } from './trails3'
import { TRAILS_4 } from './trails4'
import { TRAILS_5 } from './trails5'
import { TRAILS_6 } from './trails6'

const LEGACY_TRAILS: LegacyTrail[] = [
  ...TRAILS_1, ...TRAILS_2, ...TRAILS_3,
  ...TRAILS_4, ...TRAILS_5, ...TRAILS_6,
]

interface DBTrail {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  difficulty: string
  color: string
  icon_name: string
  sort_order: number
  cover_url: string | null
}

interface DBTrailStep {
  id: string
  trail_id: string
  label: string
  description: string | null
  content_subtopic_id: string | null
  custom_content: string | null
  sort_order: number
}

interface ContentItem {
  id: string
  kind: string
  title: string | null
  body: string
  reference: string | null
  sort_order: number
}

// Unified trail type for rendering
interface Trail {
  id: string
  title: string
  subtitle: string
  description: string
  difficulty: string
  color: string
  iconName: string
  steps: TrailStep[]
}

interface TrailStep {
  label: string
  description: string
  content: string
  contentSubtopicId?: string | null
}

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap, Droplets, Church, Heart, Shield,
  Flame, Crown, Star, Sparkles, ScrollText, BookOpen, Globe,
}

const DIFFICULTY_COLORS: Record<string, string> = {
  'Iniciante': 'rgba(201,168,76,0.15)',
  'Intermediário': 'rgba(139,49,69,0.2)',
  'Avançado': 'rgba(201,168,76,0.25)',
}

interface TrilhasViewProps {
  /** Esconde o page-header (título e subtítulo). Útil quando embutido em
   *  outro dashboard (ex.: `/educa/estudo`) que já tem seu próprio título. */
  hideHeader?: boolean
  /** Limita o número de trilhas mostradas. Default = todas. */
  limit?: number
}

export default function TrilhasView({ hideHeader, limit }: TrilhasViewProps = {}) {
  const [trails, setTrails] = useState<Trail[]>([])
  const [loading, setLoading] = useState(true)
  const [openTrailId, setOpenTrailId] = useState<string | null>(null)
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({})
  const [stepContent, setStepContent] = useState<Record<string, string>>({}) // subtopic_id -> rendered text
  const { user } = useAuth()

  // Load trails from DB, fallback to legacy
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      setTrails(LEGACY_TRAILS.map(t => ({ ...t, steps: t.steps.map(s => ({ ...s, contentSubtopicId: null })) })))
      setLoading(false)
      return
    }

    async function loadTrails() {
      const supabase = createClient()!
      // Try DB trails first
      const { data: dbTrails, error } = await supabase
        .from('trails')
        .select('*')
        .eq('visible', true)
        .order('sort_order')

      if (error || !dbTrails || dbTrails.length === 0) {
        // Fallback to legacy hardcoded trails
        setTrails(LEGACY_TRAILS.map(t => ({ ...t, steps: t.steps.map(s => ({ ...s, contentSubtopicId: null })) })))
        setLoading(false)
        return
      }

      // Load steps for all trails
      const trailIds = dbTrails.map((t: DBTrail) => t.id)
      const { data: allSteps } = await supabase
        .from('trail_steps')
        .select('*')
        .in('trail_id', trailIds)
        .order('sort_order')

      const stepsByTrail: Record<string, DBTrailStep[]> = {}
      ;(allSteps ?? []).forEach((s: DBTrailStep) => {
        if (!stepsByTrail[s.trail_id]) stepsByTrail[s.trail_id] = []
        stepsByTrail[s.trail_id].push(s)
      })

      const mappedTrails: Trail[] = dbTrails.map((t: DBTrail) => ({
        id: t.id,
        title: t.title,
        subtitle: t.subtitle || '',
        description: t.description || '',
        difficulty: t.difficulty as Trail['difficulty'],
        color: t.color,
        iconName: t.icon_name,
        coverUrl: t.cover_url ?? null,
        steps: (stepsByTrail[t.id] || []).map(s => ({
          label: s.label,
          description: s.description || '',
          content: s.custom_content || '',
          contentSubtopicId: s.content_subtopic_id,
        })),
      }))

      setTrails(mappedTrails)
      setLoading(false)
    }

    loadTrails()
  }, [])

  // Load user progress
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    if (!supabase) return
    supabase
      .from('user_trail_progress')
      .select('trail_id, step_index')
      .eq('user_id', user.id)
      .then(({ data }: { data: { trail_id: string; step_index: number }[] | null }) => {
        if (!data) return
        const map: Record<string, number[]> = {}
        data.forEach((row) => {
          if (!map[row.trail_id]) map[row.trail_id] = []
          map[row.trail_id].push(row.step_index)
        })
        setCompletedSteps(map)
      })
  }, [user])

  // Load content for linked subtopics
  const loadSubtopicContent = useCallback(async (subtopicId: string) => {
    if (stepContent[subtopicId]) return // Already loaded
    const supabase = createClient()
    if (!supabase) return

    const { data: items } = await supabase
      .from('content_items')
      .select('*')
      .eq('subtopic_id', subtopicId)
      .eq('visible', true)
      .order('sort_order')

    if (!items || items.length === 0) return

    // Build text content from items
    const parts: string[] = []
    ;(items as ContentItem[]).forEach(item => {
      if (item.kind === 'text' && item.body) {
        if (item.title) parts.push(item.title.toUpperCase())
        parts.push(item.body)
      } else if (item.kind === 'verse' && item.body) {
        parts.push(`${item.reference || ''}\n"${item.body}"`)
      } else if (item.kind === 'definition') {
        parts.push(`${item.title || ''}: ${item.body}`)
      } else if (item.kind === 'list') {
        if (item.title) parts.push(item.title.toUpperCase())
        parts.push(item.body)
      } else if (item.kind === 'prayer') {
        if (item.title) parts.push(item.title.toUpperCase())
        parts.push(item.body)
      }
    })

    setStepContent(prev => ({ ...prev, [subtopicId]: parts.join('\n\n') }))
  }, [stepContent])

  const toggleStepComplete = useCallback(async (trailId: string, stepIndex: number) => {
    if (!user) return
    const supabase = createClient()
    if (!supabase) return
    const current = completedSteps[trailId] ?? []
    const isCompleted = current.includes(stepIndex)

    if (isCompleted) {
      await supabase
        .from('user_trail_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('trail_id', trailId)
        .eq('step_index', stepIndex)
      setCompletedSteps(prev => ({
        ...prev,
        [trailId]: (prev[trailId] ?? []).filter(i => i !== stepIndex),
      }))
    } else {
      await supabase
        .from('user_trail_progress')
        .insert({ user_id: user.id, trail_id: trailId, step_index: stepIndex })
      setCompletedSteps(prev => ({
        ...prev,
        [trailId]: [...(prev[trailId] ?? []), stepIndex],
      }))
    }
  }, [user, completedSteps])

  const openTrail = trails.find(t => t.id === openTrailId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
      </div>
    )
  }

  // ─── TRAIL DETAIL VIEW ───
  if (openTrail) {
    const Icon = ICON_MAP[openTrail.iconName] ?? BookOpen
    const completed = completedSteps[openTrail.id] ?? []
    const progress = openTrail.steps.length > 0
      ? Math.round((completed.length / openTrail.steps.length) * 100)
      : 0

    return (
      <div className="flex flex-col min-h-screen relative">
        <div className="bg-glow" />
        <div className="relative z-10 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
          <button
            onClick={() => { setOpenTrailId(null); setExpandedStep(null) }}
            className="flex items-center gap-2 mb-6 text-sm transition-colors"
            style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar às Trilhas
          </button>

          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${openTrail.color}15`, border: `1px solid ${openTrail.color}30`, color: openTrail.color }}
            >
              <Icon className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold leading-tight" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                {openTrail.title}
              </h1>
              <p className="text-sm mt-1" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>{openTrail.subtitle}</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>Progresso</span>
              <span className="text-xs font-bold" style={{ color: openTrail.color, fontFamily: 'Poppins, sans-serif' }}>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(201,168,76,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${openTrail.color}, ${openTrail.color}CC)` }} />
            </div>
          </div>

          <div className="space-y-3">
            {openTrail.steps.map((step, si) => {
              const isExpanded = expandedStep === si
              const isDone = completed.includes(si)
              const displayContent = step.contentSubtopicId
                ? (stepContent[step.contentSubtopicId] || step.content || 'Carregando conteúdo...')
                : step.content

              return (
                <div
                  key={si}
                  className="rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    background: isExpanded ? 'rgba(20,18,14,0.9)' : 'rgba(20,18,14,0.5)',
                    border: isExpanded ? `1px solid ${openTrail.color}40` : '1px solid rgba(201,168,76,0.08)',
                  }}
                >
                  <button
                    onClick={() => {
                      setExpandedStep(isExpanded ? null : si)
                      if (!isExpanded && step.contentSubtopicId) {
                        loadSubtopicContent(step.contentSubtopicId)
                      }
                    }}
                    className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{
                        background: isDone ? openTrail.color : `${openTrail.color}15`,
                        color: isDone ? '#0F0E0C' : openTrail.color,
                        border: `1px solid ${openTrail.color}30`,
                        fontFamily: 'Cinzel, serif',
                      }}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : si + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>{step.label}</span>
                      <span className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>{step.description}</span>
                    </div>
                    <ChevronDown
                      className="w-5 h-5 flex-shrink-0 transition-transform duration-300"
                      style={{ color: '#7A7368', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="rounded-xl p-5 mb-4" style={{ background: 'rgba(22,18,14,0.6)', border: '1px solid rgba(201,168,76,0.06)' }}>
                        {displayContent.split('\n\n').map((paragraph, pi) => (
                          <p key={pi} className="text-sm leading-relaxed mb-3 last:mb-0" style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}>
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      {user && (
                        <button
                          onClick={() => toggleStepComplete(openTrail.id, si)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
                          style={{
                            fontFamily: 'Poppins, sans-serif',
                            background: isDone ? 'rgba(76,175,80,0.12)' : `${openTrail.color}15`,
                            border: isDone ? '1px solid rgba(76,175,80,0.3)' : `1px solid ${openTrail.color}30`,
                            color: isDone ? '#66BB6A' : openTrail.color,
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {isDone ? 'Concluído' : 'Marcar como concluído'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─── TRAIL LIST VIEW ───
  const visibleTrails = typeof limit === 'number' ? trails.slice(0, limit) : trails

  return (
    <div className="flex flex-col relative">
      {!hideHeader && <div className="bg-glow" />}
      {!hideHeader && (
        <section className="page-header relative z-10">
          <h1>Trilhas de Aprendizado</h1>
          <p className="subtitle">
            Caminhos estruturados para aprender a fé católica passo a passo. Escolha uma trilha e estude o conteúdo diretamente aqui.
          </p>
          <div className="ornament-divider max-w-sm mx-auto mt-4"><span>&#10022;</span></div>
        </section>
      )}

      <main className="relative z-10 flex-1 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleTrails.map((trail, i) => {
            const Icon = ICON_MAP[trail.iconName] ?? BookOpen
            const completed = completedSteps[trail.id] ?? []
            const progress = trail.steps.length > 0
              ? Math.round((completed.length / trail.steps.length) * 100)
              : 0

            return (
              <button
                key={trail.id}
                onClick={() => { setOpenTrailId(trail.id); setExpandedStep(null) }}
                className="feature-card fade-in flex flex-col text-left"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${trail.color}15`, border: `1px solid ${trail.color}30`, color: trail.color }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold leading-tight" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>{trail.title}</h3>
                    <p className="text-xs mt-1" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>{trail.subtitle}</p>
                  </div>
                </div>

                <span
                  className="self-start text-xs px-3 py-1 rounded-full mb-4"
                  style={{ background: DIFFICULTY_COLORS[trail.difficulty] || DIFFICULTY_COLORS['Iniciante'], color: trail.color, fontFamily: 'Poppins, sans-serif' }}
                >
                  {trail.difficulty}
                </span>

                <p className="text-sm leading-relaxed mb-6" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}>
                  {trail.description}
                </p>

                {progress > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>{completed.length}/{trail.steps.length} etapas</span>
                      <span className="text-[10px] font-bold" style={{ color: trail.color }}>{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(201,168,76,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${progress}%`, background: trail.color }} />
                    </div>
                  </div>
                )}

                <div className="space-y-0 mt-auto">
                  {trail.steps.map((step, si) => {
                    const isDone = completed.includes(si)
                    return (
                      <div key={si} className="flex items-center gap-3 py-2.5 px-2 -mx-2" style={{ borderTop: si === 0 ? '1px solid rgba(201,168,76,0.08)' : 'none' }}>
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{
                            background: isDone ? trail.color : `${trail.color}15`,
                            color: isDone ? '#0F0E0C' : trail.color,
                            fontFamily: 'Cinzel, serif',
                            border: `1px solid ${trail.color}30`,
                          }}
                        >
                          {isDone ? <Check className="w-3 h-3" /> : si + 1}
                        </span>
                        <span className="text-sm flex-1" style={{ color: isDone ? '#B8AFA2' : '#F2EDE4', fontFamily: 'Poppins, sans-serif', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.7 : 1 }}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
