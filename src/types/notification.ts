/**
 * Tipos canônicos usados em notifications do domínio "paróquias".
 * A tabela é `user_notificacoes_feed` (ver src/types/notifications.ts pro
 * shape completo do row) — este módulo só adiciona um union dos types
 * que o domínio de paróquias emite.
 */
export type NotificationType =
  | 'claim_approved'
  | 'claim_rejected'
  | 'claim_received'
  | 'added_as_admin'
  | 'added_as_moderator'
  | 'removed_from_team'
  | 'role_changed'
  | 'paroquia_approved'
  | 'paroquia_rejected'
  | 'paroquia_verified'
  | 'paroquia_orphaned'
