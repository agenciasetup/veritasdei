'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, ArrowRight, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TrailProgress {
  trailId: string
  title: string
  color: string
  totalSteps: number
  completedSteps: number
  percentage: number
}

interface ContinueLearningProps {
  userId: string | undefined
}

export default function ContinueLearning({ userId }: ContinueLearningProps) {
  const [trails, setTrails] = useState<TrailProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function loadProgress() {
      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        // Load visible trails with their steps count
        const { data: dbTrails } = await supabase
          .from('trails')
          .select('id, title, color')
          .eq('visible', true)
          .order('sort_order')

        if (!dbTrails || dbTrails.length === 0) {
          setLoading(false)
          return
        }

        const trailIds = dbTrails.map((t: { id: string }) => t.id)

        // Load step counts and user progress in parallel
        const [stepsResult, progressResult] = await Promise.all([
          supabase
            .from('trail_steps')
            .select('trail_id')
            .in('trail_id', trailIds),
          supabase
            .from('user_trail_progress')
            .select('trail_id, step_index')
            .eq('user_id', userId),
        ])

        // Count steps per trail
        const stepCounts: Record<string, number> = {}
        ;(stepsResult.data ?? []).forEach((s: { trail_id: string }) => {
          stepCounts[s.trail_id] = (stepCounts[s.trail_id] || 0) + 1
        })

        // Count completed steps per trail
        const completedCounts: Record<string, number> = {}
        ;(progressResult.data ?? []).forEach((p: { trail_id: string }) => {
          completedCounts[p.trail_id] = (completedCounts[p.trail_id] || 0) + 1
        })

        // Build trail progress — only show trails with some progress (in-progress)
        const inProgress: TrailProgress[] = dbTrails
          .map((t: { id: string; title: string; color: string }) => {
            const total = stepCounts[t.id] || 0
            const completed = completedCounts[t.id] || 0
            return {
              trailId: t.id,
              title: t.title,
              color: t.color || '#C9A84C',
              totalSteps: total,
              completedSteps: completed,
              percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            }
          })
          .filter((t: TrailProgress) => t.completedSteps > 0 && t.percentage < 100)

        setTrails(inProgress)
      } catch {
        // Silently fail — this is a non-critical dashboard widget
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [userId])

  // Don't render anything if no trails in progress or still loading
  if (loading || trails.length === 0) return null

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 px-4 md:max-w-none md:mx-0 md:mt-2 md:px-0 fade-in" style={{ animationDelay: '0.35s' }}>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <BookOpen className="w-4 h-4" style={{ color: 'var(--gold)' }} />
        <h3
          className="text-xs tracking-[0.15em] uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
        >
          Continue sua jornada
        </h3>
      </div>

      {/* Trail progress cards */}
      <div className="space-y-2.5">
        {trails.slice(0, 2).map((trail) => (
          <Link
            key={trail.trailId}
            href="/trilhas"
            className="group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300"
            style={{
              background: 'rgba(20,18,14,0.6)',
              border: '1px solid var(--border-gold)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${trail.color}15`, border: `1px solid ${trail.color}30` }}
            >
              <GraduationCap className="w-5 h-5" style={{ color: trail.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: 'var(--text-primary)', fontFamily: 'Poppins, sans-serif' }}
              >
                {trail.title}
              </p>

              {/* Progress bar */}
              <div className="flex items-center gap-2 mt-1.5">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'rgba(242,237,228,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${trail.percentage}%`,
                      background: `linear-gradient(90deg, ${trail.color}, ${trail.color}CC)`,
                    }}
                  />
                </div>
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
                >
                  {trail.percentage}%
                </span>
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight
              className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: 'var(--text-muted)' }}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
