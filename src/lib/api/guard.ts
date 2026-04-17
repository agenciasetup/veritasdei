import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import type { User } from '@supabase/supabase-js'

/**
 * Helper único para gatear rotas API. Reúne o padrão auth + rate limit +
 * admin check num só lugar — evita drift entre rotas (umas usam
 * checkAdmin, outras inline, umas checam rate limit primeiro, outras
 * depois, etc.).
 *
 * Uso típico:
 *
 *   const guard = await requireUser({ rateLimit: { key: 'foo', limit: 20, windowMs: 60_000 } })
 *   if (guard instanceof NextResponse) return guard
 *   // guard.user, guard.supabase disponíveis
 *
 *   // admin:
 *   const guard = await requireAdmin()
 *   if (guard instanceof NextResponse) return guard
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SSRClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

export interface GuardResult {
  user: User
  supabase: SSRClient
}

export interface RateLimitOpts {
  /** Identificador do bucket (ex.: 'places-ac', 'verbum-explain') */
  key: string
  /** Max requests dentro da janela */
  limit: number
  /** Janela em ms */
  windowMs: number
}

export interface RequireUserOpts {
  rateLimit?: RateLimitOpts
  /** Mensagem customizada no 401. Default: "Não autenticado." */
  unauthenticatedMessage?: string
}

export interface RequireAdminOpts extends RequireUserOpts {
  /** Mensagem customizada no 403. Default: "Sem permissão." */
  forbiddenMessage?: string
}

/**
 * Exige sessão válida. Opcionalmente aplica rate limit por `${key}:${user.id}`.
 * Retorna NextResponse em caso de falha (401, 429) ou { user, supabase }.
 */
export async function requireUser(opts: RequireUserOpts = {}): Promise<NextResponse | GuardResult> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: opts.unauthenticatedMessage ?? 'Não autenticado.' },
      { status: 401 },
    )
  }

  if (opts.rateLimit) {
    const ok = await rateLimit(`${opts.rateLimit.key}:${user.id}`, opts.rateLimit.limit, opts.rateLimit.windowMs)
    if (!ok) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um momento.' },
        { status: 429 },
      )
    }
  }

  return { user, supabase }
}

/**
 * Exige sessão válida + role='admin' no profile. Retorna NextResponse em
 * caso de falha (401, 403, 429) ou { user, supabase }.
 */
export async function requireAdmin(opts: RequireAdminOpts = {}): Promise<NextResponse | GuardResult> {
  const base = await requireUser(opts)
  if (base instanceof NextResponse) return base

  const { data: profile } = await base.supabase
    .from('profiles')
    .select('role')
    .eq('id', base.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json(
      { error: opts.forbiddenMessage ?? 'Sem permissão.' },
      { status: 403 },
    )
  }

  return base
}
