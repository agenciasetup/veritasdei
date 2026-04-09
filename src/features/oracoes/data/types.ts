export interface Oracao {
  id: string
  name: string
  latinName?: string
  category: 'principal' | 'credo' | 'ato' | 'devocional'
  text: string
  origin?: string
  explanation: string
}
