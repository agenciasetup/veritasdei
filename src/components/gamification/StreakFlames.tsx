'use client'

import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 7 chamas horizontais representando os últimos 7 dias (acessa/não-acessa).
 * A de hoje pulsa se estudou, fica apagada se não.
 */
export default function StreakFlames() {
  const { user } = useAuth()
  const [daysSet, setDaysSet] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    if (!supabase) return

    let cancelled = false
    void (async () => {
      const since = new Date()
      since.setDate(since.getDate() - 7)
      const { data } = await supabase
        .from('user_content_progress')
        .select('studied_at')
        .eq('user_id', user.id)
        .gte('studied_at', since.toISOString())

      if (cancelled) return
      const set = new Set<string>()
      for (const row of (data ?? []) as Array<{ studied_at: string }>) {
        set.add(dateKey(new Date(row.studied_at)))
      }
      setDaysSet(set)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const today = new Date()
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d
  })

  if (loading) return null

  const labels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <div className="flex items-end justify-between gap-1">
      {last7.map((d, i) => {
        const active = daysSet.has(dateKey(d))
        const isToday = i === 6
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <Flame
              className="w-5 h-5 transition-opacity"
              style={{
                color: active ? 'var(--gold)' : 'rgba(242,237,228,0.15)',
                filter: active ? 'drop-shadow(0 0 6px rgba(201,168,76,0.5))' : 'none',
              }}
              strokeWidth={1.6}
              fill={active ? 'var(--gold)' : 'none'}
            />
            <span
              className="text-[9px] uppercase tracking-[0.05em]"
              style={{
                color: isToday ? 'var(--gold)' : 'var(--text-muted)',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: isToday ? 600 : 400,
              }}
            >
              {labels[d.getDay()]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
