import type { RosarySessionWithIntention } from '@/features/rosario/data/historyTypes'

/**
 * Estatísticas compactas de um conjunto de sessões — total, tempo total,
 * sequência atual (dias consecutivos até hoje) e contagem por mistério.
 *
 * Server-side friendly (pure component).
 */

const MYSTERY_LABEL: Record<string, string> = {
  gozosos: 'Gozosos',
  luminosos: 'Luminosos',
  dolorosos: 'Dolorosos',
  gloriosos: 'Gloriosos',
}

const MYSTERY_ORDER = ['gozosos', 'luminosos', 'dolorosos', 'gloriosos'] as const

function startOfDay(d: Date): number {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy.getTime()
}

function computeCurrentStreak(sessions: RosarySessionWithIntention[]): number {
  if (sessions.length === 0) return 0
  // Sessões vêm ordenadas por completed_at DESC.
  const daysWithSession = new Set<number>()
  for (const s of sessions) {
    daysWithSession.add(startOfDay(new Date(s.completed_at)))
  }

  const today = startOfDay(new Date())
  const yesterday = today - 24 * 60 * 60 * 1000

  // A sequência só conta se o usuário rezou hoje OU ontem (margem de
  // um dia — ainda dá tempo de manter a sequência viva rezando hoje).
  let cursor: number
  if (daysWithSession.has(today)) cursor = today
  else if (daysWithSession.has(yesterday)) cursor = yesterday
  else return 0

  let streak = 0
  while (daysWithSession.has(cursor)) {
    streak++
    cursor -= 24 * 60 * 60 * 1000
  }
  return streak
}

function formatTotalTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '—'
  const mins = Math.round(totalSeconds / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  if (hours < 24) {
    return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`
  }
  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  return restHours > 0 ? `${days}d ${restHours}h` : `${days}d`
}

export interface HistoryStatsProps {
  sessions: RosarySessionWithIntention[]
}

export function HistoryStats({ sessions }: HistoryStatsProps) {
  const total = sessions.length
  const totalSeconds = sessions.reduce(
    (acc, s) => acc + (s.duration_seconds ?? 0),
    0,
  )
  const streak = computeCurrentStreak(sessions)

  const byMystery: Record<string, number> = {
    gozosos: 0,
    luminosos: 0,
    dolorosos: 0,
    gloriosos: 0,
  }
  for (const s of sessions) {
    byMystery[s.mystery_set] = (byMystery[s.mystery_set] ?? 0) + 1
  }

  return (
    <section
      className="rounded-2xl border p-5 md:p-6"
      style={{
        borderColor: 'rgba(201, 168, 76, 0.22)',
        backgroundColor: 'rgba(20, 18, 14, 0.6)',
      }}
      aria-label="Estatísticas do histórico"
    >
      <div className="grid grid-cols-3 gap-4 text-center">
        <Stat value={String(total)} label="terços rezados" />
        <Stat value={formatTotalTime(totalSeconds)} label="tempo total" />
        <Stat
          value={streak > 0 ? String(streak) : '—'}
          label={streak === 1 ? 'dia de sequência' : 'dias em sequência'}
        />
      </div>

      {total > 0 && (
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}>
          <div
            className="mb-2 text-[10px] uppercase tracking-[0.2em]"
            style={{ color: '#7A7368' }}
          >
            Por mistério
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
            {MYSTERY_ORDER.map((key) => (
              <li
                key={key}
                className="flex items-baseline justify-between"
                style={{ color: '#F2EDE4' }}
              >
                <span className="text-xs" style={{ color: '#7A7368' }}>
                  {MYSTERY_LABEL[key]}
                </span>
                <span className="font-mono text-sm" style={{ color: '#D9C077' }}>
                  {byMystery[key]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        className="font-serif text-2xl md:text-3xl"
        style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
      >
        {value}
      </div>
      <div
        className="mt-0.5 text-[10px] uppercase tracking-[0.2em]"
        style={{ color: '#7A7368' }}
      >
        {label}
      </div>
    </div>
  )
}
