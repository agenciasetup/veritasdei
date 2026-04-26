import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUsers } from '@/lib/push/send'
import { novena } from '@/lib/push/templates'

/**
 * /api/novenas/reminders
 *
 * Cron diário (vercel.json: 0 8 * * * UTC = 5h BRT).
 * Aceita GET (Vercel Cron padrão) e POST (curl manual).
 * Envia lembrete aos usuários com novenas ativas + push habilitado + pref_novenas=true.
 * Filtro de pref + envio HTTP ficam na lib `sendPushToUsers` (web-push).
 *
 * Protegido por CRON_SECRET.
 */

async function runNovenasReminders(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[novenas/reminders] CRON_SECRET não configurado')
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

  const { data: activeProgress, error: progressErr } = await supabase
    .from('novenas_progress')
    .select('user_id, builtin_slug, current_day')
    .is('completed_at', null)

  if (progressErr) {
    console.error('[novenas/reminders] progress fetch error', progressErr)
    return NextResponse.json({ error: progressErr.message }, { status: 500 })
  }

  if (!activeProgress?.length) {
    return NextResponse.json({ sent: 0, message: 'no_active_novenas' })
  }

  // Agrupa por user (1 lembrete por pessoa, mesmo com N novenas ativas)
  const userMap = new Map<string, { slug: string | null; dia: number }>()
  for (const row of activeProgress) {
    if (userMap.has(row.user_id)) continue
    userMap.set(row.user_id, { slug: row.builtin_slug, dia: row.current_day })
  }

  const userIds = Array.from(userMap.keys())

  // Template pega detalhes (dia/slug) do primeiro usuário; para personalização
  // por-usuário seria necessário 1 chamada por usuário. Mantemos template
  // genérico — detalhes específicos (dia X de 9) não cabem num push só.
  const payload = novena({
    dia: userMap.get(userIds[0])?.dia,
    slug: userMap.get(userIds[0])?.slug,
  })

  const result = await sendPushToUsers(userIds, payload, {
    categoria: 'novena',
    admin: supabase,
  })

  return NextResponse.json({
    total_active_users: userIds.length,
    ...result,
  })
}

export const GET = runNovenasReminders
export const POST = runNovenasReminders
