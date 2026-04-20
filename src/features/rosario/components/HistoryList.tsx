import type { RosarySessionWithIntention } from '@/features/rosario/data/historyTypes'

/**
 * Lista pura de sessões de terço, agrupadas por dia. Server-side friendly
 * (sem state, sem effects) — todo o render é determinístico a partir das
 * linhas já ordenadas por `completed_at DESC`.
 *
 * Formatação de data usa `Intl.DateTimeFormat('pt-BR', ...)` para evitar
 * depender de libs externas (date-fns etc.). Rótulos relativos "Hoje" /
 * "Ontem" são computados comparando só o dia local.
 */

const MYSTERY_LABEL: Record<string, string> = {
  gozosos: 'Gozosos',
  luminosos: 'Luminosos',
  dolorosos: 'Dolorosos',
  gloriosos: 'Gloriosos',
}

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
})

function startOfDay(d: Date): number {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy.getTime()
}

function relativeDayLabel(date: Date, now: Date = new Date()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Ontem'
  if (diffDays > 1 && diffDays < 7) return `Há ${diffDays} dias`
  return DATE_FORMATTER.format(date)
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '—'
  const mins = Math.round(seconds / 60)
  if (mins < 1) return 'menos de 1 min'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rest = mins % 60
  return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`
}

interface Group {
  label: string
  items: RosarySessionWithIntention[]
}

function groupByDay(sessions: RosarySessionWithIntention[]): Group[] {
  const now = new Date()
  const groups: Group[] = []
  let currentKey: number | null = null
  let current: Group | null = null

  for (const session of sessions) {
    const date = new Date(session.completed_at)
    const key = startOfDay(date)
    if (key !== currentKey) {
      currentKey = key
      current = { label: relativeDayLabel(date, now), items: [] }
      groups.push(current)
    }
    current!.items.push(session)
  }
  return groups
}

export interface HistoryListProps {
  sessions: RosarySessionWithIntention[]
}

export function HistoryList({ sessions }: HistoryListProps) {
  if (sessions.length === 0) {
    return (
      <div
        className="rounded-2xl border p-8 text-center"
        style={{
          borderColor: 'rgba(201, 168, 76, 0.22)',
          backgroundColor: 'rgba(20, 18, 14, 0.6)',
        }}
      >
        <p
          className="font-serif text-base md:text-lg"
          style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
        >
          Ainda não há terços registrados
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>
          Complete uma sessão e ela aparecerá aqui.
        </p>
      </div>
    )
  }

  const groups = groupByDay(sessions)

  return (
    <ol className="space-y-6">
      {groups.map((group) => (
        <li key={group.label}>
          <h2
            className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: 'var(--accent)' }}
          >
            {group.label}
          </h2>
          <ul className="space-y-2">
            {group.items.map((session) => {
              const completed = new Date(session.completed_at)
              const mysteryLabel = MYSTERY_LABEL[session.mystery_set] ?? session.mystery_set
              return (
                <li
                  key={session.id}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: 'rgba(201, 168, 76, 0.18)',
                    backgroundColor: 'rgba(20, 18, 14, 0.5)',
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <h3
                        className="font-serif text-sm md:text-base"
                        style={{ color: 'var(--text-1)' }}
                      >
                        Mistérios {mysteryLabel}
                        {session.sala_id && (
                          <span
                            className="ml-2 align-middle rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.15em]"
                            style={{
                              borderColor: 'rgba(201, 168, 76, 0.35)',
                              color: 'var(--accent)',
                            }}
                          >
                            Em grupo
                          </span>
                        )}
                      </h3>
                      {session.intention && (
                        <p
                          className="mt-0.5 text-xs italic"
                          style={{
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          Por: {session.intention.titulo}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className="font-mono text-[11px] uppercase tracking-[0.2em]"
                        style={{ color: 'var(--text-3)' }}
                      >
                        {TIME_FORMATTER.format(completed)}
                      </div>
                      <div className="mt-0.5 text-[11px]" style={{ color: 'var(--text-3)' }}>
                        {formatDuration(session.duration_seconds)}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ol>
  )
}
