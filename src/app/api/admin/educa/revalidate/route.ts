/**
 * /api/admin/educa/revalidate — invalida o cache server-side do EDUCA.
 *
 * Endpoint chamado pelo `/admin/educa/banners` e `/admin/conteudos` após
 * salvar alterações que afetam dados públicos cacheados via
 * `unstable_cache` (banners ativos + capas de pilares).
 *
 * Sem isso, o admin alteraria um banner e o /educa/estudo continuaria
 * servindo o cache antigo por até 5 minutos (TTL).
 */
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  revalidateEducaBanners,
  revalidateEducaDestaques,
  revalidateEducaPillars,
} from '@/lib/educa/server-data'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Target = 'banners' | 'pillars' | 'destaques' | 'all'

const VALID_TARGETS: Target[] = ['banners', 'pillars', 'destaques', 'all']

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let target: Target = 'all'
  try {
    const body = (await req.json()) as { target?: Target }
    if (body?.target && VALID_TARGETS.includes(body.target)) {
      target = body.target
    }
  } catch {
    /* body opcional */
  }

  if (target === 'banners' || target === 'all') revalidateEducaBanners()
  if (target === 'pillars' || target === 'all') revalidateEducaPillars()
  if (target === 'destaques' || target === 'all') revalidateEducaDestaques()

  return NextResponse.json({ ok: true, target })
}
