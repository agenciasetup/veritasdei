import type { FotoParoquia, HorarioMissa, TipoIgreja } from '@/types/paroquia'

/**
 * Estado completo do formulário de cadastro de paróquia.
 * Compartilhado entre o wizard, os steps e o draftStorage (localStorage).
 */
export interface ParoquiaFormState {
  // Identidade
  nome: string
  cnpjMasked: string
  tipoIgreja: TipoIgreja | ''
  diocese: string
  padreResponsavel: string

  // Endereço
  rua: string
  numero: string
  bairro: string
  complemento: string
  cidade: string
  estado: string
  pais: string
  cep: string
  latitude: number | null
  longitude: number | null

  // Horários
  horariosMissa: HorarioMissa[]
  horariosConfissao: HorarioMissa[]

  // Fotos
  fotos: FotoParoquia[]

  // Contatos
  telefone: string
  email: string
  instagramHandle: string
  facebookHandle: string
  site: string
  informacoesExtras: string

  // Verificação (notas só — file fica fora do draft, não persistivel)
  verificacaoNotas: string
}

export const INITIAL_STATE: ParoquiaFormState = {
  nome: '',
  cnpjMasked: '',
  tipoIgreja: '',
  diocese: '',
  padreResponsavel: '',
  rua: '',
  numero: '',
  bairro: '',
  complemento: '',
  cidade: '',
  estado: '',
  pais: 'Brasil',
  cep: '',
  latitude: null,
  longitude: null,
  horariosMissa: [{ dia: 'Domingo', horario: '08:00' }],
  horariosConfissao: [],
  fotos: [],
  telefone: '',
  email: '',
  instagramHandle: '',
  facebookHandle: '',
  site: '',
  informacoesExtras: '',
  verificacaoNotas: '',
}

export type StepId =
  | 'identidade'
  | 'endereco'
  | 'horarios'
  | 'fotos'
  | 'contatos'
  | 'verificacao'

export interface StepDef {
  id: StepId
  label: string
  short: string
}

export const STEPS: StepDef[] = [
  { id: 'identidade',  label: 'Identidade da igreja', short: 'Identidade' },
  { id: 'endereco',    label: 'Endereço',             short: 'Endereço' },
  { id: 'horarios',    label: 'Horários',             short: 'Horários' },
  { id: 'fotos',       label: 'Fotos',                short: 'Fotos' },
  { id: 'contatos',    label: 'Contatos & Redes',     short: 'Contatos' },
  { id: 'verificacao', label: 'Revisar & Verificar',  short: 'Revisar' },
]

export type Setter<K extends keyof ParoquiaFormState> = (value: ParoquiaFormState[K]) => void
