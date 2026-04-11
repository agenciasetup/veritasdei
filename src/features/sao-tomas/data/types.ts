export interface SumaArticle {
  id: string
  question: number
  article: number
  title: string
  objections: string[]
  sedContra: string
  respondeo: string
  replies: string[]
}

export interface SumaQuestion {
  number: number
  title: string
  articles: SumaArticle[]
}

export interface SumaPart {
  id: string
  abbreviation: string
  name: string
  description: string
  synthesis?: string
  themes: SumaTheme[]
}

export interface SumaTheme {
  title: string
  description: string
  synthesis?: string
  questions: SumaQuestion[]
}

/** Flat article used for search index */
export interface FlatArticle {
  article: SumaArticle
  partAbbr: string
  partName: string
  themeName: string
  questionTitle: string
  /** Full breadcrumb path */
  path: string
}
