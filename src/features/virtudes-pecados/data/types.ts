export interface BibleVerse {
  reference: string
  text: string
}

export interface Item {
  id: number
  name: string
  explanation: string
  opposite?: string
  verses: BibleVerse[]
}

export interface ItemGroup {
  id: string
  title: string
  description: string
  icon: string
  items: Item[]
}
