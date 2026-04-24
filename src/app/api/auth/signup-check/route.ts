import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIdentifierBan } from '@/lib/auth/identifier-guard'
import { clientIpFromHeaders } from '@/lib/auth/log-login-event'

type Body = { email?: string }

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ allowed: true })

  const admin = createAdminClient()
  const result = await checkIdentifierBan(admin, {
    email,
    ip: clientIpFromHeaders(req.headers),
  })

  if (!result.allowed) {
    return NextResponse.json(
      {
        allowed: false,
        reason: result.reason,
        detail:
          result.reason === 'banned_email'
            ? 'Este e-mail está bloqueado por violação das Diretrizes da Comunidade.'
            : 'Cadastro bloqueado a partir deste dispositivo/rede.',
      },
      { status: 403 },
    )
  }

  return NextResponse.json({ allowed: true })
}
