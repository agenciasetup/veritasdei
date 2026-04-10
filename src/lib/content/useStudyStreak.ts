'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  studiedToday: boolean
  totalDaysStudied: number
}

/**
 * Computes the user's study streak from user_content_progress.studied_at dates.
 * A streak counts consecutive calendar days (in the user's local timezone)
 * where at least one item was studied.
 */
export function useStudyStreak(userId: string | undefined): StreakData & { loading: boolean } {
  const [data, setData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    studiedToday: false,
    totalDaysStudied: 0,
  })
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
        const { data: rows } = await supabase
          .from('user_content_progress')
          .select('studied_at')
          .eq('user_id', userId)
          .order('studied_at', { ascending: false })

        if (!rows || rows.length === 0) {
          setLoading(false)
          return
        }

        // Extract unique study dates (local timezone, YYYY-MM-DD)
        const uniqueDays = new Set<string>()
        rows.forEach((r: { studied_at: string }) => {
          const d = new Date(r.studied_at)
          uniqueDays.add(toLocalDateStr(d))
        })

        const sortedDays = Array.from(uniqueDays).sort().reverse() // most recent first
        const today = toLocalDateStr(new Date())
        const studiedToday = sortedDays[0] === today

        // Compute current streak
        let currentStreak = 0
        // Start from today or yesterday
        let checkDate = studiedToday ? today : yesterday(today)

        for (const day of sortedDays) {
          if (day === checkDate) {
            currentStreak++
            checkDate = yesterday(checkDate)
          } else if (day < checkDate) {
            // Gap found — streak broken
            break
          }
          // day > checkDate means duplicate or future, skip
        }

        // If user hasn't studied today and first date isn't yesterday, streak is 0
        if (!studiedToday && sortedDays[0] !== yesterday(today)) {
          currentStreak = 0
        }

        // Compute longest streak
        let longestStreak = 0
        let tempStreak = 1
        for (let i = 1; i < sortedDays.length; i++) {
          if (sortedDays[i] === yesterday(sortedDays[i - 1])) {
            tempStreak++
          } else {
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak)

        setData({
          currentStreak,
          longestStreak,
          studiedToday,
          totalDaysStudied: uniqueDays.size,
        })
      } catch {
        // Silently degrade
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  return { ...data, loading }
}

/** Format Date to YYYY-MM-DD in local timezone */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Return the previous calendar day as YYYY-MM-DD string */
function yesterday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00') // noon to avoid DST issues
  d.setDate(d.getDate() - 1)
  return toLocalDateStr(d)
}
