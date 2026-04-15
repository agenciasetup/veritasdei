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
  /** ID da sala compartilhada (Marco 3), `null` para sessões solo. */
  sala_id?: string | null
}

// ---------- rosary_rooms (Marco 3 — Terço compartilhado) ----------

export type RosaryRoomState =
  | 'aguardando'
  | 'rezando'
  | 'finalizada'
  | 'encerrada'

export interface RosaryRoom {
  id: string
  codigo: string
  host_user_id: string
  co_host_user_id: string | null
  mystery_set: MysterySet
  silencioso: boolean
  state: RosaryRoomState
  passo_index: number
  titulo: string | null
  created_at: string
  updated_at: string
  started_at: string | null
  ended_at: string | null
}

export interface RosaryRoomCreateInput {
  mystery_set: MysterySet
  silencioso?: boolean
  titulo?: string | null
}

export interface RosaryRoomParticipant {
  id: string
  room_id: string
  user_id: string
  display_name: string | null
  joined_at: string
  left_at: string | null
}

/** Snapshot completo retornado pelos route handlers de sala. */
export interface RosaryRoomSnapshot {
  room: RosaryRoom
  participants: RosaryRoomParticipant[]
  /** True se o viewer atual é host. */
  isHost: boolean
  /** True se o viewer atual é co-host. */
  isCoHost: boolean
}
