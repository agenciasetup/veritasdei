export type IntencaoStatus = 'aberta' | 'graca_recebida' | 'arquivada'

export interface Intencao {
  id: string
  user_id: string
  santo_id: string | null
  texto: string
  status: IntencaoStatus
  reflexao_graca: string | null
  lembrete_semanal: boolean
  encerrada_em: string | null
  created_at: string
  updated_at: string
}

export interface IntencaoComSanto extends Intencao {
  santo?: {
    id: string
    slug: string
    nome: string
    invocacao: string | null
    imagem_url: string | null
  } | null
}

export interface Novena {
  id: string
  user_id: string
  santo_id: string
  iniciada_em: string
  concluida_em: string | null
  dia_atual: number
  progresso: string[]
  disparo_auto: boolean
  created_at: string
  updated_at: string
}

export interface NovenaComSanto extends Novena {
  santo?: {
    id: string
    slug: string
    nome: string
    invocacao: string | null
    imagem_url: string | null
    oracao_curta: string | null
  } | null
}

export interface FestaHojeInfo {
  santo: {
    id: string
    slug: string
    nome: string
    invocacao: string | null
    imagem_url: string | null
    oracao_curta: string | null
    festa_mes: number | null
    festa_dia: number | null
  }
  diasAteFesta: number
  ehHoje: boolean
  festaEm9Dias: boolean
}
