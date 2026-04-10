export interface CatechismQuestion {
  question: string
  answer: string
}

export interface CatechismSection {
  title: string
  description?: string
  questions?: CatechismQuestion[]
  subsections?: CatechismSection[]
}

export interface Catechism {
  title: string
  introduction: string
  sections: CatechismSection[]
}
