export interface Sin {
  id: number
  commandmentId: number
  text: string
  textPast: string
  detail?: string
  adult: boolean
  teen: boolean
  married: boolean
  mortal: boolean
}

export interface Commandment {
  id: number
  title: string
  scripture: string
  description: string
}

export type LifeState = 'adulto' | 'jovem' | 'casado'
export type ExamStep = 'examinar' | 'revisar' | 'confessar'
