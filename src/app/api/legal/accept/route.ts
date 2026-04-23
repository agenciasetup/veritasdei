import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LEGAL_DOCUMENTS, LEGAL_VERSIONS, type LegalDocumentKey } from '@/lib/legal/versions'
import { recordAcceptance } from '@/lib/legal/acceptance'

type Body = {
  documents?: LegalDocumentKey[]
  locale?: string
}

function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip')
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const requested = Array.isArray(body.documents) && body.documents.length > 0
    ? body.documents
    : ([...LEGAL_DOCUMENTS] as LegalDocumentKey[])
  const invalid = requested.filter((key) => !LEGAL_DOCUMENTS.includes(key))
  if (invalid.length > 0) {
    return NextResponse.json({ error: 'invalid_document', invalid }, { status: 400 })
  }

  const ip = clientIp(req)
  const userAgent = req.headers.get('user-agent')
  const locale = body.locale ?? req.headers.get('accept-language')?.split(',')[0] ?? null

  const accepted: Partial<Record<LegalDocumentKey, string>> = {}
  for (const key of requested) {
    const result = await recordAcceptance({
      supabase,
      userId: user.id,
      documentKey: key,
      ip,
      userAgent,
      locale,
    })
    if (!result.ok) {
      return NextResponse.json({ error: 'db_error', detail: result.error, key }, { status: 500 })
    }
    accepted[key] = LEGAL_VERSIONS[key]
  }

  return NextResponse.json({ ok: true, accepted })
}
