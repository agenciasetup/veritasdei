export interface BibleVerse {
  reference: string
  text: string
}

export interface Preceito {
  id: number
  title: string
  explanation: string
  catechismRef: string
  verses: BibleVerse[]
}
