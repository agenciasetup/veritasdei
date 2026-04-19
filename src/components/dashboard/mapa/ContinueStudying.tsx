'use client'

import Link from 'next/link'
import { Play, Sparkles, ArrowRight, Clock } from 'lucide-react'
import { useLastStudied } from '@/lib/content/useLastStudied'
import { useNextSuggestion } from '@/lib/content/useNextSuggestion'

interface ContinueStudyingProps {
  userId: string | undefined
}

export default function ContinueStudying({ userId }: ContinueStudyingProps) {
  const { last, loading: lastLoading } = useLastStudied(userId)
  const { suggestion, loading: nextLoading } = useNextSuggestion(userId)

  if (!userId) return null
  if (lastLoading && nextLoading) return null
  if (!last && !suggestion) return null

  return (
    <div className="space-y-3 fade-in" style={{ animationDelay: '0.25s' }}>
      {last && (
        <Link
          href={`/${last.groupSlug}`}
          className="group block rounded-2xl p-4 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.10), rgba(20,18,14,0.6))',
            border: '1px solid rgba(201,168,76,0.25)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
            <span
              className="text-[10px] tracking-[0.18em] uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
            >
              Continue de onde parou
            </span>
          </div>
          <p
            className="text-sm font-medium mb-1 line-clamp-2"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
          >
            {last.subtopicTitle}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-3 h-3" />
              <span>{formatRelative(last.studiedAt)} · {last.groupTitle}</span>
            </div>
            <ArrowRight
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              style={{ color: 'var(--gold)' }}
            />
          </div>
        </Link>
      )}

      {suggestion && (!last || suggestion.groupSlug !== last.groupSlug) && (
        <Link
          href={`/${suggestion.groupSlug}`}
          className="group block rounded-2xl p-4 transition-all"
          style={{
            background: 'rgba(20,18,14,0.55)',
            border: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <span
              className="text-[10px] tracking-[0.18em] uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-muted)' }}
            >
              {suggestion.reason === 'finish_started' ? 'Termine o que começou' : 'Sugestão para começar'}
            </span>
          </div>
          <p
            className="text-sm font-medium mb-1 line-clamp-2"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
          >
            {suggestion.subtopicTitle}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {suggestion.groupTitle} · {suggestion.studiedInGroup}/{suggestion.totalInGroup}
            </span>
            <ArrowRight
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              style={{ color: 'var(--text-muted)' }}
            />
          </div>
        </Link>
      )}
    </div>
  )
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`
  return d.toLocaleDateString('pt-BR')
}
