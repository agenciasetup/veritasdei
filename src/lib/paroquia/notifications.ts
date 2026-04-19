import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationType } from '@/types/notification'

/**
 * Thin wrappers em cima da tabela `user_notificacoes_feed`
 * (criada em 20260415120000) — usa o sistema de notificações in-app
 * já existente do projeto.
 *
 * Mapeamento:
 *   - link  → target_url
 *   - meta  → payload
 *   - source = 'paroquias' pra poder filtrar na UI
 *
 * Usa service role (createAdminClient) porque as RLS policies de
 * user_notificacoes_feed só permitem INSERT quando auth.uid()=user_id,
 * e a gente cria notifications em nome de outros usuários.
 */

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  body?: string | null
  link?: string | null
  meta?: Record<string, unknown>
  dedupeKey?: string | null
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('user_notificacoes_feed').insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? input.title, // body é NOT NULL — fallback pro título
    target_url: input.link ?? null,
    payload: input.meta ?? {},
    source: 'paroquias',
    dedupe_key: input.dedupeKey ?? null,
  })
  if (error) {
    console.warn('[notifications] create error:', error.message)
  }
}

export async function notifySystemAdmins(
  input: Omit<CreateNotificationInput, 'userId'>,
): Promise<void> {
  const admin = createAdminClient()
  const { data: admins } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .returns<{ id: string }[]>()
  if (!admins || admins.length === 0) return
  const rows = admins.map(a => ({
    user_id: a.id,
    type: input.type,
    title: input.title,
    body: input.body ?? input.title,
    target_url: input.link ?? null,
    payload: input.meta ?? {},
    source: 'paroquias',
    dedupe_key: input.dedupeKey ?? null,
  }))
  const { error } = await admin.from('user_notificacoes_feed').insert(rows)
  if (error) {
    console.warn('[notifications] notifyAdmins error:', error.message)
  }
}
