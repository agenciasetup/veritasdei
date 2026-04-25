import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { scanImage, isNsfwProviderConfigured } from '@/lib/moderation/image-nsfw'
import { logAdminAction } from '@/lib/admin/audit'
import { clientIpFromHeaders } from '@/lib/auth/log-login-event'

/**
 * GET /api/admin/moderation/backfill?limit=20
 * Re-scaneia até `limit` assets com moderation_scanned_at IS NULL.
 * Idempotente: rodar de novo avança a fila.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin(['admin'])
  if (!guard.ok) return guard.response

  if (!isNsfwProviderConfigured()) {
    return NextResponse.json({ error: 'provider_not_configured' }, { status: 503 })
  }

  const url = new URL(req.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 20), 1), 50)
  const publicBase = process.env.CF_R2_PUBLIC_BASE_URL
  if (!publicBase) {
    return NextResponse.json({ error: 'r2_public_base_missing' }, { status: 500 })
  }

  const admin = createAdminClient()
  const { data: assets, error } = await admin
    .from('vd_media_assets')
    .select('id, object_key')
    .is('moderation_scanned_at', null)
    .eq('media_kind', 'image')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })

  let processed = 0
  let flagged = 0
  const errors: Array<{ assetId: string; message: string }> = []

  for (const a of assets ?? []) {
    try {
      const publicUrl = `${publicBase.replace(/\/$/, '')}/${a.object_key}`
      const result = await scanImage(publicUrl, { timeoutMs: 6000 })

      if (!result.available) {
        errors.push({ assetId: a.id, message: result.reason })
      } else {
        const labels = result.labels.map((l) => l.label).slice(0, 12)
        await admin
          .from('vd_media_assets')
          .update({
            nsfw_flagged: !result.safe,
            nsfw_score: result.score,
            nsfw_labels: labels,
            moderation_provider: result.provider,
            moderation_scanned_at: new Date().toISOString(),
          })
          .eq('id', a.id)
        await admin.from('vd_media_moderation_log').insert({
          asset_id: a.id,
          provider: result.provider,
          score: result.score,
          labels,
          raw_response: result.raw ?? null,
        })
        if (!result.safe) flagged += 1
      }
      processed += 1
    } catch (err) {
      errors.push({ assetId: a.id, message: err instanceof Error ? err.message : String(err) })
    }
    await new Promise((r) => setTimeout(r, 1000))
  }

  await logAdminAction({
    admin,
    actorId: guard.ctx.user.id,
    actorEmail: guard.ctx.email,
    action: 'moderation.backfill',
    payload: { requested: limit, processed, flagged, errorCount: errors.length },
    ip: clientIpFromHeaders(req.headers),
    ua: req.headers.get('user-agent'),
  })

  return NextResponse.json({ processed, flagged, errors })
}
