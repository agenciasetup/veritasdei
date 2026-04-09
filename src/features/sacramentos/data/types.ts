export interface BibleVerse {
  reference: string
  text: string
}

export interface Sacramento {
  id: number
  name: string
  latinName: string
  explanation: string
  matter: string
  form: string
  minister: string
  effects: string[]
  verses: BibleVerse[]
}
