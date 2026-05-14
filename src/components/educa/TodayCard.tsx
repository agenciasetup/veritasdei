'use client'

/**
 * TodayCard — bloco unificado "Hoje". Junta o que antes eram 3 superfícies
 * separadas (missão do dia, sequência semanal, barra de XP) num só card.
 *
 * É o motor de retenção: mostra a UMA coisa que o usuário precisa fazer
 * hoje (missão), o quanto ele já vem mantendo o hábito (semana), e o quão
 * perto está do próximo nível.
 *
 * - missão: useDailyMission (tabela daily_missions, auto-criada)
 * - semana: derivada de current_streak + studied_today
 * - XP:     useGamification (xpInLevel / xpToNextLevel / percentInLevel)
 */

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight, Check, Flame } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'
import { useDailyMission } from '@/lib/gamification/useDailyMission'
import type { DailyMission, MissionType } from '@/types/gamification'

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

function missionCopy(m: DailyMission): { label: string; href: string } {
  const type = m.mission_type as MissionType
  switch (type) {
    case 'pray_rosary':
      return { label: 'Reze o rosário de hoje', href: '/rosario' }
    case 'read_liturgy':
      return { label: 'Leia a liturgia do dia', href: '/liturgia/hoje' }
    case 'review_pillar':
      return { label: 'Revise um pilar da fé', href: '/educa/estudo' }
    case 'study_subtopic':
    default:
      return {
        label:
          m.target > 1
            ? `Estude ${m.target} subtópicos hoje`
            : 'Estude 1 subtópico hoje',
        href: '/educa/estudo',
      }
  }
}

export default function TodayCard() {
  const { user } = useAuth()
  const gami = useGamification(user?.id)
  const { mission, claim } = useDailyMission(user?.id)

  const days = useMemo(
    () => buildWeek(gami.currentStreak, gami.studiedToday),
    [gami.currentStreak, gami.studiedToday],
  )

  const copy = mission ? missionCopy(mission) : null
  const done = mission?.completed ?? false
  const canClaim = done && !(mission?.claimed ?? true)

  return (
    <div
      className="h-full rounded-[24px] p-6 lg:p-7 flex flex-col"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Header */}
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
          Hoje
        </h3>
        <span
          className="ml-auto text-[11px]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {gami.currentStreak > 0
            ? `${gami.currentStreak} dia${gami.currentStreak === 1 ? '' : 's'} de sequência`
            : 'Sem sequência ainda'}
        </span>
      </div>

      {/* Missão do dia */}
      {copy && (
        <div
          className="mt-4 rounded-2xl p-4"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: done
              ? '1px solid rgba(201,168,76,0.3)'
              : '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] tracking-[0.16em] uppercase"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
            >
              Missão do dia
            </span>
            <span
              className="ml-auto text-[11px]"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              +{mission?.xp_reward ?? 20} XP
            </span>
          </div>
          <p
            className="text-base leading-snug"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            {copy.label}
          </p>

          {canClaim ? (
            <button
              type="button"
              onClick={() => void claim()}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm transition-colors"
              style={{
                background: 'rgba(201,168,76,0.14)',
                border: '1px solid rgba(201,168,76,0.4)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Check className="w-4 h-4" />
              Resgatar +{mission?.xp_reward ?? 20} XP
            </button>
          ) : done ? (
            <p
              className="mt-2 inline-flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
            >
              <Check className="w-3.5 h-3.5" />
              Missão cumprida hoje
            </p>
          ) : (
            <Link
              href={copy.href}
              className="mt-3 inline-flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
            >
              Cumprir missão
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      {/* Semana */}
      <div className="mt-5 flex justify-between gap-1.5">
        {days.map((d, i) => (
          <DayDot key={i} day={d} />
        ))}
      </div>

      {/* XP — uma progressão clara */}
      <div className="mt-auto pt-5">
        <div className="flex items-baseline justify-between mb-1.5">
          <span
            className="text-[11px]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Nível {gami.level}
          </span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Faltam {gami.xpToNextLevel} XP pro Nível {gami.level + 1}
          </span>
        </div>
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(242,237,228,0.06)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${gami.percentInLevel}%`,
              background: 'var(--accent)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function DayDot({ day }: { day: DayState }) {
  const checkedStyle = {
    background:
      'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
    color: 'var(--accent-contrast)',
    border: '1px solid color-mix(in srgb, var(--accent) 70%, transparent)',
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
    boxShadow: '0 0 14px color-mix(in srgb, var(--accent) 45%, transparent)',
  }
  const style = day.future
    ? { ...baseStyle, opacity: 0.4 }
    : day.checked
      ? checkedStyle
      : baseStyle
  const final =
    day.isToday && !day.checked ? { ...style, ...todayHighlight } : style

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
