import type { ContentItem } from '@/lib/content/useContentGroup'

export interface StudyPillarContext {
  slug: string
  title: string
  total: number
  studiedCount: number
}

export interface StudyDeepdiveSection {
  slug: string
  title: string
  body: string
  order?: number
}

export interface StudyDeepdiveSource {
  kind: 'scripture' | 'catechism' | 'council' | 'papal' | 'father' | 'other'
  label: string
  url?: string | null
  page?: string | null
}

export interface StudyDeepdive {
  id: string
  content_type: string
  content_ref: string
  sections: StudyDeepdiveSection[]
  sources: StudyDeepdiveSource[]
  status: 'draft' | 'review' | 'published' | 'archived'
  published_at: string | null
}

export interface StudyQuizSummary {
  id: string
  content_type: string
  content_ref: string
  title: string
  description: string | null
  passing_score: number
  xp_bonus: number
  reliquia_slug_on_master: string | null
}

export interface StudyNextHint {
  label: string
  href: string
  isPillarComplete?: boolean
}

export type { ContentItem }
