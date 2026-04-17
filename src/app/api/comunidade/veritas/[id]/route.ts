import { NextResponse } from 'next/server'
import { fetchPostsByIds } from '@/lib/community/posts'
import { requireCommunityPremiumAccess } from '@/lib/community/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { id } = await params
  const { supabase, user } = access.context

  const [post] = await fetchPostsByIds(supabase, user.id, [id])
  if (!post) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const { data: replyRows, error } = await supabase
    .from('vd_posts')
    .select('id')
    .eq('parent_post_id', id)
    .eq('kind', 'reply')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: 'replies_failed', detail: error.message }, { status: 500 })
  }

  const replies = await fetchPostsByIds(
    supabase,
    user.id,
    ((replyRows ?? []) as Array<{ id: string }>).map(row => row.id),
  )

  return NextResponse.json({ post, replies })
}
