export interface Prayer {
  id: string
  name: string
  text: string
  latinName?: string
  latinText?: string
  repeat?: number
}

export interface Mystery {
  number: number
  title: string
  fruit: string
  scripture: string
  reflection: string
}

export type MysterySet = 'gloriosos' | 'gozosos' | 'dolorosos' | 'luminosos'

export interface MysteryGroup {
  id: MysterySet
  name: string
  days: string
  mysteries: Mystery[]
}

export interface RosarySection {
  id: string
  label: string
  type: 'prayers' | 'decade'
  prayers: { prayer: Prayer; repeat?: number }[]
  mystery?: Mystery
}
