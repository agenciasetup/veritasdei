/**
 * GET  /api/admin/checkout-settings — retorna o singleton 'global'.
 * PATCH /api/admin/checkout-settings — atualiza colunas do singleton.
 *
 * RLS já gate-eia escrita (só admin), mas validamos no server pra dar
 * mensagem de erro melhor + sanitizar tipos.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function requireAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' as const, status: 401 }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile || profile.role !== 'admin') {
    return { error: 'forbidden' as const, status: 403 }
  }
  return { supabase }
}

function isHex(v: unknown): v is string {
  return typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)
}

const STRING_FIELDS = [
  'logo_url',
  'header_title',
  'header_subtitle',
  'footer_text',
] as const

const COLOR_FIELDS = [
  'primary_color',
  'accent_color',
  'background_color',
  'text_color',
] as const

const BOOL_FIELDS = ['allow_pix', 'allow_boleto', 'allow_credit_card'] as const

export async function GET() {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { data, error } = await gate.supabase
    .from('billing_checkout_settings')
    .select('*')
    .eq('id', 'global')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin()
  if ('error' in gate)
    return NextResponse.json({ error: gate.error }, { status: gate.status })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const patch: Record<string, unknown> = {}

  for (const f of STRING_FIELDS) {
    if (f in body) {
      const v = body[f]
      // logo_url aceita null/'' pra remover; demais string aceita string vazia.
      patch[f] = v === null || v === '' ? (f === 'logo_url' ? null : '') : String(v)
    }
  }

  for (const f of COLOR_FIELDS) {
    if (f in body) {
      const v = body[f]
      if (!isHex(v)) {
        return NextResponse.json(
          { error: `${f} precisa ser hex (#RRGGBB)` },
          { status: 400 },
        )
      }
      patch[f] = v
    }
  }

  for (const f of BOOL_FIELDS) {
    if (f in body) patch[f] = !!body[f]
  }

  if ('installments_max' in body) {
    const n = Number(body.installments_max)
    if (!Number.isInteger(n) || n < 1 || n > 12) {
      return NextResponse.json(
        { error: 'installments_max precisa ser entre 1 e 12' },
        { status: 400 },
      )
    }
    patch.installments_max = n
  }

  // order_bump / upsell: JSON livre (schema validado no admin UI).
  if ('order_bump' in body && typeof body.order_bump === 'object') {
    patch.order_bump = body.order_bump
  }
  if ('upsell' in body && typeof body.upsell === 'object') {
    patch.upsell = body.upsell
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nada a atualizar' }, { status: 400 })
  }

  patch.atualizado_em = new Date().toISOString()

  const { data, error } = await gate.supabase
    .from('billing_checkout_settings')
    .update(patch)
    .eq('id', 'global')
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data })
}
