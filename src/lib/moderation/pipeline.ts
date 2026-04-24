import type { SupabaseClient } from '@supabase/supabase-js'
import { scanForBlockedDomains, type BlocklistHit } from './blocklist'
import { scanText, isHardReject, type TextFilterHit } from './text-filter'
import { isNsfwProviderConfigured, scanImage, type NsfwScanResult } from './image-nsfw'

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
  supabase: SupabaseClient,
  params: {
    userId: string
    reason: string
    sample: string | null
    ip: string | null
    userAgent: string | null
  },
) {
  await supabase.from('moderation_rejections').insert({
    user_id: params.userId,
    reason: params.reason,
    sample: params.sample?.slice(0, 400) ?? null,
    ip: params.ip,
    user_agent: params.userAgent?.slice(0, 400) ?? null,
  })
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
    await supabase.from('vd_media_moderation_log').insert(logRows)
  }

  return decisions
}

export function hasNsfwFlagged(decisions: ImageScanDecision[]): boolean {
  return decisions.some(
    (d) => d.result.available && !d.result.safe,
  )
}
