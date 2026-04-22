export type PedidoOracaoStatus = 'aberto' | 'graca_recebida' | 'arquivado' | 'bloqueado'
export type ModeracaoStatus = 'aprovado_auto' | 'pendente' | 'aprovado_humano' | 'recusado'
export type DenunciaCategoria = 'heterodoxo' | 'supersticao' | 'sensacionalista' | 'ofensivo' | 'spam' | 'outro'
export type ConteudoTipo = 'pedido_oracao' | 'intencao_publica' | 'comentario'

export interface CartaSanto {
  id: string
  user_id: string
  santo_id: string | null
  texto: string
  created_at: string
  updated_at: string
}

export interface CartaSantoComSanto extends CartaSanto {
  santo?: {
    id: string
    slug: string
    nome: string
    invocacao: string | null
    imagem_url: string | null
  } | null
}

export interface PedidoOracao {
  id: string
  user_id: string
  santo_id: string | null
  texto: string
  anonimo: boolean
  status: PedidoOracaoStatus
  moderacao_status: ModeracaoStatus
  created_at: string
  updated_at: string
}

export interface PedidoOracaoPublico {
  id: string
  santo_id: string | null
  texto: string
  anonimo: boolean
  created_at: string
  autor_nome: string | null
  autor_handle: string | null
  autor_avatar: string | null
  total_rezas: number
}

export interface GracaPublica {
  id: string
  santo_id: string | null
  texto: string
  reflexao_graca: string | null
  created_at: string
  graca_em: string | null
  autor_nome: string | null
  autor_handle: string | null
  autor_avatar: string | null
  santo_nome: string | null
  santo_slug: string | null
  santo_imagem_url: string | null
}
