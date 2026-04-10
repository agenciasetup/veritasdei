'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook to manage content study progress.
 * Tracks which subtopics a user has marked as "studied".
 *
 * Uses the `user_content_progress` table:
 *   user_id TEXT
 *   content_type TEXT (e.g. 'dogmas', 'sacramentos')
 *   subtopic_id TEXT
 *   studied_at TIMESTAMPTZ
 *
 * Falls back gracefully if the table doesn't exist yet.
 */
export function useContentProgress(userId: string | undefined, contentType: string) {
  const [studiedIds, setStudiedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Load progress
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
        const { data } = await supabase
          .from('user_content_progress')
          .select('subtopic_id')
          .eq('user_id', userId)
          .eq('content_type', contentType)

        if (data) {
          setStudiedIds(new Set(data.map((r: { subtopic_id: string }) => r.subtopic_id)))
        }
      } catch {
        // Table might not exist yet — silently degrade
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId, contentType])

  // Mark a subtopic as studied
  const markStudied = useCallback(async (subtopicId: string) => {
    if (!userId) return

    // Optimistic update
    setStudiedIds(prev => new Set([...prev, subtopicId]))

    const supabase = createClient()
    if (!supabase) return

    try {
      await supabase
        .from('user_content_progress')
        .upsert({
          user_id: userId,
          content_type: contentType,
          subtopic_id: subtopicId,
          studied_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,content_type,subtopic_id',
        })
    } catch {
      // Revert on failure
      setStudiedIds(prev => {
        const next = new Set(prev)
        next.delete(subtopicId)
        return next
      })
    }
  }, [userId, contentType])

  return {
    studiedIds,
    loading,
    markStudied,
    isStudied: (subtopicId: string) => studiedIds.has(subtopicId),
    studiedCount: studiedIds.size,
  }
}
