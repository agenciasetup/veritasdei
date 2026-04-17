import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { requireCommunityPremiumAccess } from '@/lib/community/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { userId } = await params
  const { supabase, user } = access.context

  if (!rateLimit(`community:block:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  if (userId === user.id) {
    return NextResponse.json({ error: 'cannot_block_self' }, { status: 400 })
  }

  const { error } = await supabase
    .from('vd_blocks')
    .upsert(
      {
        blocker_user_id: user.id,
        blocked_user_id: userId,
      },
      {
        onConflict: 'blocker_user_id,blocked_user_id',
        ignoreDuplicates: true,
      },
    )

  if (error) {
    return NextResponse.json({ error: 'block_failed', detail: error.message }, { status: 500 })
  }

  // Remove relação de follow bilateral para evitar reconexão automática no feed.
  await Promise.all([
    supabase
      .from('vd_follows')
      .delete()
      .eq('follower_user_id', user.id)
      .eq('followed_user_id', userId),
    supabase
      .from('vd_follows')
      .delete()
      .eq('follower_user_id', userId)
      .eq('followed_user_id', user.id),
  ])

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { userId } = await params
  const { supabase, user } = access.context

  const { error } = await supabase
    .from('vd_blocks')
    .delete()
    .eq('blocker_user_id', user.id)
    .eq('blocked_user_id', userId)

  if (error) {
    return NextResponse.json({ error: 'unblock_failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
