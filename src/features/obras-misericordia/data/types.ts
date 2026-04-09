export interface BibleVerse {
  reference: string
  text: string
}

export interface Obra {
  id: number
  name: string
  explanation: string
  verses: BibleVerse[]
}

export interface ObraGroup {
  id: string
  title: string
  description: string
  icon: string
  obras: Obra[]
}
