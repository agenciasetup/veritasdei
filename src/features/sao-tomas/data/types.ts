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
  themes: SumaTheme[]
}

export interface SumaTheme {
  title: string
  description: string
  questions: SumaQuestion[]
}
