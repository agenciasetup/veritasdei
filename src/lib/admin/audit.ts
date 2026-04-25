import type { SupabaseClient } from '@supabase/supabase-js'

interface LogAdminActionOpts {
  admin: SupabaseClient
  actorId: string | null
  actorEmail?: string | null
  action: string
  target?: string | null
  payload?: Record<string, unknown>
  ip?: string | null
  ua?: string | null
}

export async function logAdminAction(opts: LogAdminActionOpts): Promise<void> {
  const { error } = await opts.admin.from('admin_audit_log').insert({
    actor_id: opts.actorId,
    actor_email: opts.actorEmail ?? null,
    action: opts.action,
    target: opts.target ?? null,
    payload: opts.payload ?? {},
    ip: opts.ip ?? null,
    user_agent: opts.ua ?? null,
  })
  if (error) {
    console.error('[admin-audit] falhou ao gravar', opts.action, error)
  }
}
