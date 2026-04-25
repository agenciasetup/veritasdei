import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIdentifierBan, hashIdentifier } from '@/lib/auth/identifier-guard'
import { clientIpFromHeaders } from '@/lib/auth/log-login-event'
import { sendAdminAlert } from '@/lib/notifications/admin-alert'
import { rateLimit } from '@/lib/rate-limit'

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
    const hash = hashIdentifier(email)
    const alertAllowed = await rateLimit(`alert:signup_blocked:${hash}`, 1, 60 * 60 * 1000)
    if (alertAllowed) {
      await sendAdminAlert({
        severity: 'info',
        title: 'Tentativa de signup com identificador banido',
        fields: [
          { name: 'reason', value: result.reason, inline: true },
          { name: 'email_hash', value: hash.slice(0, 16) + '…', inline: true },
          { name: 'ip', value: clientIpFromHeaders(req.headers) ?? '—', inline: true },
        ],
      })
    }
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
