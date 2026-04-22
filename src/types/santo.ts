export type TipoCulto = 'santo' | 'beato' | 'mariano' | 'arcanjo' | 'titulo'

export interface SantoResumo {
  id: string
  slug: string
  nome: string
  invocacao: string | null
  patronatos: string[]
  imagem_url: string | null
  popularidade_rank: number | null
  festa_texto: string | null
  tipo_culto: TipoCulto
}

export interface SantoDetalhe extends SantoResumo {
  nomes_alternativos: string[]
  oracao_curta: string | null
  biografia_curta: string | null
  descricao: string | null
  martir: boolean
  familia_religiosa: string | null
  nascimento_local: string | null
  nascimento_pais: string | null
  nascimento_data: string | null
  morte_local: string | null
  morte_pais: string | null
  morte_data: string | null
  canonizacao_data: string | null
  canonizado_por: string | null
  beatificacao_data: string | null
  beatificado_por: string | null
  oracao_principal_item_id: string | null
}

export interface SantoOracao {
  content_item_id: string
  tipo: 'devocao_principal' | 'litania' | 'novena' | 'oracao_secundaria'
  slug: string
  title: string
  body: string
  sort_order: number
}

export function santoCoverTitle(santo: Pick<SantoResumo, 'nome' | 'tipo_culto'>): string {
  return santo.nome
}

export function santoInvocacaoFallback(santo: Pick<SantoResumo, 'nome' | 'invocacao' | 'tipo_culto'>): string {
  if (santo.invocacao) return santo.invocacao
  return `${santo.nome}, rogai por nós`
}
