'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StudyQuizSummary } from './types'

export function useStudyQuizSummary(contentType: string | null, contentRef: string | null) {
  const [quiz, setQuiz] = useState<StudyQuizSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(contentType && contentRef))

  useEffect(() => {
    if (!contentType || !contentRef) {
      setQuiz(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const supabase = createClient()
    supabase
      .from('study_quizzes')
      .select('id, content_type, content_ref, title, description, passing_score, xp_bonus, reliquia_slug_on_master')
      .eq('content_type', contentType)
      .eq('content_ref', contentRef)
      .eq('status', 'published')
      .maybeSingle()
      .then((res: { data: unknown }) => {
        if (cancelled) return
        setQuiz((res.data as StudyQuizSummary | null) ?? null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [contentType, contentRef])

  return { quiz, loading }
}
