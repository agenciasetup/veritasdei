export type QuestionKind = 'single' | 'multi' | 'truefalse'
export type QuizStatus = 'draft' | 'review' | 'published' | 'archived'

export interface QuestionOption {
  id: string
  label: string
}

export interface QuizEditorQuestion {
  id: string
  quiz_id: string
  kind: QuestionKind
  prompt: string
  options: QuestionOption[]
  correct: string[]
  explanation: string | null
  sort_order: number
}

export interface QuizEditorMeta {
  id: string
  content_type: string
  content_ref: string
  title: string
  description: string | null
  passing_score: number
  xp_bonus: number
  reliquia_slug_on_master: string | null
  status: QuizStatus
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface QuizEditorData {
  quiz: QuizEditorMeta
  questions: QuizEditorQuestion[]
}
