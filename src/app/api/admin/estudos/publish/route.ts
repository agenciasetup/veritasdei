import { NextResponse } from 'next/server'
import { requireSystemAdmin } from '@/lib/auth/require-auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type Body = {
  id: string
  status: 'draft' | 'review' | 'published' | 'archived'
  sections?: unknown
  sources?: unknown
}

export async function POST(request: Request) {
  const userId = await requireSystemAdmin()
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const update: Record<string, unknown> = {
    status: body.status,
    reviewed_by: userId,
  }
  if (body.sections !== undefined) update.sections = body.sections
  if (body.sources !== undefined) update.sources = body.sources
  if (body.status === 'published') update.published_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('content_deepdive')
    .update(update)
    .eq('id', body.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ deepdive: data })
}
