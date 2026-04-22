import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/push/prefs
 *   → devolve as preferências do usuário logado (ou defaults se nunca salvou).
 *
 * PATCH /api/push/prefs
 *   body: qualquer subset dos campos de preferência.
 *   → upsert parcial, preservando campos não enviados.
 *
 * RLS garante que cada usuário só mexe nas próprias prefs.
 * Não cria / nem mexe em push_enabled ou endpoint — isso é responsabilidade
 * de /api/push/subscribe.
 */

const PatchSchema = z.object({
  pref_liturgia: z.boolean().optional(),
  pref_liturgia_hora: z.number().int().min(0).max(23).optional(),
  pref_angelus: z.boolean().optional(),
  pref_novenas: z.boolean().optional(),
  pref_exame: z.boolean().optional(),
  pref_exame_hora: z.number().int().min(0).max(23).optional(),
  pref_comunidade: z.boolean().optional(),
})

const DEFAULTS = {
  push_enabled: false,
  pref_liturgia: true,
  pref_liturgia_hora: 7,
  pref_angelus: true,
  pref_novenas: true,
  pref_exame: true,
  pref_exame_hora: 21,
  pref_comunidade: true,
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_notificacoes_prefs')
    .select(
      'push_enabled, pref_liturgia, pref_liturgia_hora, pref_angelus, pref_novenas, pref_exame, pref_exame_hora, pref_comunidade',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[push/prefs] GET error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json(data ?? DEFAULTS)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', detail: parsed.error.flatten() },
      { status: 400 },
    )
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'empty_body' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_notificacoes_prefs')
    .upsert(
      {
        user_id: user.id,
        ...parsed.data,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) {
    console.error('[push/prefs] PATCH error', error)
    return NextResponse.json({ error: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
