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

  if (!rateLimit(`community:mute:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  if (userId === user.id) {
    return NextResponse.json({ error: 'cannot_mute_self' }, { status: 400 })
  }

  const { error } = await supabase
    .from('vd_mutes')
    .upsert(
      {
        muter_user_id: user.id,
        muted_user_id: userId,
      },
      {
        onConflict: 'muter_user_id,muted_user_id',
        ignoreDuplicates: true,
      },
    )

  if (error) {
    return NextResponse.json({ error: 'mute_failed', detail: error.message }, { status: 500 })
  }

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
    .from('vd_mutes')
    .delete()
    .eq('muter_user_id', user.id)
    .eq('muted_user_id', userId)

  if (error) {
    return NextResponse.json({ error: 'unmute_failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
