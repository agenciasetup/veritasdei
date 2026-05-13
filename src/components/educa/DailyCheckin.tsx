'use client'

/**
 * DailyCheckin — 7 gemas representando os últimos 7 dias.
 *
 * Hoje destacado (com glow). Dias passados marcam ✓ se foram dias com
 * estudo (deduzido do `current_streak`). Sem nova tabela: derivamos
 * o estado dos 7 dias a partir de `current_streak` + `studied_today`:
 *   - Se streak=3 e studied_today=true → hoje + 2 anteriores estão ✓.
 *   - Se streak=5 e studied_today=false → últimos 5 dias antes de hoje ✓.
 *
 * Não é cronologicamente exato — mas dá o feedback visual essencial
 * (foco em "não quebrar a sequência"). Quando virmos pra logs precisos,
 * trocamos por query de `user_xp_logs` distinct date.
 */

import { useMemo } from 'react'
import { Check, Flame, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useGamification } from '@/lib/gamification/useGamification'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] // dom→sáb (PT-BR)

type DayState = {
  /** Letra do dia da semana. */
  label: string
  /** Número do dia do mês. */
  dayNumber: number
  /** Esse é "hoje" (relativo ao agora). */
  isToday: boolean
  /** Esse dia foi "checked-in" (estudou). */
  checked: boolean
  /** Esse dia é no futuro (ainda não chegou). */
  future: boolean
}

function buildWeek(streak: number, studiedToday: boolean): DayState[] {
  const today = new Date()
  // Pega segunda-feira da semana (start of week)
  const dayOfWeek = today.getDay() // 0 = domingo
  const days: DayState[] = []

  // Calcula quantos dos últimos N dias estiveram check-in.
  // Se studied_today=true, hoje conta e o streak inclui hoje.
  // Se studied_today=false, streak refere-se a dias ANTES de hoje
  //   (ontem, anteontem, ...).
  const checkedBackCount = studiedToday ? streak : streak

  // Constrói 7 dias da semana corrente (domingo a sábado).
  for (let i = 0; i < 7; i++) {
    const offset = i - dayOfWeek // distância em dias até este slot
    const d = new Date(today)
    d.setDate(today.getDate() + offset)

    const isToday = offset === 0
    const future = offset > 0
    let checked = false

    if (!future) {
      const daysAgo = -offset // 0 = hoje, 1 = ontem, ...
      if (daysAgo === 0) {
        checked = studiedToday
      } else {
        // Se estudou nos últimos N dias seguidos, esses dias estão checked.
        // Ajuste: se NÃO estudou hoje, a sequência começa em "ontem".
        const referenceStart = studiedToday ? 0 : 1
        checked = daysAgo >= referenceStart && daysAgo < referenceStart + checkedBackCount
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
    <section
      className="rounded-3xl p-4 md:p-5"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface-2)) 0%, var(--surface-2) 60%)',
        border: '1px solid var(--border-1)',
      }}
    >
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <Flame
            className="w-4 h-4"
            style={{
              color: gami.currentStreak > 0 ? 'var(--accent)' : 'var(--text-3)',
            }}
          />
          <h3
            className="text-sm tracking-[0.15em] uppercase"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Sequência diária
          </h3>
        </div>
        <p
          className="text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {gami.currentStreak} dia{gami.currentStreak === 1 ? '' : 's'}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {days.map((d, i) => (
          <div key={i} className="contents">
            <DayCell day={d} />
          </div>
        ))}
      </div>

      <p
        className="text-[11px] mt-3"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {gami.studiedToday
          ? 'Você já estudou hoje. Continue assim!'
          : 'Estude qualquer subtópico hoje pra manter a sequência.'}
      </p>
    </section>
  )
}

function DayCell({ day }: { day: DayState }) {
  const base = {
    background: 'var(--surface-inset)',
    border: '1px solid var(--border-1)',
    color: 'var(--text-3)',
  }
  const checked = {
    background:
      'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, black) 100%)',
    border: '1px solid color-mix(in srgb, var(--accent) 60%, transparent)',
    color: 'var(--accent-contrast)',
    boxShadow: '0 2px 8px -2px color-mix(in srgb, var(--accent) 50%, transparent)',
  }
  const today = {
    border: '1.5px solid var(--accent)',
    boxShadow: '0 0 12px color-mix(in srgb, var(--accent) 40%, transparent)',
  }

  const style = day.checked
    ? checked
    : day.future
      ? { ...base, opacity: 0.4 }
      : base
  const styleWithToday = day.isToday && !day.checked ? { ...style, ...today } : style

  return (
    <div
      className="aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] relative"
      style={styleWithToday}
    >
      <span
        className="tracking-wider opacity-70"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {day.label}
      </span>
      {day.checked ? (
        <Check className="w-4 h-4 mt-0.5" />
      ) : (
        <span
          className="text-sm font-semibold mt-0.5"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {day.dayNumber}
        </span>
      )}
      {day.isToday && day.checked && (
        <Sparkles
          className="w-2.5 h-2.5 absolute top-1 right-1"
          style={{ color: 'var(--accent-contrast)' }}
        />
      )}
    </div>
  )
}
