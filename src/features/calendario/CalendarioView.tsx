'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getLiturgicalDay, type LiturgicalDay } from '@/lib/liturgical-calendar'
import Divider from '@/components/ui/Divider'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const LITURGICAL_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  branco:   { dot: '#F2EDE4', bg: 'rgba(242,237,228,0.08)', text: '#F2EDE4' },
  vermelho: { dot: '#D94F5C', bg: 'rgba(217,79,92,0.08)',   text: '#D94F5C' },
  verde:    { dot: '#66BB6A', bg: 'rgba(76,175,80,0.08)',    text: '#66BB6A' },
  roxo:     { dot: '#BA68C8', bg: 'rgba(156,39,176,0.08)',   text: '#BA68C8' },
  rosa:     { dot: '#F48FB1', bg: 'rgba(244,143,177,0.08)',  text: '#F48FB1' },
}

const GRADE_LABELS: Record<string, string> = {
  solenidade: 'Solenidade',
  festa: 'Festa',
  memorial: 'Memória',
  memorial_facultativo: 'Memória Facultativa',
  feria: 'Féria',
}

interface CalendarDay {
  date: Date
  liturgical: LiturgicalDay
  isCurrentMonth: boolean
  isToday: boolean
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const today = new Date()
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days: CalendarDay[] = []

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date,
      liturgical: getLiturgicalDay(date),
      isCurrentMonth: false,
      isToday: false,
    })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    days.push({
      date,
      liturgical: getLiturgicalDay(date),
      isCurrentMonth: true,
      isToday: date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear(),
    })
  }

  // Next month padding to fill 6 rows max
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      liturgical: getLiturgicalDay(date),
      isCurrentMonth: false,
      isToday: false,
    })
  }

  return days
}

