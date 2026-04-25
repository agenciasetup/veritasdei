import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'

interface UnifiedLogRow {
  source: 'rejection' | 'media_scan'
  id: string
  created_at: string
  user_id: string | null
  asset_id?: string | null
  reason?: string | null
  provider?: string | null
  score?: number | null
  labels?: string[] | null
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const url = new URL(req.url)
  const reason = url.searchParams.get('reason')
  const since = url.searchParams.get('since')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200)

  const admin = createAdminClient()

  let rejQuery = admin
    .from('moderation_rejections')
    .select('id, user_id, reason, sample, ip, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (reason) rejQuery = rejQuery.eq('reason', reason)
  if (since) rejQuery = rejQuery.gte('created_at', since)

  let scanQuery = admin
    .from('vd_media_moderation_log')
    .select('id, asset_id, provider, score, labels, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (since) scanQuery = scanQuery.gte('created_at', since)

  const [rej, scan] = await Promise.all([rejQuery, scanQuery])
  if (rej.error) return NextResponse.json({ error: 'db_error', detail: rej.error.message }, { status: 500 })
  if (scan.error) return NextResponse.json({ error: 'db_error', detail: scan.error.message }, { status: 500 })

  const items: UnifiedLogRow[] = [
    ...(rej.data ?? []).map((r) => ({
      source: 'rejection' as const,
      id: r.id,
      created_at: r.created_at,
      user_id: r.user_id ?? null,
      reason: r.reason,
    })),
    ...(scan.data ?? []).map((s) => ({
      source: 'media_scan' as const,
      id: s.id,
      created_at: s.created_at,
      user_id: null,
      asset_id: s.asset_id ?? null,
      provider: s.provider ?? null,
      score: s.score ?? null,
      labels: (s.labels as string[] | null) ?? null,
    })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)

  return NextResponse.json({ items })
}
