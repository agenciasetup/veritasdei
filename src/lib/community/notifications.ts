import { createAdminClient } from '@/lib/supabase/admin'

export interface CommunityNotificationInput {
  userId: string
  type: string
  title: string
  body: string
  targetUrl?: string | null
  payload?: Record<string, unknown>
  source?: string
  dedupeKey?: string | null
}

/**
 * Fire-and-forget notification helper.
 * Nunca quebra o fluxo principal em caso de erro operacional.
 */
export async function pushCommunityNotification(input: CommunityNotificationInput): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return

  try {
    const admin = createAdminClient()
    await admin.from('user_notificacoes_feed').upsert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      target_url: input.targetUrl ?? null,
      payload: input.payload ?? {},
      source: input.source ?? 'community',
      dedupe_key: input.dedupeKey ?? null,
    }, {
      onConflict: 'user_id,dedupe_key',
    })
  } catch (error) {
    console.warn('[community] push notification failed:', error)
  }
}