export default function CalendarioView() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  const days = useMemo(() => getCalendarDays(year, month), [year, month])

  // Initialize selected with today
  const todayDay = useMemo(() => days.find(d => d.isToday) ?? null, [days])

  const active = selectedDay ?? todayDay

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11) }
    else setMonth(month - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0) }
    else setMonth(month + 1)
    setSelectedDay(null)
  }

  function goToToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDay(null)
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <section className="relative z-10 text-center px-5 pt-8 pb-4">
        <h1
          className="text-2xl md:text-3xl tracking-[0.08em] uppercase"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-1)',
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          Calendário Litúrgico
        </h1>
        <p
          className="mt-2 text-sm max-w-md mx-auto"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Acompanhe os tempos litúrgicos, festas e santos do ano
        </p>
        <Divider variant="ornament" className="max-w-[180px] mx-auto" spacing="default" />
      </section>

      <main className="relative z-10 flex-1 pb-28 md:pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2
                className="text-lg font-bold tracking-[0.06em] uppercase"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
              >
                {MONTH_NAMES[month]} {year}
              </h2>
              <button
                onClick={goToToday}
                className="text-[10px] tracking-wider uppercase mt-1"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
              >
                Hoje
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)' }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar grid */}
          <div
            className="rounded-2xl overflow-hidden mb-6"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
            }}
          >
            {/* Day names header */}
            <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-2)' }}>
              {DAY_NAMES.map((name, i) => (
                <div
                  key={name}
                  className="py-2 text-center text-[10px] tracking-wider uppercase"
                  style={{
                    color: i === 0 ? 'var(--danger)' : 'var(--text-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const colors = LITURGICAL_COLORS[day.liturgical.color] ?? LITURGICAL_COLORS.verde
                const isSelected = active && day.date.getTime() === active.date.getTime()
                const isSunday = day.date.getDay() === 0
                const isImportant = day.liturgical.grade === 'solenidade' || day.liturgical.grade === 'festa'

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className="relative p-1 md:p-2 min-h-[48px] md:min-h-[64px] text-center transition-colors border-b border-r"
                    style={{
                      borderColor: 'var(--border-2)',
                      background: isSelected
                        ? 'var(--accent-soft)'
                        : day.isToday
                          ? 'color-mix(in srgb, var(--accent) 6%, transparent)'
                          : 'transparent',
                      opacity: day.isCurrentMonth ? 1 : 0.3,
                    }}
                  >
                    {/* Day number */}
                    <span
                      className="text-sm font-medium block"
                      style={{
                        fontFamily: 'var(--font-body)',
                        color: day.isToday
                          ? 'var(--accent)'
                          : isImportant
                            ? colors.text
                            : isSunday
                              ? 'var(--danger)'
                              : 'var(--text-2)',
                      }}
                    >
                      {day.date.getDate()}
                    </span>

                    {/* Liturgical color dot */}
                    <span
                      className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5 block"
                      style={{ background: colors.dot }}
                    />

                    {/* Name (hidden on mobile for non-important) */}
                    {isImportant && day.isCurrentMonth && (
                      <span
                        className="text-[8px] leading-tight block mt-0.5 truncate hidden md:block"
                        style={{ color: colors.text, fontFamily: 'var(--font-body)' }}
                      >
                        {day.liturgical.name.length > 20
                          ? day.liturgical.name.substring(0, 18) + '...'
                          : day.liturgical.name}
                      </span>
                    )}

                    {/* Today indicator */}
                    {day.isToday && (
                      <span
                        className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--accent)' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected day detail */}
          {active && (
            <div
              className="rounded-2xl p-5 md:p-6 fade-in"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-1)',
              }}
            >
              <div className="flex items-start gap-4">
                {/* Color indicator */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: (LITURGICAL_COLORS[active.liturgical.color] ?? LITURGICAL_COLORS.verde).bg,
                    border: `1px solid ${(LITURGICAL_COLORS[active.liturgical.color] ?? LITURGICAL_COLORS.verde).dot}30`,
                  }}
                >
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: (LITURGICAL_COLORS[active.liturgical.color] ?? LITURGICAL_COLORS.verde).dot,
                      boxShadow: `0 0 8px ${(LITURGICAL_COLORS[active.liturgical.color] ?? LITURGICAL_COLORS.verde).dot}40`,
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Date */}
                  <p
                    className="text-[10px] tracking-[0.15em] uppercase mb-1"
                    style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                  >
                    {active.date.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>

                  {/* Name */}
                  <h3
                    className="text-lg font-bold mb-1 tracking-[0.04em]"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
                  >
                    {active.liturgical.name}
                  </h3>

                  {/* Title */}
                  {active.liturgical.title && (
                    <p
                      className="text-sm italic mb-3"
                      style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-2)' }}
                    >
                      {active.liturgical.title}
                    </p>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className="text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase"
                      style={{
                        background: (LITURGICAL_COLORS[active.liturgical.color] ?? LITURGICAL_COLORS.verde).bg,
                        border: `1px solid ${(LITURGICAL_COLORS[active.liturgical.color] ?? LITURGICAL_COLORS.verde).dot}25`,
                        color: (LITURGICAL_COLORS[active.liturgical.color] ?? LITURGICAL_COLORS.verde).text,
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {GRADE_LABELS[active.liturgical.grade] ?? active.liturgical.grade}
                    </span>
                    <span
                      className="text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase"
                      style={{
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent-soft)',
                        color: 'var(--accent)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {active.liturgical.season}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[10px] tracking-wider uppercase"
                      style={{
                        color: (LITURGICAL_COLORS[active.liturgical.color] ?? LITURGICAL_COLORS.verde).text,
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ background: (LITURGICAL_COLORS[active.liturgical.color] ?? LITURGICAL_COLORS.verde).dot }}
                      />
                      {active.liturgical.color}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6">
            <p
              className="text-[10px] tracking-[0.15em] uppercase mb-3"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Cores litúrgicas
            </p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(LITURGICAL_COLORS).map(([name, c]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: c.dot }} />
                  <span
                    className="text-[11px] capitalize"
                    style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
