import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { COMMUNITY_EVENTS } from '@/lib/community/events'
import { pushCommunityNotification } from '@/lib/community/notifications'
import { requireCommunityPremiumAccess } from '@/lib/community/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { id } = await params
  const { supabase, user } = access.context

  if (!rateLimit(`community:repost:${user.id}`, 40, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const { data: existing } = await supabase
    .from('vd_posts')
    .select('id')
    .eq('author_user_id', user.id)
    .eq('kind', 'repost')
    .eq('parent_post_id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ event: COMMUNITY_EVENTS.veritasReposted, ok: true, repost_id: existing.id })
  }

  const [{ data: created, error }, { data: parent }] = await Promise.all([
    supabase
      .from('vd_posts')
      .insert({
        author_user_id: user.id,
        kind: 'repost',
        body: '',
        parent_post_id: id,
      })
      .select('id')
      .single(),
    supabase
      .from('vd_posts')
      .select('author_user_id')
      .eq('id', id)
      .single(),
  ])

  if (error || !created) {
    return NextResponse.json({ error: 'repost_failed', detail: error?.message }, { status: 500 })
  }

  if (parent && parent.author_user_id !== user.id) {
    void pushCommunityNotification({
      userId: parent.author_user_id,
      type: 'community.repost',
      title: 'Comunidade Veritas',
      body: `${user.email} republicou seu Veritas.`,
      targetUrl: `/comunidade/veritas/${id}`,
      payload: {
        actor_user_id: user.id,
        post_id: id,
        repost_id: created.id,
      },
      dedupeKey: `community:repost:${user.id}:${id}`,
    })
  }

  return NextResponse.json({ event: COMMUNITY_EVENTS.veritasReposted, ok: true, repost_id: created.id })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { id } = await params
  const { supabase, user } = access.context

  const { error } = await supabase
    .from('vd_posts')
    .delete()
    .eq('author_user_id', user.id)
    .eq('kind', 'repost')
    .eq('parent_post_id', id)

  if (error) {
    return NextResponse.json({ error: 'undo_repost_failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
