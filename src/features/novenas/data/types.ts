/**
 * Tipos TypeScript para o Marco 4 — Novenas.
 *
 * Espelha o schema de `supabase/migrations/20260415223113_novenas_foundation.sql`.
 * Tipos manuais, sem codegen Supabase.
 */

// ---------- Novena Builtin (hardcoded) ----------

export interface NovenaDay {
  titulo: string
  texto: string
}

export interface NovenaBuiltin {
  slug: string
  titulo: string
  subtitulo: string
  descricao: string
  periodoSugerido: string
  oracaoInicial?: string
  oracaoFinal?: string
  dias: [NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay]
}

// ---------- novenas_custom ----------

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
  dias: [NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay]
}

export interface NovenaCustomPatch {
  titulo?: string
  descricao?: string | null
  dias?: [NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay, NovenaDay]
  arquivada?: boolean
}

// ---------- novenas_progress ----------

export interface NovenaProgressRecord {
  id: string
  user_id: string
  builtin_slug: string | null
  custom_novena_id: string | null
  intention_id: string | null
  current_day: number
  com_terco: boolean
  started_at: string
  last_prayed_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface NovenaProgressStartInput {
  builtin_slug?: string
  custom_novena_id?: string
  intention_id?: string | null
  com_terco?: boolean
}

/** Progresso enriquecido com dados da fonte (builtin ou custom). */
export interface NovenaProgressWithSource extends NovenaProgressRecord {
  source: {
    tipo: 'builtin' | 'custom'
    titulo: string
    subtitulo?: string
  }
}

// ---------- novenas_daily_log ----------

export interface NovenaDailyLogRecord {
  id: string
  progress_id: string
  user_id: string
  day_number: number
  prayed_at: string
}
