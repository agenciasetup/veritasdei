'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getLiturgicalDay, type LiturgicalDay } from '@/lib/liturgical-calendar'

/* ─── Color mapping for liturgical colors ─── */
const LITURGICAL_COLORS: Record<string, { dot: string; bg: string; border: string }> = {
  branco:   { dot: '#F2EDE4', bg: 'rgba(242,237,228,0.06)', border: 'rgba(242,237,228,0.12)' },
  vermelho: { dot: '#D94F5C', bg: 'rgba(217,79,92,0.06)',   border: 'rgba(217,79,92,0.12)' },
  verde:    { dot: '#66BB6A', bg: 'rgba(76,175,80,0.06)',    border: 'rgba(76,175,80,0.12)' },
  roxo:     { dot: '#BA68C8', bg: 'rgba(156,39,176,0.06)',   border: 'rgba(156,39,176,0.12)' },
  rosa:     { dot: '#F48FB1', bg: 'rgba(244,143,177,0.06)',  border: 'rgba(244,143,177,0.12)' },
  dourado:  { dot: '#C9A84C', bg: 'rgba(201,168,76,0.06)',   border: 'rgba(201,168,76,0.12)' },
}

const GRADE_LABELS: Record<string, string> = {
  solenidade: 'Solenidade',
  festa: 'Festa',
  memorial: 'Memória',
  memorial_facultativo: 'Memória Facultativa',
  feria: 'Féria',
}

function computeToday(): LiturgicalDay {
  return getLiturgicalDay(new Date())
}

function formatDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function LiturgicalBar() {
  const [day, setDay] = useState<LiturgicalDay>(computeToday)
  const [expanded, setExpanded] = useState(false)

  // Recompute at midnight
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const ms = tomorrow.getTime() - now.getTime()
    const timer = setTimeout(() => setDay(computeToday()), ms)
    return () => clearTimeout(timer)
  }, [])

  const colors = LITURGICAL_COLORS[day.color] ?? LITURGICAL_COLORS.verde
  const hoje = formatDate()

  return (
    <div className="w-full relative z-40">
      {/* ─── Compact bar (always visible) ─── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 transition-colors duration-300 cursor-pointer"
        style={{
          background: colors.bg,
          borderBottom: `1px solid ${colors.border}`,
        }}
        aria-expanded={expanded}
        aria-label="Expandir calendário litúrgico"
      >
        {/* Liturgical color dot */}
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: colors.dot, boxShadow: `0 0 6px ${colors.dot}40` }}
        />

        {/* Main text */}
        <span
          className="text-xs tracking-wide truncate"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
        >
          <span className="font-medium" style={{ color: colors.dot }}>
            {day.season}
          </span>
          <span className="mx-1.5 opacity-40">·</span>
          <span>{day.name}</span>
          <span className="hidden sm:inline">
            <span className="mx-1.5 opacity-40">·</span>
            <span className="capitalize">{hoje}</span>
          </span>
        </span>

        {/* Expand indicator */}
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
        }
      </button>

      {/* ─── Expanded detail panel ─── */}
      {expanded && (
        <div
          className="absolute top-full left-0 right-0 px-4 py-4 md:py-5 z-50 fade-in"
          style={{
            background: 'rgba(15,14,12,0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${colors.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div className="max-w-lg mx-auto text-center space-y-2">
            {/* Date */}
            <p
              className="text-xs tracking-wider uppercase capitalize"
              style={{ color: 'var(--text-muted)', fontFamily: 'Poppins, sans-serif' }}
            >
              {hoje}
            </p>

            {/* Saint / Feast name */}
            <h3
              className="text-lg font-bold"
              style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
            >
              {day.name}
            </h3>

            {/* Title */}
            {day.title && (
              <p
                className="text-sm italic"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-secondary)' }}
              >
                {day.title}
              </p>
            )}

            {/* Badges row */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <span
                className="text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase"
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.dot,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {GRADE_LABELS[day.grade] ?? day.grade}
              </span>
              <span
                className="text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase"
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: 'var(--text-muted)',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {day.season}
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: colors.dot }}
                />
                <span
                  className="text-[10px] tracking-wider uppercase"
                  style={{ color: colors.dot, fontFamily: 'Poppins, sans-serif' }}
                >
                  {day.color}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
