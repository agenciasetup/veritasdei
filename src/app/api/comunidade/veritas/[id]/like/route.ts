import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { COMMUNITY_EVENTS } from '@/lib/community/events'
import { pushCommunityNotification } from '@/lib/community/notifications'
import { requireCommunitySession } from '@/lib/community/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { id } = await params
  const { supabase, user } = session

  if (!rateLimit(`community:like:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const [{ error }, { data: post }] = await Promise.all([
    supabase
      .from('vd_reactions')
      .upsert({ user_id: user.id, post_id: id, type: 'like' }, {
        onConflict: 'user_id,post_id,type',
        ignoreDuplicates: true,
      }),
    supabase
      .from('vd_posts')
      .select('id, author_user_id')
      .eq('id', id)
      .single(),
  ])

  if (error) {
    return NextResponse.json({ error: 'like_failed', detail: error.message }, { status: 500 })
  }

  if (post && post.author_user_id !== user.id) {
    void pushCommunityNotification({
      userId: post.author_user_id,
      type: 'community.like',
      title: 'Comunidade Veritas',
      body: `${user.email} curtiu seu Veritas.`,
      targetUrl: `/comunidade/veritas/${id}`,
      payload: {
        actor_user_id: user.id,
        post_id: id,
      },
      dedupeKey: `community:like:${user.id}:${id}`,
    })
  }

  return NextResponse.json({ event: COMMUNITY_EVENTS.veritasLiked, ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response

  const { id } = await params
  const { supabase, user } = session

  const { error } = await supabase
    .from('vd_reactions')
    .delete()
    .eq('user_id', user.id)
    .eq('post_id', id)
    .eq('type', 'like')

  if (error) {
    return NextResponse.json({ error: 'unlike_failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: COMMUNITY_EVENTS.veritasUnliked, ok: true })
}
