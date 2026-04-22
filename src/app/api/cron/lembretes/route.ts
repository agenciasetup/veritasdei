import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUsers } from '@/lib/push/send'
import { liturgiaHoje, angelus, exame } from '@/lib/push/templates'
import type { LiturgiaDia } from '@/types/liturgia'

/**
 * POST /api/cron/lembretes  —  vercel.json: "0 * * * *" (hora em hora)
 *
 * 1 cron para todas as categorias com horário ajustável pelo usuário
 * (liturgia, ângelus, exame). Dispara por hora local (pref.timezone).
 *
 * Estratégia:
 *   - Busca todos os usuários com push_enabled.
 *   - Para cada um, calcula a hora atual na timezone salva.
 *   - Dispara qualquer categoria cuja hora configurada bate com a hora local.
 *   - Dedupe diário via user_notificacoes_feed (pelo dedupe_key do template).
 *
 * Novenas continuam em /api/novenas/reminders (cron 8h UTC) porque precisa
 * de join com novenas_progress — separado por clareza.
 */

interface UserRow {
  user_id: string
  timezone: string
  pref_liturgia: boolean
  pref_liturgia_hora: number
  pref_angelus: boolean
  pref_exame: boolean
  pref_exame_hora: number
}

function horaLocal(tz: string): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      hour12: false,
    })
    return Number(fmt.format(new Date()))
  } catch {
    return new Date().getUTCHours() - 3 // fallback: BRT
  }
}

async function fetchLiturgiaHoje(origin: string): Promise<LiturgiaDia | null> {
  try {
    const res = await fetch(`${origin}/api/liturgia/hoje`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return (await res.json()) as LiturgiaDia
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[cron/lembretes] CRON_SECRET ausente')
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: users, error } = await supabase
    .from('user_notificacoes_prefs')
    .select(
      'user_id, timezone, pref_liturgia, pref_liturgia_hora, pref_angelus, pref_exame, pref_exame_hora',
    )
    .eq('push_enabled', true)
    .not('push_endpoint', 'is', null)

  if (error) {
    console.error('[cron/lembretes] fetch error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!users?.length) {
    return NextResponse.json({ total: 0, message: 'no_users' })
  }

  // Buckets por categoria — lista de userIds que devem receber agora.
  const bucketLiturgia: string[] = []
  const bucketAngelus: string[] = []
  const bucketExame: string[] = []

  for (const u of users as UserRow[]) {
    const hora = horaLocal(u.timezone || 'America/Sao_Paulo')
    if (u.pref_liturgia && hora === u.pref_liturgia_hora) bucketLiturgia.push(u.user_id)
    if (u.pref_angelus && hora === 12) bucketAngelus.push(u.user_id)
    if (u.pref_exame && hora === u.pref_exame_hora) bucketExame.push(u.user_id)
  }

  const url = new URL(req.url)
  const origin = `${url.protocol}//${url.host}`

  const liturgia =
    bucketLiturgia.length > 0 ? await fetchLiturgiaHoje(origin) : null

  const [rLit, rAng, rExa] = await Promise.all([
    bucketLiturgia.length
      ? sendPushToUsers(bucketLiturgia, liturgiaHoje(liturgia), {
          categoria: 'liturgia',
          admin: supabase,
        })
      : null,
    bucketAngelus.length
      ? sendPushToUsers(bucketAngelus, angelus(), {
          categoria: 'angelus',
          admin: supabase,
        })
      : null,
    bucketExame.length
      ? sendPushToUsers(bucketExame, exame(), {
          categoria: 'exame',
          admin: supabase,
        })
      : null,
  ])

  return NextResponse.json({
    total_users: users.length,
    liturgia: { candidates: bucketLiturgia.length, result: rLit },
    angelus: { candidates: bucketAngelus.length, result: rAng },
    exame: { candidates: bucketExame.length, result: rExa },
  })
}
