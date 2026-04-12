export type ParoquiaStatus = 'pendente' | 'aprovada' | 'rejeitada'

export type TipoIgreja =
  | 'capela'
  | 'igreja'
  | 'matriz'
  | 'catedral'
  | 'basilica'
  | 'santuario'

export const TIPOS_IGREJA: { value: TipoIgreja; label: string }[] = [
  { value: 'capela',    label: 'Capela' },
  { value: 'igreja',    label: 'Igreja' },
  { value: 'matriz',    label: 'Matriz' },
  { value: 'catedral',  label: 'Catedral' },
  { value: 'basilica',  label: 'Basílica' },
  { value: 'santuario', label: 'Santuário' },
]

export interface HorarioMissa {
  dia: string      // 'Domingo', 'Segunda', etc.
  horario: string  // '08:00', '19:00'
}

export interface FotoParoquia {
  url: string
  label: string
}

export const LABELS_FOTO_SUGERIDOS = [
  'Frontal',
  'Interno',
  'Lateral',
  'Missa',
  'Escritório',
] as const

export const MAX_FOTOS = 5

export interface Paroquia {
  id: string
  nome: string
  cnpj: string | null
  tipo_igreja: TipoIgreja | null
  diocese: string | null
  endereco: string | null
  rua: string | null
  numero: string | null
  bairro: string | null
  complemento: string | null
  cidade: string
  estado: string
  pais: string | null
  cep: string | null
  latitude: number | null
  longitude: number | null
  horarios_missa: HorarioMissa[]
  horarios_confissao: HorarioMissa[]
  padre_responsavel: string | null
  telefone: string | null
  email: string | null
  foto_url: string | null
  fotos: FotoParoquia[]
  instagram: string | null
  facebook: string | null
  site: string | null
  informacoes_extras: string | null
  status: ParoquiaStatus
  verificado: boolean
  verificacao_solicitada_em: string | null
  verificacao_documento_path: string | null
  verificacao_notas: string | null
  verificado_por: string | null
  verificado_em: string | null
  owner_user_id: string | null
  criado_por: string | null
  aprovado_por: string | null
  created_at: string
  updated_at: string
}

export type ParoquiaInsert = Omit<
  Paroquia,
  | 'id'
  | 'status'
  | 'verificado'
  | 'verificacao_solicitada_em'
  | 'verificacao_documento_path'
  | 'verificacao_notas'
  | 'verificado_por'
  | 'verificado_em'
  | 'aprovado_por'
  | 'created_at'
  | 'updated_at'
>

export interface ParoquiaPost {
  id: string
  paroquia_id: string
  author_user_id: string
  titulo: string
  conteudo: string
  imagem_url: string | null
  published_at: string
  created_at: string
  updated_at: string
}
