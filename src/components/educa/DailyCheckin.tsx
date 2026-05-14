'use client'

/**
 * DailyCheckin — fileira compacta dos 7 dias da semana.
 *
 * Versão premium: pílulas circulares pequenas, hoje destacado por glow
 * dourado, dias passados marcam ✓. Mantém glassmorphism externo via
 * <GlassCard variant="flat">.
 *
 * Derivado de `current_streak` + `studied_today` (sem nova tabela —
 * quando virmos logs precisos, trocamos por query distinct date).
 */

import { useMemo } from 'react'
import { Check, Flame } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'
import GlassCard from './GlassCard'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

type DayState = {
  label: string
  dayNumber: number
  isToday: boolean
  checked: boolean
  future: boolean
}

function buildWeek(streak: number, studiedToday: boolean): DayState[] {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const days: DayState[] = []

  for (let i = 0; i < 7; i++) {
    const offset = i - dayOfWeek
    const d = new Date(today)
    d.setDate(today.getDate() + offset)
    const isToday = offset === 0
    const future = offset > 0
    let checked = false
    if (!future) {
      const daysAgo = -offset
      if (daysAgo === 0) {
        checked = studiedToday
      } else {
        const referenceStart = studiedToday ? 0 : 1
        checked = daysAgo >= referenceStart && daysAgo < referenceStart + streak
      }
    }
    days.push({
      label: WEEKDAYS[d.getDay()],
      dayNumber: d.getDate(),
      isToday,
      checked,
      future,
    })
  }
  return days
}

export default function DailyCheckin() {
  const { user } = useAuth()
  const gami = useGamification(user?.id)

  const days = useMemo(
    () => buildWeek(gami.currentStreak, gami.studiedToday),
    [gami.currentStreak, gami.studiedToday],
  )

  return (
    <GlassCard variant="flat" padded>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame
            className="w-4 h-4"
            strokeWidth={1.6}
            style={{
              color: gami.currentStreak > 0 ? 'var(--accent)' : 'var(--text-3)',
            }}
          />
          <h3
            className="text-sm"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            Sequência
          </h3>
        </div>
        <p
          className="text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {gami.currentStreak} dia{gami.currentStreak === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex justify-between gap-1.5">
        {days.map((d, i) => (
          <div key={i} className="contents">
            <DayDot day={d} />
          </div>
        ))}
      </div>

      <p
        className="text-[10px] mt-3 text-center"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {gami.studiedToday
          ? 'Você já estudou hoje. Continue assim!'
          : 'Estude qualquer subtópico hoje pra manter a sequência.'}
      </p>
    </GlassCard>
  )
}

function DayDot({ day }: { day: DayState }) {
  const checkedStyle = {
    background:
      'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
    color: 'var(--accent-contrast)',
    border:
      '1px solid color-mix(in srgb, var(--accent) 70%, transparent)',
    boxShadow:
      '0 2px 10px -2px color-mix(in srgb, var(--accent) 55%, transparent)',
  }
  const baseStyle = {
    background: 'rgba(0,0,0,0.35)',
    color: 'var(--text-3)',
    border: '1px solid color-mix(in srgb, var(--accent) 8%, transparent)',
  }
  const todayHighlight = {
    border: '1.5px solid var(--accent)',
    boxShadow:
      '0 0 14px color-mix(in srgb, var(--accent) 45%, transparent)',
  }

  const style = day.future
    ? { ...baseStyle, opacity: 0.4 }
    : day.checked
      ? checkedStyle
      : baseStyle
  const final = day.isToday && !day.checked ? { ...style, ...todayHighlight } : style

  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <span
        className="text-[9px] tracking-wider"
        style={{
          color: day.isToday ? 'var(--accent)' : 'var(--text-3)',
          fontFamily: 'var(--font-body)',
          fontWeight: day.isToday ? 600 : 400,
        }}
      >
        {day.label}
      </span>
      <div
        className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-[11px] font-semibold"
        style={final}
      >
        {day.checked ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <span style={{ fontFamily: 'var(--font-display)' }}>
            {day.dayNumber}
          </span>
        )}
      </div>
    </div>
  )
}
