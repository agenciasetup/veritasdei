/**
 * Tipos do Marco 4 — Novenas.
 *
 * Divididos em:
 *   - Tipos de CONTEÚDO (NovenaDay, NovenaBuiltin, NovenaCatalogEntry):
 *     descrevem a estrutura dos 9 dias de oração, válidos tanto para
 *     novenas builtin (hardcoded em `catalog.ts`) quanto para
 *     personalizadas (criadas pelo usuário em `novenas_custom`).
 *   - Tipos de PERSISTÊNCIA (NovenaCustomRecord, NovenaProgressRecord,
 *     NovenaDailyLogRecord): espelham as linhas no Supabase. Mantidos
 *     em sincronia manualmente com a migration
 *     `20260415223113_novenas_foundation.sql`.
 */

// ---------- Conteúdo ----------

/**
 * Um único dia de uma novena. `titulo` é o sub-tema daquele dia (ex:
 * "Dia 3 — Pela nossa família"), `texto` é o corpo da oração em
 * Markdown leve (quebras de linha, ênfases simples).
 */
export interface NovenaDay {
  titulo: string
  texto: string
}

/**
 * Uma novena do catálogo builtin. Hardcoded em TS, nunca toca o DB.
 * `slug` é o identificador estável usado em `novenas_progress.builtin_slug`
 * e em URLs — jamais mudar após o lançamento.
 */
export interface NovenaBuiltin {
  slug: string
  titulo: string
  /** Curta descrição para o catálogo (1–2 linhas). */
  subtitulo: string
  /** Texto longo para a página de detalhe — história, devoção, quando rezar. */
  descricao: string
  /** Período tradicional sugerido ("16 a 24 de dezembro", "antes de Pentecostes"...). */
  periodoSugerido: string | null
  /** Oração comum de abertura/encerramento — opcional. */
  oracaoInicial?: string
  oracaoFinal?: string
  /** Os 9 dias. Ordem importa (índice = dia-1). */
  dias: NovenaDay[]
}

// ---------- Persistência: novenas_custom ----------

export interface NovenaCustomRecord {
  id: string
  user_id: string
  titulo: string
  descricao: string | null
  dias: NovenaDay[]
  arquivada: boolean
  created_at: string
  updated_at: string
}

export interface NovenaCustomDraft {
  titulo: string
  descricao?: string | null
  dias: NovenaDay[]
}

export interface NovenaCustomPatch {
  titulo?: string
  descricao?: string | null
  dias?: NovenaDay[]
  arquivada?: boolean
}

// ---------- Persistência: novenas_progress ----------

export interface NovenaProgressRecord {
  id: string
  user_id: string
  /** Slug do catálogo builtin. `null` se for uma custom. */
  builtin_slug: string | null
  /** FK para novenas_custom. `null` se for builtin. */
  custom_novena_id: string | null
  intention_id: string | null
  current_day: number
  started_at: string
  last_prayed_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface NovenaProgressStartInput {
  /** Exatamente um dos dois deve estar presente. */
  builtin_slug?: string
  custom_novena_id?: string
  intention_id?: string | null
}

// ---------- Persistência: novenas_daily_log ----------

export interface NovenaDailyLogRecord {
  id: string
  progress_id: string
  user_id: string
  day_number: number
  prayed_at: string
}

// ---------- Tipos enriquecidos (joins) ----------

/**
 * Retorno de "dê-me minhas novenas em curso" — junta o progress com
 * os metadados da novena (título, descrição curta) resolvidos do
 * catálogo builtin OU da tabela custom, para evitar N+1 na UI.
 */
export interface NovenaProgressWithSource {
  progress: NovenaProgressRecord
  source:
    | { kind: 'builtin'; novena: NovenaBuiltin }
    | { kind: 'custom'; novena: NovenaCustomRecord }
  intention: { id: string; titulo: string } | null
}
