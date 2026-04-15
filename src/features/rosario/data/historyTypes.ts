/**
 * Tipos TypeScript espelhando o schema do Marco 2.
 *
 * O projeto não gera tipos Supabase automaticamente — mantemos esses
 * tipos em sincronia manualmente com `supabase/migrations/
 * 20260415184933_rosary_history_and_intentions.sql`.
 */

import type { MysterySet } from './types'

// ---------- rosary_intentions ----------

export interface RosaryIntention {
  id: string
  user_id: string
  titulo: string
  descricao: string | null
  arquivada: boolean
  created_at: string
  updated_at: string
}

export interface RosaryIntentionDraft {
  titulo: string
  descricao?: string | null
}

export interface RosaryIntentionPatch {
  titulo?: string
  descricao?: string | null
  arquivada?: boolean
}

// ---------- rosary_sessions ----------

export interface RosarySessionRecord {
  id: string
  user_id: string
  mystery_set: MysterySet
  intention_id: string | null
  started_at: string | null
  completed_at: string
  duration_seconds: number | null
  created_at: string
}

export interface RosarySessionInsert {
  mystery_set: MysterySet
  intention_id?: string | null
  started_at?: string | null
  duration_seconds?: number | null
}

/** Retorno enriquecido pra listagem de histórico — inclui o título da
 * intenção via JOIN leve no route handler de GET. */
export interface RosarySessionWithIntention extends RosarySessionRecord {
  intention: { id: string; titulo: string } | null
}
