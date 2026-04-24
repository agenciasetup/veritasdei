import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/lgpd/export
 *   Retorna um JSON com todos os dados pessoais do usuário autenticado —
 *   portabilidade prevista pelo art. 18, V, da LGPD. Entrega inline (sem
 *   anexo/e-mail): o browser faz download via Content-Disposition.
 *
 *   A exportação inclui tudo o que está vinculado ao user_id nas tabelas
 *   consultáveis via RLS. Mídia em R2 fica fora desta resposta (links
 *   públicos já estão no payload do post).
 */
export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const payload: Record<string, unknown> = {
    generated_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
    },
  }

  const tables: { key: string; table: string; column: string; orderBy?: string }[] = [
    { key: 'profile', table: 'profiles', column: 'id' },
    { key: 'legal_acceptances', table: 'user_legal_acceptances', column: 'user_id', orderBy: 'accepted_at' },
    { key: 'parental_consents', table: 'parental_consents', column: 'user_id', orderBy: 'requested_at' },
    { key: 'login_events', table: 'auth_login_events', column: 'user_id', orderBy: 'created_at' },
    { key: 'notificacoes_prefs', table: 'user_notificacoes_prefs', column: 'user_id' },
    { key: 'posts', table: 'vd_posts', column: 'author_user_id', orderBy: 'created_at' },
    { key: 'reactions', table: 'vd_reactions', column: 'user_id', orderBy: 'created_at' },
    { key: 'follows_out', table: 'vd_follows', column: 'follower_user_id', orderBy: 'created_at' },
    { key: 'follows_in', table: 'vd_follows', column: 'followed_user_id', orderBy: 'created_at' },
    { key: 'blocks_by_me', table: 'vd_blocks', column: 'blocker_user_id', orderBy: 'created_at' },
    { key: 'mutes_by_me', table: 'vd_mutes', column: 'muter_user_id', orderBy: 'created_at' },
    { key: 'media_assets', table: 'vd_media_assets', column: 'owner_user_id', orderBy: 'created_at' },
    { key: 'cartas_santo', table: 'cartas_santo', column: 'user_id', orderBy: 'created_at' },
    { key: 'intencoes', table: 'intencoes', column: 'user_id', orderBy: 'created_at' },
    { key: 'pedidos_oracao', table: 'pedidos_oracao', column: 'user_id', orderBy: 'created_at' },
  ]

  const errors: Record<string, string> = {}

  for (const t of tables) {
    let query = supabase.from(t.table).select('*').eq(t.column, user.id)
    if (t.orderBy) query = query.order(t.orderBy, { ascending: true })
    const { data, error } = await query
    if (error) {
      errors[t.key] = error.message
      continue
    }
    payload[t.key] = data ?? []
  }
  if (Object.keys(errors).length > 0) {
    payload._errors = errors
  }

  const filename = `veritasdei-export-${user.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
