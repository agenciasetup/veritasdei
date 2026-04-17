import { NextRequest, NextResponse } from 'next/server'
import { requireCommunitySession } from '@/lib/community/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response
  const { supabase } = session

  const { id } = await params

  let body: { reason?: string | null; revoke?: boolean }
  try { body = await req.json() } catch { body = {} }

  const { error } = await supabase.rpc('admin_verify_profile', {
    p_user_id: id,
    p_reason: body.reason ?? null,
    p_revoke: body.revoke === true,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message.includes('Apenas admin') ? 'forbidden' : 'db_error', detail: error.message },
      { status: error.message.includes('Apenas admin') ? 403 : 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
