import { createAdminClient } from '@/lib/supabase/admin'

export interface AuditEntry {
  actorId: string
  actorEmail: string | null
  action: string
  target?: string | null
  payload?: Record<string, unknown>
  ip?: string | null
  userAgent?: string | null
}

/**
 * Grava uma entrada de auditoria. Chamada via service_role — bypassa
 * RLS. Nunca throws: falha em auditoria não deve abortar o fluxo que
 * está logando (melhor ter a ação acontecendo que não acontecer por
 * causa do log). Erros vão pra console.warn.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('admin_audit_log').insert({
      actor_id: entry.actorId,
      actor_email: entry.actorEmail,
      action: entry.action,
      target: entry.target ?? null,
      payload: entry.payload ?? {},
      ip: entry.ip ?? null,
      user_agent: entry.userAgent ?? null,
    })
    if (error) {
      console.warn('[audit] failed to log:', error.message, 'entry=', entry)
    }
  } catch (err) {
    console.warn('[audit] exception:', err)
  }
}

/**
 * Extrai IP + user-agent do NextRequest. A heurística pega o primeiro IP
 * em X-Forwarded-For (Vercel proxy), com fallback para `x-real-ip`.
 */
export function getRequestMeta(req: Request): { ip: string | null; userAgent: string | null } {
  const xff = req.headers.get('x-forwarded-for')
  const ip = xff?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? null
  const ua = req.headers.get('user-agent')
  return {
    ip: ip || null,
    userAgent: ua?.slice(0, 512) ?? null, // cap pra não inchar o row
  }
}
