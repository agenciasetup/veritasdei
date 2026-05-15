/**
 * POST /api/educa/signup-billing
 *
 * Salva CPF + telefone no profile logo após o cadastro na página de venda
 * do Veritas Educa. Esses dados pré-preenchem o checkout Asaas — o
 * comprador não redigita na etapa de pagamento.
 *
 * Body: { cpf?: string, telefone?: string }
 *
 * Usa o admin client porque o profile pode ter acabado de ser criado pelo
 * trigger `handle_new_user` — escrever via admin evita qualquer corrida com
 * RLS na transição anon → authenticated.
 *
 * O CPF tem índice único em profiles. Se o CPF já pertence a outra conta,
 * gravamos só o telefone e seguimos — o checkout coleta o CPF de novo como
 * fallback, então isso nunca trava a venda.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function onlyDigits(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\D/g, '') : ''
}

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { cpf?: string; telefone?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body vazio é aceito
  }

  const cpf = onlyDigits(body.cpf)
  const telefone = onlyDigits(body.telefone)

  const admin = createAdminClient()

  const patch: { cpf?: string; telefone?: string } = {}
  if (cpf.length === 11) patch.cpf = cpf
  if (telefone.length >= 10) patch.telefone = telefone

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, saved: [] })
  }

  const { error } = await admin.from('profiles').update(patch).eq('id', user.id)

  if (error) {
    // 23505 = unique_violation (CPF já usado por outra conta). Regrava só o
    // telefone — não é motivo pra interromper a assinatura.
    if (error.code === '23505' && patch.telefone) {
      const { error: retryError } = await admin
        .from('profiles')
        .update({ telefone: patch.telefone })
        .eq('id', user.id)
      if (!retryError) {
        return NextResponse.json({ ok: true, saved: ['telefone'] })
      }
    }
    console.warn('[educa/signup-billing] update falhou:', error.message)
    // Falha silenciosa: o checkout ainda coleta os dados manualmente.
    return NextResponse.json({ ok: true, saved: [] })
  }

  return NextResponse.json({ ok: true, saved: Object.keys(patch) })
}
