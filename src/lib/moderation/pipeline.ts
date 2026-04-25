import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { scanForBlockedDomains, type BlocklistHit } from './blocklist'
import { scanText, isHardReject, type TextFilterHit } from './text-filter'
import { isNsfwProviderConfigured, scanImage, type NsfwScanResult } from './image-nsfw'
import { sendAdminAlert } from '@/lib/notifications/admin-alert'
import { rateLimit } from '@/lib/rate-limit'

export type TextModerationResult =
  | { ok: true }
  | { ok: false; reason: 'text_filter'; hit: TextFilterHit }
  | { ok: false; reason: 'blocked_domain'; hit: BlocklistHit }

export async function moderateText(
  supabase: SupabaseClient,
  text: string,
): Promise<TextModerationResult> {
  const trimmed = (text ?? '').trim()
  if (!trimmed) return { ok: true }

  const textHit = scanText(trimmed)
  if (textHit && isHardReject(textHit)) {
    return { ok: false, reason: 'text_filter', hit: textHit }
  }

  const { data } = await supabase
    .from('moderation_blocklist')
    .select('domain')
    .eq('active', true)
  const extraDomains = (data ?? []).map((row: { domain: string }) => row.domain)

  const blockHit = scanForBlockedDomains(trimmed, extraDomains)
  if (blockHit) {
    return { ok: false, reason: 'blocked_domain', hit: blockHit }
  }

  return { ok: true }
}

export async function recordRejection(
  _supabase: SupabaseClient,
  params: {
    userId: string
    reason: string
    sample: string | null
    ip: string | null
    userAgent: string | null
  },
) {
  // moderation_rejections tem RLS habilitada sem policy de INSERT — só
  // service_role grava. Por isso usamos admin client aqui.
  const admin = createAdminClient()
  await admin.from('moderation_rejections').insert({
    user_id: params.userId,
    reason: params.reason,
    sample: params.sample?.slice(0, 400) ?? null,
    ip: params.ip,
    user_agent: params.userAgent?.slice(0, 400) ?? null,
  })

  if (params.reason.startsWith('nsfw')) {
    void detectNsfwSpree(admin, params.userId)
  }
}

async function detectNsfwSpree(admin: SupabaseClient, userId: string): Promise<void> {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('moderation_rejections')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .like('reason', 'nsfw%')
      .gte('created_at', since)
    if ((count ?? 0) < 3) return

    const hourBucket = new Date().toISOString().slice(0, 13)
    const allowed = await rateLimit(`alert:nsfw_spree:${userId}:${hourBucket}`, 1, 3 * 60 * 60 * 1000)
    if (!allowed) return

    await sendAdminAlert({
      severity: 'warning',
      title: 'Padrão NSFW suspeito',
      description: `Usuário acumulou ${count} rejeições NSFW na última hora.`,
      fields: [{ name: 'user_id', value: userId, inline: true }],
    })
  } catch (err) {
    console.warn('[moderation] detectNsfwSpree falhou', err)
  }
}

export type ImageScanDecision = {
  assetId: string
  objectKey: string
  result: NsfwScanResult
}

export async function scanAssetsAndPersist(
  supabase: SupabaseClient,
  assets: Array<{ id: string; object_key: string; publicUrl: string }>,
): Promise<ImageScanDecision[]> {
  if (assets.length === 0) return []
  if (!isNsfwProviderConfigured()) {
    return assets.map((a) => ({
      assetId: a.id,
      objectKey: a.object_key,
      result: { available: false, reason: 'provider_not_configured' },
    }))
  }

  const decisions = await Promise.all(
    assets.map(async (a) => {
      const result = await scanImage(a.publicUrl, { timeoutMs: 5000 })
      return { assetId: a.id, objectKey: a.object_key, result }
    }),
  )

  const updates = decisions
    .filter((d) => d.result.available)
    .map((d) => {
      const r = d.result as Extract<NsfwScanResult, { available: true }>
      return {
        id: d.assetId,
        nsfw_flagged: !r.safe,
        nsfw_score: r.score,
        nsfw_labels: r.labels.map((l) => l.label).slice(0, 12),
        moderation_provider: r.provider,
        moderation_scanned_at: new Date().toISOString(),
      }
    })

  for (const u of updates) {
    await supabase
      .from('vd_media_assets')
      .update({
        nsfw_flagged: u.nsfw_flagged,
        nsfw_score: u.nsfw_score,
        nsfw_labels: u.nsfw_labels,
        moderation_provider: u.moderation_provider,
        moderation_scanned_at: u.moderation_scanned_at,
      })
      .eq('id', u.id)
  }

  const logRows = decisions
    .filter((d) => d.result.available)
    .map((d) => {
      const r = d.result as Extract<NsfwScanResult, { available: true }>
      return {
        asset_id: d.assetId,
        provider: r.provider,
        score: r.score,
        labels: r.labels.map((l) => l.label).slice(0, 12),
        raw_response: r.raw ?? null,
      }
    })

  if (logRows.length > 0) {
    // vd_media_moderation_log tem RLS sem policy de INSERT — admin only.
    const admin = createAdminClient()
    await admin.from('vd_media_moderation_log').insert(logRows)
  }

  return decisions
}

export function hasNsfwFlagged(decisions: ImageScanDecision[]): boolean {
  return decisions.some(
    (d) => d.result.available && !d.result.safe,
  )
}
