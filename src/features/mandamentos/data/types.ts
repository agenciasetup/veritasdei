export interface BibleVerse {
  reference: string
  text: string
}

export interface Mandamento {
  id: number
  title: string
  shortTitle: string
  explanation: string
  verses: BibleVerse[]
}
