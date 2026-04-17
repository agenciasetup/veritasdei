import { NextRequest, NextResponse } from 'next/server'
import { requireCommunitySession } from '@/lib/community/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response
  const { supabase } = session

  const { id } = await params

  const { error } = await supabase.rpc('admin_hide_post', { p_post_id: id })

  if (error) {
    return NextResponse.json(
      { error: error.message.includes('negado') ? 'forbidden' : 'db_error', detail: error.message },
      { status: error.message.includes('negado') ? 403 : 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
