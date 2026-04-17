import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { COMMUNITY_EVENTS } from '@/lib/community/events'
import { pushCommunityNotification } from '@/lib/community/notifications'
import { requireCommunityPremiumAccess } from '@/lib/community/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { userId } = await params
  const { supabase, user } = access.context

  if (!rateLimit(`community:follow:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  if (userId === user.id) {
    return NextResponse.json({ error: 'cannot_follow_self' }, { status: 400 })
  }

  const { data: targetUser } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('id', userId)
    .single()

  if (!targetUser) {
    return NextResponse.json({ error: 'target_not_found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('vd_follows')
    .upsert({
      follower_user_id: user.id,
      followed_user_id: userId,
    })

  if (error) {
    return NextResponse.json({ error: 'follow_failed', detail: error.message }, { status: 500 })
  }

  void pushCommunityNotification({
    userId,
    type: 'community.follow',
    title: 'Comunidade Veritas',
    body: `${user.email} começou a seguir você.`,
    targetUrl: '/comunidade',
    payload: {
      actor_user_id: user.id,
      followed_user_id: userId,
    },
    dedupeKey: `community:follow:${user.id}:${userId}`,
  })

  return NextResponse.json({ event: COMMUNITY_EVENTS.followCreated, ok: true })
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
    .from('vd_follows')
    .delete()
    .eq('follower_user_id', user.id)
    .eq('followed_user_id', userId)

  if (error) {
    return NextResponse.json({ error: 'unfollow_failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: COMMUNITY_EVENTS.followRemoved, ok: true })
}
