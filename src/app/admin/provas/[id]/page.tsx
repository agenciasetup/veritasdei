import { redirect, notFound } from 'next/navigation'
import { requireSystemAdmin } from '@/lib/auth/require-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import QuizEditor from './QuizEditor'
import type { QuizEditorData, QuizEditorQuestion } from './types'

export const dynamic = 'force-dynamic'

export default async function AdminQuizEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await requireSystemAdmin()
  if (!userId) redirect('/')

  const supabase = await createServerSupabaseClient()
  const { data: quiz } = await supabase
    .from('study_quizzes')
    .select(
      'id, content_type, content_ref, title, description, passing_score, xp_bonus, reliquia_slug_on_master, status, created_at, updated_at, published_at',
    )
    .eq('id', id)
    .maybeSingle()
  if (!quiz) notFound()

  const { data: questions } = await supabase
    .from('study_quiz_questions')
    .select('id, quiz_id, kind, prompt, options, correct, explanation, sort_order')
    .eq('quiz_id', id)
    .order('sort_order')

  const initial: QuizEditorData = {
    quiz: quiz as QuizEditorData['quiz'],
    questions: (questions ?? []) as QuizEditorQuestion[],
  }

  return <QuizEditor initial={initial} />
}
