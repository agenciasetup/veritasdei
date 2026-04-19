'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface QuizQuestion {
  id: string
  quiz_id: string
  kind: 'single' | 'multi' | 'truefalse'
  prompt: string
  options: Array<{ id: string; label: string }>
  correct: string[]
  explanation: string | null
  sort_order: number
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_id: string
  score: number
  answers: Record<string, string[]>
  passed: boolean
  completed_at: string
}

export function useQuizQuestions(quizId: string | null) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(quizId))

  useEffect(() => {
    if (!quizId) {
      setQuestions([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const supabase = createClient()
    supabase
      .from('study_quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('sort_order', { ascending: true })
      .then((res: { data: unknown }) => {
        if (cancelled) return
        setQuestions(((res.data as QuizQuestion[] | null) || []) as QuizQuestion[])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [quizId])

  return { questions, loading }
}

export function useQuizAttempts(quizId: string | null) {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(user && quizId))

  const refresh = useCallback(async () => {
    if (!user?.id || !quizId) {
      setAttempts([])
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('user_quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('quiz_id', quizId)
      .order('completed_at', { ascending: false })
      .limit(20)
    setAttempts((data as QuizAttempt[]) || [])
    setLoading(false)
  }, [user?.id, quizId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function submit(score: number, answers: Record<string, string[]>, passingScore: number) {
    if (!user?.id || !quizId) return null
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_quiz_attempts')
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        score,
        answers,
        passed: score >= passingScore,
      })
      .select()
      .single()
    if (error || !data) return null
    await refresh()
    return data as QuizAttempt
  }

  const bestScore = attempts.reduce((max, a) => (a.score > max ? a.score : max), 0)
  const hasPassed = attempts.some((a) => a.passed)
  const hasPerfect = attempts.some((a) => a.score === 100)

  return { attempts, loading, submit, refresh, bestScore, hasPassed, hasPerfect }
}
