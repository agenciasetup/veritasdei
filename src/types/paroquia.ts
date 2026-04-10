export type ParoquiaStatus = 'pendente' | 'aprovada' | 'rejeitada'

export interface HorarioMissa {
  dia: string      // 'domingo', 'segunda', etc.
  horario: string  // '08:00', '19:00'
}

export interface Paroquia {
  id: string
  nome: string
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
  padre_responsavel: string | null
  telefone: string | null
  email: string | null
  foto_url: string | null
  instagram: string | null
  facebook: string | null
  site: string | null
  informacoes_extras: string | null
  status: ParoquiaStatus
  criado_por: string | null
  aprovado_por: string | null
  created_at: string
  updated_at: string
}

export type ParoquiaInsert = Omit<Paroquia, 'id' | 'status' | 'aprovado_por' | 'created_at' | 'updated_at'>
