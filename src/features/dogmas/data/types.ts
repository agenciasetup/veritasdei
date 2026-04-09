export interface BibleVerse {
  reference: string
  text: string
}

export interface Dogma {
  id: number
  title: string
  explanation: string
  verses: BibleVerse[]
}

export interface DogmaCategory {
  id: string
  number: number
  title: string
  icon: string
  description: string
  dogmas: Dogma[]
}
