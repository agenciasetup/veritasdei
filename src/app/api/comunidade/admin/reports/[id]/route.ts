import { NextRequest, NextResponse } from 'next/server'
import { requireCommunitySession } from '@/lib/community/server'

const VALID = new Set(['reviewing', 'resolved', 'dismissed'])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCommunitySession()
  if (!session.ok) return session.response
  const { supabase } = session

  const { id } = await params

  let body: { resolution?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const resolution = body.resolution
  if (!resolution || !VALID.has(resolution)) {
    return NextResponse.json({ error: 'invalid_resolution' }, { status: 400 })
  }

  const { error } = await supabase.rpc('admin_resolve_report', {
    p_report_id: id,
    p_resolution: resolution,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message.includes('negado') ? 'forbidden' : 'db_error', detail: error.message },
      { status: error.message.includes('negado') ? 403 : 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
