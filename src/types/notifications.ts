export interface NotificacaoFeedItem {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  target_url: string | null
  payload: Record<string, unknown>
  source: string
  dedupe_key: string | null
  created_at: string
  read_at: string | null
  archived_at: string | null
}

export interface NotificacaoIngestInput {
  type: string
  title: string
  body: string
  target_url?: string | null
  payload?: Record<string, unknown>
  source?: string
  dedupe_key?: string | null
}
