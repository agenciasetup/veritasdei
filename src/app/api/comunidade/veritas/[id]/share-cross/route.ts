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

  if (!(await rateLimit(`community:share-cross:${user.id}`, 60, 60_000))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const [{ error }, { data: post }] = await Promise.all([
    supabase
      .from('vd_reactions')
      .upsert({
        user_id: user.id,
        post_id: id,
        type: 'share_cross',
      }, {
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
    return NextResponse.json({ error: 'share_cross_failed', detail: error.message }, { status: 500 })
  }

  if (!post) {
    return NextResponse.json({ error: 'post_not_found' }, { status: 404 })
  }

  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('public_handle, user_number')
    .eq('id', post.author_user_id)
    .single()

  const basePath = authorProfile?.public_handle
    ? `/comunidade/@${authorProfile.public_handle}`
    : `/comunidade/p/${authorProfile?.user_number ?? ''}`

  const shareUrl = `${basePath}?vd=${id}`

  if (post.author_user_id !== user.id) {
    void pushCommunityNotification({
      userId: post.author_user_id,
      type: 'community.share_cross',
      title: 'Comunidade Veritas',
      body: `${user.email} compartilhou seu Veritas.`,
      targetUrl: `/comunidade/veritas/${id}`,
      payload: {
        actor_user_id: user.id,
        post_id: id,
      },
      dedupeKey: `community:share_cross:${user.id}:${id}`,
    })
  }

  return NextResponse.json({
    event: COMMUNITY_EVENTS.veritasShareCross,
    ok: true,
    share: {
      title: 'Veritas Dei — Comunidade',
      text: 'Veja este Veritas na comunidade católica do Veritas Dei.',
      url: shareUrl,
    },
  })
}
