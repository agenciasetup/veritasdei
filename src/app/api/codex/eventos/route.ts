/**
 * /api/codex/eventos — emissão de eventos especiais do Códex (server-to-server).
 *
 * Rota INTERNA. Não deve ser chamada pelo browser — é o ponto por onde outras
 * features (modo debate, micro-eventos litúrgicos, etc.) registram contadores
 * que alimentam regras do tipo `contador`.
 *
 * Por que não é exposta ao cliente: incrementar um contador é um vetor de
 * fraude (qualquer um forjaria "debates_vencidos"). Por isso exige o segredo
 * compartilhado CRON_SECRET no header Authorization — mesmo padrão das outras
 * rotas internas do projeto. Condições verificáveis no banco
 * (grupo_estudo_tamanho, nota_contem_frase, subtópico…) NÃO passam por aqui:
 * têm trigger próprio.
 *
 * POST { user_id, chave, incremento?, modo? }
 *   modo: 'incrementar' (default) | 'definir'
 */
import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  user_id?: string
  chave?: string
  incremento?: number
  modo?: 'incrementar' | 'definir'
}

function bearerOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (token.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret))
}

export async function POST(req: Request) {
  if (!bearerOk(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { user_id, chave } = body
  if (!user_id || !chave) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('fn_registrar_evento_carta', {
    p_user_id: user_id,
    p_chave: chave,
    p_incremento: body.incremento ?? 1,
    p_modo: body.modo ?? 'incrementar',
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
