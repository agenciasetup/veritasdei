import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { verifyTurnstile } from '@/lib/turnstile'
import { notifySystemAdmins } from '@/lib/paroquia/notifications'
import { stripCnpj, isValidCnpj } from '@/lib/utils/cnpj'

/**
 * Cadastro público de igreja (sem login).
 *
 * - Turnstile obrigatório em produção.
 * - Rate limit: 5 submissões por hora por IP.
 * - Insere paróquia com status='pendente' e SEM owner_user_id
 *   (fica órfã até alguém fazer claim).
 * - Log em public_submissions_log pra auditoria.
 * - Notifica system-admins.
 */

const TipoIgrejaEnum = z.enum([
  'capela', 'igreja', 'matriz', 'catedral', 'basilica', 'santuario',
])

const bodySchema = z.object({
  // Dados da igreja
  nome: z.string().trim().min(2).max(200),
  tipoIgreja: TipoIgrejaEnum,
  cnpj: z.string().trim().optional().nullable(),
  diocese: z.string().trim().max(200).optional().nullable(),
  padreResponsavel: z.string().trim().max(200).optional().nullable(),
  // Endereço
  cidade: z.string().trim().min(2).max(120),
  estado: z.string().trim().length(2),
  rua: z.string().trim().max(200).optional().nullable(),
  numero: z.string().trim().max(20).optional().nullable(),
  bairro: z.string().trim().max(120).optional().nullable(),
  cep: z.string().trim().max(20).optional().nullable(),
  // Contato da igreja
  telefone: z.string().trim().max(30).optional().nullable(),
  emailIgreja: z.string().trim().email().max(200).optional().nullable().or(z.literal('')),
  site: z.string().trim().url().max(300).optional().nullable().or(z.literal('')),
  // Quem está enviando (obrigatório pra follow-up)
  submitterName: z.string().trim().min(2).max(120),
  submitterEmail: z.string().trim().email().max(200),
  submitterWhatsapp: z.string().trim().max(30).optional().nullable(),
  // Anti-spam
  turnstileToken: z.string().min(1).optional().nullable(),
})

function getClientIp(req: NextRequest): string | null {
  // Vercel / proxies
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const xreal = req.headers.get('x-real-ip')
  if (xreal) return xreal.trim()
  return null
}

export async function POST(req: NextRequest) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', issues: parsed.error.issues },
      { status: 400 },
    )
  }
  const data = parsed.data

  const ip = getClientIp(req)

  // Rate limit por IP (ou global se IP não disponível)
  const rlKey = `paroquia:pub:${ip ?? 'unknown'}`
  if (!(await rateLimit(rlKey, 5, 60 * 60 * 1000))) {
    return NextResponse.json(
      { error: 'Muitas submissões recentes. Tente de novo em uma hora.' },
      { status: 429 },
    )
  }

  // Turnstile
  const turnstile = await verifyTurnstile(data.turnstileToken ?? null, ip)
  if (!turnstile.success) {
    return NextResponse.json(
      { error: 'Verificação anti-robô falhou. Recarregue a página e tente novamente.' },
      { status: 400 },
    )
  }

  // Validação extra: CNPJ (quando vier, precisa passar no mod-11)
  const cnpjDigits = data.cnpj ? stripCnpj(data.cnpj) : null
  if (cnpjDigits && !isValidCnpj(cnpjDigits)) {
    return NextResponse.json({ error: 'CNPJ inválido.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Checa CNPJ já cadastrado (índice único existe, mas devolver mensagem amigável)
  if (cnpjDigits) {
    const { data: existing } = await admin
      .from('paroquias')
      .select('id, nome, status')
      .eq('cnpj', cnpjDigits)
      .maybeSingle<{ id: string; nome: string; status: string }>()
    if (existing) {
      return NextResponse.json(
        {
          error: 'Já existe uma igreja cadastrada com esse CNPJ.',
          paroquia: { id: existing.id, nome: existing.nome, status: existing.status },
        },
        { status: 409 },
      )
    }
  }

  const endereco = [data.rua, data.numero, data.bairro].filter(Boolean).join(', ')

  const { data: inserted, error: insertError } = await admin
    .from('paroquias')
    .insert({
      nome: data.nome,
      cnpj: cnpjDigits || null,
      tipo_igreja: data.tipoIgreja,
      diocese: data.diocese || null,
      padre_responsavel: data.padreResponsavel || null,
      cidade: data.cidade,
      estado: data.estado.toUpperCase(),
      rua: data.rua || null,
      numero: data.numero || null,
      bairro: data.bairro || null,
      cep: data.cep || null,
      endereco: endereco || null,
      telefone: data.telefone || null,
      email: data.emailIgreja || null,
      site: data.site || null,
      pais: 'Brasil',
      status: 'pendente',
      // Sem owner — fica órfã até claim
      owner_user_id: null,
      criado_por: null,
    })
    .select('id, nome')
    .single()

  if (insertError || !inserted) {
    console.error('[paroquias/publico] insert error:', insertError)
    return NextResponse.json(
      { error: 'Erro ao salvar. Tente novamente em instantes.' },
      { status: 500 },
    )
  }

  // Log de auditoria
  await admin.from('public_submissions_log').insert({
    paroquia_id: inserted.id,
    submitter_email: data.submitterEmail,
    submitter_name: data.submitterName,
    submitter_whatsapp: data.submitterWhatsapp || null,
    ip: ip ?? null,
    user_agent: req.headers.get('user-agent'),
    turnstile_ok: turnstile.success,
  })

  // Notifica system-admins
  await notifySystemAdmins({
    type: 'paroquia_approved',
    title: 'Nova igreja aguardando aprovação',
    body: `${inserted.nome} — enviada por ${data.submitterName} (${data.submitterEmail}).`,
    link: '/admin/aprovacoes',
    meta: { paroquia_id: inserted.id, source: 'public_form' },
  })

  return NextResponse.json({ id: inserted.id, nome: inserted.nome }, { status: 201 })
}
