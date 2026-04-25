import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { scanImage, isNsfwProviderConfigured } from '@/lib/moderation/image-nsfw'
import { logAdminAction } from '@/lib/admin/audit'
import { clientIpFromHeaders } from '@/lib/auth/log-login-event'

/**
 * POST /api/admin/moderation/calibrate { assetId }
 * Re-roda o scan com o threshold atual para calibração quando CF_NSFW_THRESHOLD muda.
 * Retorna o resultado novo + delta vs. anterior (se já havia linha em log).
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(['admin'])
  if (!guard.ok) return guard.response

  if (!isNsfwProviderConfigured()) {
    return NextResponse.json({ error: 'provider_not_configured' }, { status: 503 })
  }

  const body = (await req.json().catch(() => null)) as { assetId?: string } | null
  if (!body?.assetId) return NextResponse.json({ error: 'asset_id_required' }, { status: 400 })

  const publicBase = process.env.CF_R2_PUBLIC_BASE_URL
  if (!publicBase) {
    return NextResponse.json({ error: 'r2_public_base_missing' }, { status: 500 })
  }

  const admin = createAdminClient()
  const { data: asset, error } = await admin
    .from('vd_media_assets')
    .select('id, object_key, nsfw_flagged, nsfw_score, nsfw_labels')
    .eq('id', body.assetId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 })
  if (!asset) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const previous = {
    flagged: asset.nsfw_flagged,
    score: asset.nsfw_score,
    labels: asset.nsfw_labels,
  }

  const publicUrl = `${publicBase.replace(/\/$/, '')}/${asset.object_key}`
  const result = await scanImage(publicUrl, { timeoutMs: 6000 })

  if (!result.available) {
    return NextResponse.json({ error: 'scan_failed', detail: result.reason }, { status: 502 })
  }

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
    .eq('id', asset.id)

  await admin.from('vd_media_moderation_log').insert({
    asset_id: asset.id,
    provider: result.provider,
    score: result.score,
    labels,
    raw_response: result.raw ?? null,
  })

  await logAdminAction({
    admin,
    actorId: guard.ctx.user.id,
    actorEmail: guard.ctx.email,
    action: 'moderation.calibrate',
    target: asset.id,
    payload: { previous, next: { flagged: !result.safe, score: result.score, labels } },
    ip: clientIpFromHeaders(req.headers),
    ua: req.headers.get('user-agent'),
  })

  return NextResponse.json({
    ok: true,
    previous,
    next: { flagged: !result.safe, score: result.score, labels },
  })
}
