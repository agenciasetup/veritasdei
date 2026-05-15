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
 * salvamos só o telefone e retornamos 409 com `cpf_conflict=true` — o front
 * exibe o erro e permite ao usuário corrigir antes de gerar o pagamento.
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
    // 23505 = unique_violation. Em profiles, o único índice afetado por
    // este patch é `idx_profiles_cpf`. Se o CPF colide, o usuário precisa
    // saber — não dá pra ele cobrar uma cobrança com CPF de outra pessoa.
    // Salvamos só o telefone (que não tem unique) e devolvemos 409.
    if (error.code === '23505' && patch.cpf) {
      if (patch.telefone) {
        await admin
          .from('profiles')
          .update({ telefone: patch.telefone })
          .eq('id', user.id)
      }
      return NextResponse.json(
        {
          error: 'CPF já cadastrado em outra conta',
          cpf_conflict: true,
          saved: patch.telefone ? ['telefone'] : [],
        },
        { status: 409 },
      )
    }
    console.warn('[educa/signup-billing] update falhou:', error.message)
    // Falha não-unique (rara): segue silenciosa pra não travar a venda.
    // O checkout coleta de novo manualmente nesse caso.
    return NextResponse.json({ ok: true, saved: [] })
  }

  return NextResponse.json({ ok: true, saved: Object.keys(patch) })
}
