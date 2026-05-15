// ============================================================================
// Códex Veritas — Tipos do sistema de cartas colecionáveis
// ============================================================================

export type CartaRaridade = 'comum' | 'rara' | 'epica' | 'lendaria' | 'suprema'

export type CartaStatus = 'rascunho' | 'revisao' | 'publicado' | 'arquivado'

export type CartaMoldura = 'classica' | 'ornamentada' | 'vitral' | 'minimalista'

// --- Motor de regras ---------------------------------------------------------
// Catálogo fechado de condições que o banco (fn_avaliar_condicao_carta) entende.
export type CartaCondicaoTipo =
  | 'subtopico_concluido'
  | 'grupo_concluido'
  | 'topico_concluido'
  | 'nivel'
  | 'streak'
  | 'quiz_gabaritado'
  | 'nota_contem_frase'
  | 'grupo_estudo_tamanho'
  | 'contador'

export interface CartaCondicao {
  tipo: CartaCondicaoTipo
  /** Referência (uuid de subtópico/tópico, slug de grupo, content_ref de quiz, chave de contador). */
  ref?: string
  /** Limiar numérico (nível, streak, valor do contador). */
  valor?: number
}

export interface CartaRegras {
  operador: 'todas' | 'qualquer'
  condicoes: CartaCondicao[]
}

// --- Entidades ---------------------------------------------------------------
export interface Personagem {
  id: string
  slug: string
  nome: string
  subtitulo: string | null
  descricao: string | null
  icone_url: string | null
  total_cartas: number
  ordem: number
  visivel: boolean
  created_at: string
  updated_at: string
}

export interface Carta {
  id: string
  personagem_id: string
  slug: string
  numero: number | null
  nome: string
  subtitulo: string | null
  categoria: string | null
  raridade: CartaRaridade
  estrelas: number
  frase_central: string | null
  frase_referencia: string | null
  autoridade_doutrinaria: string | null
  efeito_simbolico: string | null
  recompensa: string[]
  concilio: string | null
  virtude: string | null
  simbolo: string | null
  lore: string | null
  ilustracao_url: string | null
  ilustracao_mobile_url: string | null
  moldura: CartaMoldura
  cor_accent: string | null
  /** Multiplicador de fonte p/ diagramação (0.5–2.0, padrão 1.0). */
  escala_fonte: number
  dica_desbloqueio: string | null
  regras: CartaRegras
  status: CartaStatus
  visivel: boolean
  ordem: number
  /** Marca a carta pra aparecer destacada na página de venda do Educa. */
  landing_featured: boolean
  /** Ordem entre as cartas marcadas como `landing_featured`. NULL = fim. */
  landing_featured_order: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface UserCarta {
  user_id: string
  carta_id: string
  desbloqueada_em: string
  vista: boolean
  favorita: boolean
}

/** Carta desbloqueada + estado de coleção do usuário (join cartas × user_cartas). */
export interface CartaColecao extends Carta {
  favorita: boolean
}

// --- Metadados visuais por raridade -----------------------------------------
// `artMode` controla como a ilustração ocupa a carta:
//   janela → arte numa janela superior (`artFracao` da altura), texto em
//            painel sólido abaixo — estilo limpo das cartas comuns/raras
//   cheia  → arte cobre a carta inteira (full-bleed), texto sobre um véu
//            no rodapé — estilo épica/lendária/suprema
export interface RaridadeMeta {
  label: string
  /** Cor de destaque padrão (admin pode sobrescrever via cor_accent). */
  cor: string
  borda: string
  /** Brilho/glow ao redor da carta — '' = sem brilho. */
  glow: string
  artMode: 'janela' | 'cheia'
  /** Fração da altura ocupada pela arte no modo 'janela' (0–1). */
  artFracao: number
  /** Efeito holográfico que segue o cursor. */
  holo: boolean
  /** Intensidade da moldura ornamental (1 = simples, 3 = ricamente ornada). */
  molduraForca: number
}

export const RARIDADE_META: Record<CartaRaridade, RaridadeMeta> = {
  comum: {
    label: 'Comum',
    cor: '#C2B7A6',
    borda: 'rgba(194,183,166,0.5)',
    glow: '',
    artMode: 'janela',
    artFracao: 0.54,
    holo: false,
    molduraForca: 1,
  },
  rara: {
    label: 'Rara',
    cor: '#7FB5D6',
    borda: 'rgba(127,181,214,0.6)',
    glow: '0 0 20px rgba(127,181,214,0.22)',
    artMode: 'janela',
    artFracao: 0.66,
    holo: false,
    molduraForca: 2,
  },
  epica: {
    label: 'Épica',
    cor: '#B98BE6',
    borda: 'rgba(185,139,230,0.75)',
    glow: '0 0 34px rgba(185,139,230,0.4)',
    artMode: 'cheia',
    artFracao: 1,
    holo: false,
    molduraForca: 2,
  },
  lendaria: {
    label: 'Lendária',
    cor: '#E8C766',
    borda: 'rgba(232,199,102,0.9)',
    glow: '0 0 44px rgba(232,199,102,0.5)',
    artMode: 'cheia',
    artFracao: 1,
    holo: true,
    molduraForca: 3,
  },
  suprema: {
    label: 'Supremo',
    cor: '#F4DE96',
    borda: 'rgba(244,222,150,1)',
    glow: '0 0 58px rgba(244,222,150,0.62)',
    artMode: 'cheia',
    artFracao: 1,
    holo: true,
    molduraForca: 3,
  },
}

export const RARIDADE_ORDEM: CartaRaridade[] = [
  'suprema',
  'lendaria',
  'epica',
  'rara',
  'comum',
]

/** Rótulo legível de cada tipo de condição (admin / debug). */
export const CONDICAO_LABEL: Record<CartaCondicaoTipo, string> = {
  subtopico_concluido: 'Concluir um estudo (subtópico)',
  grupo_concluido: 'Concluir um pilar inteiro',
  topico_concluido: 'Concluir um tópico inteiro',
  nivel: 'Atingir um nível',
  streak: 'Atingir uma sequência de dias',
  quiz_gabaritado: 'Gabaritar um quiz (100%)',
  nota_contem_frase: 'Escrever uma frase numa anotação (carta-segredo)',
  grupo_estudo_tamanho: 'Grupo de estudo atingir N membros',
  contador: 'Atingir um contador de evento',
}

export const REGRAS_VAZIA: CartaRegras = { operador: 'todas', condicoes: [] }
