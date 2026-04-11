// ─── Verbum Type System ───
// All TypeScript types for the Verbum theology graph

// ─── Context Menu ───

export type ContextMenuAction = 'figura' | 'versiculo' | 'dogma' | 'conceito'

// ─── Entity Types ───

export type EntityType =
  | 'pessoa_divina'
  | 'pessoa_biblica'
  | 'maria'
  | 'sacramento'
  | 'dogma'
  | 'concilio'
  | 'periodo'

export type NodeType =
  | 'canonical'
  | 'figura'
  | 'versiculo'
  | 'dogma'
  | 'conceito'
  | 'encarnado'

export type RelationType =
  | 'tipologia'
  | 'doutrina'
  | 'citacao_direta'
  | 'magistério'
  | 'patristica'
  | 'etimologia'
  | 'profetica'

export type EdgeStatus = 'proposta' | 'aprovada' | 'rejeitada'

export type CanvasMode = 'explore' | 'lectio' | 'temporal'

export type TrinityPosition = 'pai' | 'filho' | 'espirito_santo'

// ─── Database Row Types ───

export interface CanonicalEntity {
  id: string
  canonical_name: string
  display_name: string
  display_name_latin: string | null
  entity_type: EntityType
  layer_default: number
  is_trinitarian: boolean
  trinitarian_position: TrinityPosition | null
  aliases: string[]
  short_description: string | null
  historical_period: string | null
  ccc_references: number[]
  bible_key_verse: string | null
  is_protected: boolean
  visual_tier: number
  created_at: string
}

export interface VerbumFlow {
  id: string
  user_id: string
  name: string
  description: string | null
  is_public: boolean
  node_count: number
  edge_count: number
  clone_count: number
  cloned_from: string | null
  thumbnail_data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface VerbumFlowShare {
  id: string
  flow_id: string
  shared_by: string
  shared_with_email: string
  shared_with_user: string | null
  permission: 'view' | 'edit'
  accepted: boolean
  created_at: string
}

export interface VerbumFlowFavorite {
  id: string
  user_id: string
  flow_id: string
  created_at: string
}

export interface VerbumNode {
  id: string
  user_id: string | null
  flow_id: string | null
  node_type: NodeType
  title: string
  title_latin: string | null
  description: string | null
  canonical_entity_id: string | null
  bible_book: string | null
  bible_chapter: number | null
  bible_verse: number | null
  bible_reference: string | null
  bible_text: string | null
  ccc_paragraph: number | null
  ccc_text: string | null
  layer_id: number
  pos_x: number
  pos_y: number
  historical_year: number | null
  historical_label: string | null
  is_canonical: boolean
  is_shared: boolean
  sources: VerbumSource[]
  created_at: string
  updated_at: string
}

export interface VerbumEdge {
  id: string
  user_id: string | null
  flow_id: string | null
  source_node_id: string
  target_node_id: string
  relation_type: RelationType
  magisterial_weight: number
  ai_explanation: string | null
  ai_explanation_short: string | null
  theological_name: string | null
  sources: VerbumSource[]
  status: EdgeStatus
  is_auto_generated: boolean
  is_shared: boolean
  created_at: string
  updated_at: string
}

export interface VerbumUserCanvas {
  id: string
  user_id: string
  flow_id: string | null
  viewport_x: number
  viewport_y: number
  viewport_zoom: number
  visible_layers: number[]
  active_filter: string
  active_mode: CanvasMode
  temporal_year_filter: number | null
  created_at: string
  updated_at: string
}

export interface TypologyRegistryEntry {
  id: string
  type_name: string
  antitype_name: string
  theological_name: string
  relation_type: string
  magisterial_weight: number
  explanation_pt: string
  explanation_short: string
  sources: VerbumSource[]
  aliases_type: string[]
  aliases_antitype: string[]
  is_verified: boolean
  created_at: string
}

// ─── Source Reference ───

export interface VerbumSource {
  type: 'biblia' | 'CCC' | 'patristica' | 'magistério'
  ref: string
  text?: string
  book?: string
  chapter?: number
  verse?: number
}

// ─── Identity Resolver ───

export type IdentityAction =
  | 'activate_trinitarian'
  | 'activate_canonical'
  | 'create_new'

export interface IdentityResult {
  type: 'canonical' | 'typology_match' | 'new'
  entity?: CanonicalEntity
  suggestions?: {
    verses?: BibleVerse[]
    knowledge?: KnowledgeBaseEntry[]
  }
  action: IdentityAction
}

// ─── Bible ───

export interface BibleVerse {
  book: string
  chapter: number
  verse: number
  reference: string
  text_pt: string
  testament: 'AT' | 'NT'
}

// ─── Knowledge Base ───

export interface KnowledgeBaseEntry {
  category: string
  topic: string
  core_teaching: string
  bible_references: string[]
  keywords: string[]
}

// ─── Connection Engine ───

export interface ConnectionProposal {
  source_node_id: string
  source_node_title: string
  target_node_id: string
  target_node_title: string
  relation_type: RelationType
  confidence: number
  theological_name: string
  explanation_short: string
  explanation_full: string
  magisterial_weight: number
  sources: VerbumSource[]
  source: 'registry' | 'ai'
}

// ─── AI Response Types ───

export interface AIConnectionExplanation {
  theological_name: string
  explanation_short: string
  explanation_full: string
  sources: VerbumSource[]
  magisterial_weight: number
  is_valid_catholic: boolean
  validation_note: string | null
}

export interface AIAutoConnectionResponse {
  proposals: Array<{
    target_node_id: string
    target_node_title: string
    relation_type: RelationType
    confidence: number
    theological_name: string
    explanation_short: string
    explanation_full: string
    magisterial_weight: number
    sources: VerbumSource[]
  }>
}

// ─── React Flow Node/Edge Data ───

export interface TrinitasNodeData {
  canonical_name: string
  display_name: string
  layer_id: number
  is_canonical: true
}

export interface FiguraNodeData {
  title: string
  title_latin?: string
  description?: string
  layer_id: number
  historical_period?: string
  bible_key_verse?: string
  is_canonical: boolean
  canonical_entity_id?: string
  visual_tier?: number
}

export interface VersiculoNodeData {
  title: string
  bible_reference: string
  bible_text: string
  bible_book: string
  testament: 'AT' | 'NT'
  layer_id: number
}

export interface DogmaNodeData {
  title: string
  title_latin?: string
  description?: string
  ccc_paragraph?: number
  ccc_text?: string
  layer_id: number
  is_canonical: boolean
}

export interface EncarnacaoNodeData {
  title: string
  description: string
  layer_id: number
  bible_reference: string
}

// ─── Canvas Layer ───

export interface LayerInfo {
  id: number
  name: string
  description: string
  canDisable: boolean
}

export const LAYERS: LayerInfo[] = [
  { id: 0, name: 'Fundamento', description: 'Santíssima Trindade', canDisable: false },
  { id: 1, name: 'Revelação Primordial', description: 'Antigo Testamento inicial', canDisable: true },
  { id: 2, name: 'Profecia e Tipo', description: 'Figuras tipológicas do AT', canDisable: true },
  { id: 3, name: 'Encarnação e Missão', description: 'Jesus, Maria, Apóstolos', canDisable: true },
  { id: 4, name: 'Igreja e Magistério', description: 'Pedro, Concílios, Papas', canDisable: true },
  { id: 5, name: 'Estudo Pessoal', description: 'Seus nós pessoais', canDisable: true },
]
