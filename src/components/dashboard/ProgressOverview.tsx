'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, Church, Droplets, Tablets, BookOpen, ScrollText, Scale, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CategoryProgress {
  slug: string
  title: string
  icon: React.ElementType
  studied: number
  total: number
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  dogmas: Church,
  sacramentos: Droplets,
  mandamentos: Tablets,
  oracoes: BookOpen,
  preceitos: ScrollText,
  'virtudes-pecados': Scale,
  'obras-misericordia': Heart,
}

const CATEGORY_LABELS: Record<string, string> = {
  dogmas: 'Dogmas',
  sacramentos: 'Sacramentos',
  mandamentos: 'Mandamentos',
  oracoes: 'Orações',
  preceitos: 'Preceitos',
  'virtudes-pecados': 'Virtudes',
  'obras-misericordia': 'Misericórdia',
}

interface ProgressOverviewProps {
  userId: string | undefined
}

export default function ProgressOverview({ userId }: ProgressOverviewProps) {
  const [categories, setCategories] = useState<CategoryProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function load() {
      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        // Load all content groups with subtopic counts
        const { data: groups } = await supabase
          .from('content_groups')
          .select('id, slug, title')
          .eq('visible', true)

        if (!groups || groups.length === 0) {
          setLoading(false)
          return
        }

        // Load total subtopics per group
        const { data: subtopicCounts } = await supabase
          .from('content_subtopics')
          .select('id, topic_id')

        const { data: topics } = await supabase
          .from('content_topics')
          .select('id, group_id')

        // Load user progress
        const { data: progress } = await supabase
          .from('user_content_progress')
          .select('content_type, subtopic_id')
          .eq('user_id', userId)

        // Build topic -> group mapping
        const topicToGroup: Record<string, string> = {}
        ;(topics ?? []).forEach((t: { id: string; group_id: string }) => {
          topicToGroup[t.id] = t.group_id
        })

        // Count subtopics per group
        const subtopicsPerGroup: Record<string, number> = {}
        ;(subtopicCounts ?? []).forEach((s: { id: string; topic_id: string }) => {
          const groupId = topicToGroup[s.topic_id]
          if (groupId) {
            subtopicsPerGroup[groupId] = (subtopicsPerGroup[groupId] || 0) + 1
          }
        })

        // Count studied per content_type
        const studiedPerType: Record<string, number> = {}
        ;(progress ?? []).forEach((p: { content_type: string }) => {
          studiedPerType[p.content_type] = (studiedPerType[p.content_type] || 0) + 1
        })

        // Build category progress
        const result: CategoryProgress[] = groups
          .map((g: { id: string; slug: string; title: string }) => ({
            slug: g.slug,
            title: CATEGORY_LABELS[g.slug] || g.title,
            icon: CATEGORY_ICONS[g.slug] || BookOpen,
            studied: studiedPerType[g.slug] || 0,
            total: subtopicsPerGroup[g.id] || 0,
          }))
          .filter((c: CategoryProgress) => c.total > 0)

        setCategories(result)
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  if (loading || categories.length === 0) return null

  const totalStudied = categories.reduce((sum, c) => sum + c.studied, 0)
  const totalItems = categories.reduce((sum, c) => sum + c.total, 0)
  const overallPercentage = totalItems > 0 ? Math.round((totalStudied / totalItems) * 100) : 0

  // Only show if user has studied at least 1 item
  if (totalStudied === 0) return null

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 fade-in" style={{ animationDelay: '0.4s' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          <h3
            className="text-xs tracking-[0.15em] uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
          >
            Sua Jornada na Fé
          </h3>
        </div>
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
        >
          {totalStudied}/{totalItems} estudados
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(242,237,228,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${overallPercentage}%`,
              background: 'linear-gradient(90deg, #C9A84C, #D9C077)',
            }}
          />
        </div>
      </div>

      {/* Category mini-bars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {categories.map((cat) => {
          const Icon = cat.icon
          const pct = cat.total > 0 ? Math.round((cat.studied / cat.total) * 100) : 0
          return (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{
                background: 'rgba(20,18,14,0.5)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: pct > 0 ? 'var(--gold)' : 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                <span
                  className="text-[11px] block truncate"
                  style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
                >
                  {cat.title}
                </span>
                <div
                  className="w-full h-1 rounded-full mt-1 overflow-hidden"
                  style={{ background: 'rgba(242,237,228,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100 ? '#66BB6A' : 'var(--gold)',
                    }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
