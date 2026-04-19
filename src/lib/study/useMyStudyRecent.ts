'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface RecentNote {
  id: string
  content_type: string
  content_ref: string
  body: string
  updated_at: string
}

export interface RecentQuizAttempt {
  id: string
  quiz_id: string
  score: number
  passed: boolean
  completed_at: string
  quiz_title: string
}

export interface PillarProgress {
  slug: string
  title: string
  total: number
  studied: number
}

export function useMyStudyRecent() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<RecentNote[]>([])
  const [attempts, setAttempts] = useState<RecentQuizAttempt[]>([])
  const [pillars, setPillars] = useState<PillarProgress[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(user?.id))

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    let cancelled = false
    const supabase = createClient()
    setLoading(true)

    async function load() {
      const [notesRes, quizRes, progressRes, groupsRes] = await Promise.all([
        supabase
          .from('user_study_notes')
          .select('id, content_type, content_ref, body, updated_at')
          .eq('user_id', user!.id)
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_quiz_attempts')
          .select('id, quiz_id, score, passed, completed_at, study_quizzes(title)')
          .eq('user_id', user!.id)
          .order('completed_at', { ascending: false })
          .limit(5),
        supabase
          .from('user_content_progress')
          .select('content_type, subtopic_id')
          .eq('user_id', user!.id),
        supabase
          .from('content_groups')
          .select('id, slug, title, content_topics(id, content_subtopics(id))')
          .eq('visible', true)
          .order('sort_order'),
      ])

      if (cancelled) return

      setNotes((notesRes.data as RecentNote[]) || [])

      const attemptsRaw = (quizRes.data || []) as Array<{
        id: string
        quiz_id: string
        score: number
        passed: boolean
        completed_at: string
        study_quizzes: { title: string } | { title: string }[] | null
      }>
      setAttempts(
        attemptsRaw.map((a) => {
          const quizObj = Array.isArray(a.study_quizzes)
            ? a.study_quizzes[0]
            : a.study_quizzes
          return {
            id: a.id,
            quiz_id: a.quiz_id,
            score: a.score,
            passed: a.passed,
            completed_at: a.completed_at,
            quiz_title: quizObj?.title || 'Prova',
          }
        }),
      )

      const studiedByType = new Map<string, Set<string>>()
      for (const row of (progressRes.data || []) as Array<{
        content_type: string
        subtopic_id: string
      }>) {
        if (!studiedByType.has(row.content_type))
          studiedByType.set(row.content_type, new Set())
        studiedByType.get(row.content_type)!.add(row.subtopic_id)
      }

      const groupsRaw = (groupsRes.data || []) as Array<{
        slug: string
        title: string
        content_topics: Array<{ content_subtopics: Array<{ id: string }> }>
      }>
      setPillars(
        groupsRaw.map((g) => {
          const total = g.content_topics.reduce(
            (sum, t) => sum + (t.content_subtopics?.length || 0),
            0,
          )
          const studiedSet = studiedByType.get(g.slug) || new Set<string>()
          return { slug: g.slug, title: g.title, total, studied: studiedSet.size }
        }),
      )

      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  return { notes, attempts, pillars, loading }
}
