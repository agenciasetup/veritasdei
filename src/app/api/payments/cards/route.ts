/**
 * GET /api/payments/cards — lista cartões salvos do usuário.
 *
 * O salvamento acontece dentro do /asaas/charge quando o cliente marca
 * "salvar cartão" — após a cobrança bem-sucedida, o token retornado pela
 * Asaas é persistido em billing_saved_cards.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('billing_saved_cards')
    .select(
      'id, provider, brand, bank, last4, holder_name, expiry_month, expiry_year, is_default, criado_em',
    )
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cards: data ?? [] })
}
