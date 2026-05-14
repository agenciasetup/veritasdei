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
  dica_desbloqueio: string | null
  regras: CartaRegras
  status: CartaStatus
  visivel: boolean
  ordem: number
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

/** Carta + estado de coleção do usuário (join cartas × user_cartas). */
export interface CartaComEstado extends Carta {
  desbloqueada: boolean
  desbloqueada_em: string | null
  vista: boolean
  favorita: boolean
}

// --- Metadados visuais por raridade -----------------------------------------
// `cobertura` controla quanto da carta a ilustração ocupa:
//   half  → metade superior (clean, estilo "comum")
//   full  → cobre até atrás do texto
//   bleed → cobre tudo, sangrando até a borda (estilo "lendária/suprema")
export interface RaridadeMeta {
  label: string
  /** Cor de destaque padrão (admin pode sobrescrever via cor_accent). */
  cor: string
  borda: string
  /** Brilho/glow ao redor da carta — '' = sem brilho. */
  glow: string
  cobertura: 'half' | 'full' | 'bleed'
  /** Efeito holográfico que segue o cursor. */
  holo: boolean
  /** Peso visual da moldura (0–3). */
  ornamento: number
}

export const RARIDADE_META: Record<CartaRaridade, RaridadeMeta> = {
  comum: {
    label: 'Comum',
    cor: '#B8AFA7',
    borda: 'rgba(184,175,167,0.35)',
    glow: '',
    cobertura: 'half',
    holo: false,
    ornamento: 0,
  },
  rara: {
    label: 'Rara',
    cor: '#C9A84C',
    borda: 'rgba(201,168,76,0.45)',
    glow: '',
    cobertura: 'full',
    holo: false,
    ornamento: 1,
  },
  epica: {
    label: 'Épica',
    cor: '#A78BFA',
    borda: 'rgba(167,139,250,0.55)',
    glow: '0 0 28px rgba(167,139,250,0.25)',
    cobertura: 'full',
    holo: false,
    ornamento: 2,
  },
  lendaria: {
    label: 'Lendária',
    cor: '#E8C766',
    borda: 'rgba(232,199,102,0.7)',
    glow: '0 0 38px rgba(232,199,102,0.35)',
    cobertura: 'bleed',
    holo: true,
    ornamento: 3,
  },
  suprema: {
    label: 'Supremo',
    cor: '#F2D98A',
    borda: 'rgba(242,217,138,0.85)',
    glow: '0 0 48px rgba(242,217,138,0.5)',
    cobertura: 'bleed',
    holo: true,
    ornamento: 3,
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
  contador: 'Atingir um contador de evento',
}

export const REGRAS_VAZIA: CartaRegras = { operador: 'todas', condicoes: [] }
