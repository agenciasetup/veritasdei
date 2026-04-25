import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { renderDeletionWarning } from '@/lib/email/templates/lgpd-deletion-warning'
import { sendAdminAlert } from '@/lib/notifications/admin-alert'

/**
 * POST /api/cron/lgpd-cleanup — vercel.json: "0 6 * * *" (06h UTC = 03h BRT)
 *
 * 1. Executa soft_delete_user para contas com pending_deletion vencido.
 * 2. Avisa por e-mail quem está a 5 dias da exclusão (idempotente por dia
 *    via dedupe_key em user_notificacoes_feed).
 * 3. Sempre grava 1 linha em lgpd_cleanup_log.
 * 4. Em qualquer falha, dispara webhook Discord pro operador.
 */

const HARD_LIMIT = 100

interface PendingRow {
  id: string
  deletion_scheduled_for: string
  display_name: string | null
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  const admin = createAdminClient()

  let processed = 0
  let warned = 0
  const failures: Array<{ userId: string; phase: 'execute' | 'warn'; message: string }> = []

  try {
    const { data: toDelete, error: dueErr } = await admin
      .from('profiles')
      .select('id, deletion_scheduled_for, display_name')
      .eq('account_status', 'pending_deletion')
      .lte('deletion_scheduled_for', new Date().toISOString())
      .order('deletion_scheduled_for', { ascending: true })
      .limit(HARD_LIMIT)
    if (dueErr) throw new Error(`fetch_due_failed: ${dueErr.message}`)

    for (const row of (toDelete ?? []) as PendingRow[]) {
      const { error: rpcErr } = await admin.rpc('soft_delete_user', { p_user_id: row.id })
      if (rpcErr) {
        failures.push({ userId: row.id, phase: 'execute', message: rpcErr.message })
        continue
      }
      processed += 1
    }

    const fiveD = new Date(Date.now() + 5 * 86400_000).toISOString()
    const sixD = new Date(Date.now() + 6 * 86400_000).toISOString()
    const { data: warnRows, error: warnErr } = await admin
      .from('profiles')
      .select('id, deletion_scheduled_for, display_name')
      .eq('account_status', 'pending_deletion')
      .gte('deletion_scheduled_for', fiveD)
      .lt('deletion_scheduled_for', sixD)
      .limit(HARD_LIMIT)
    if (warnErr) throw new Error(`fetch_warn_failed: ${warnErr.message}`)

    const todayKey = new Date().toISOString().slice(0, 10)
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://veritasdei.com.br').replace(/\/$/, '')

    for (const row of (warnRows ?? []) as PendingRow[]) {
      const dedupeKey = `lgpd_warn_d5_${row.id}_${todayKey}`
      const { data: feedInsert, error: feedErr } = await admin
        .from('user_notificacoes_feed')
        .insert({
          user_id: row.id,
          type: 'lgpd_deletion_warning',
          title: 'Sua conta será excluída em 5 dias',
          body: 'Faltam 5 dias para a exclusão definitiva. Toque para cancelar.',
          target_url: '/perfil/seguranca?action=cancel-deletion',
          payload: { scheduled_for: row.deletion_scheduled_for },
          source: 'lgpd_cron',
          dedupe_key: dedupeKey,
        })
        .select('id')
        .maybeSingle()

      if (feedErr) {
        if ((feedErr as { code?: string }).code === '23505') continue
        failures.push({ userId: row.id, phase: 'warn', message: `feed_insert: ${feedErr.message}` })
        continue
      }
      if (!feedInsert) continue

      try {
        const { data: authUser } = await admin.auth.admin.getUserById(row.id)
        const email = authUser?.user?.email
        if (!email) continue

        const tpl = renderDeletionWarning({
          displayName: row.display_name,
          scheduledFor: new Date(row.deletion_scheduled_for),
          cancelUrl: `${appUrl}/perfil/seguranca?action=cancel-deletion`,
        })
        await sendEmail({ to: email, ...tpl, tags: [{ name: 'kind', value: 'lgpd_warn_d5' }] })
        warned += 1
      } catch (err) {
        failures.push({
          userId: row.id,
          phase: 'warn',
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await admin.from('lgpd_cleanup_log').insert({
      duration_ms: Date.now() - startedAt,
      processed_count: processed,
      warned_count: warned,
      failed_count: failures.length + 1,
      error_message: message,
      payload: { failures },
    })
    await sendAdminAlert({
      severity: 'critical',
      title: 'LGPD cleanup falhou',
      description: message,
      payload: { processed, warned, failures: failures.slice(0, 10) },
    })
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }

  await admin.from('lgpd_cleanup_log').insert({
    duration_ms: Date.now() - startedAt,
    processed_count: processed,
    warned_count: warned,
    failed_count: failures.length,
    payload: { failures },
  })

  if (failures.length > 0) {
    await sendAdminAlert({
      severity: 'warning',
      title: 'LGPD cleanup parcial — algumas exclusões/avisos falharam',
      fields: [
        { name: 'processed', value: String(processed), inline: true },
        { name: 'warned', value: String(warned), inline: true },
        { name: 'failed', value: String(failures.length), inline: true },
      ],
      payload: { failures: failures.slice(0, 10) },
    })
  }

  return NextResponse.json({
    ok: true,
    processed,
    warned,
    failed: failures.length,
    duration_ms: Date.now() - startedAt,
  })
}
