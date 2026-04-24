import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isLoginThrottled, recordFailedLogin } from '@/lib/auth/login-throttle'
import { clientIpFromHeaders } from '@/lib/auth/log-login-event'

type Body = {
  email?: string
  // "check" só consulta; "fail" registra uma tentativa falha.
  action?: 'check' | 'fail'
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'email_required' }, { status: 400 })

  const admin = createAdminClient()

  if (body.action === 'fail') {
    await recordFailedLogin(admin, {
      email,
      ip: clientIpFromHeaders(req.headers),
    })
    const after = await isLoginThrottled(admin, email)
    return NextResponse.json(after)
  }

  const state = await isLoginThrottled(admin, email)
  return NextResponse.json(state)
}
