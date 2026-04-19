'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuthUser } from '@/lib/auth/require-auth'
import { notifySystemAdmins, createNotification } from '@/lib/paroquia/notifications'

const submitSchema = z.object({
  paroquiaId: z.string().uuid(),
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  relacao: z.string().trim().max(120).optional().nullable(),
  roleSolicitada: z.enum(['admin', 'moderator']),
  mensagem: z.string().trim().max(2000).optional().nullable(),
  documentoPath: z.string().trim().max(500).optional().nullable(),
})

export type SubmitClaimInput = z.infer<typeof submitSchema>

export async function submitClaim(
  input: SubmitClaimInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = submitSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Dados inválidos.' }
  }
  const data = parsed.data

  const userId = await requireAuthUser()
  if (!userId) return { ok: false, error: 'Você precisa estar logado.' }

  const supabase = await createServerSupabaseClient()

  // Verifica que a igreja existe e está aprovada
  const { data: paroquia } = await supabase
    .from('paroquias')
    .select('id, nome, status')
    .eq('id', data.paroquiaId)
    .maybeSingle<{ id: string; nome: string; status: string }>()
  if (!paroquia) return { ok: false, error: 'Igreja não encontrada.' }
  if (paroquia.status !== 'aprovada') {
    return { ok: false, error: 'Esta igreja ainda está em aprovação.' }
  }

  // Já é membro ativo?
  const { data: existingMember } = await supabase
    .from('paroquia_members')
    .select('id, role')
    .eq('paroquia_id', data.paroquiaId)
    .eq('user_id', userId)
    .is('revoked_at', null)
    .maybeSingle<{ id: string; role: string }>()
  if (existingMember) {
    return { ok: false, error: `Você já é ${existingMember.role === 'admin' ? 'administrador' : 'moderador'} desta igreja.` }
  }

  // Já tem claim pendente?
  const { data: existingClaim } = await supabase
    .from('paroquia_claims')
    .select('id')
    .eq('paroquia_id', data.paroquiaId)
    .eq('user_id', userId)
    .eq('status', 'pendente')
    .maybeSingle<{ id: string }>()
  if (existingClaim) {
    return { ok: false, error: 'Você já tem uma reivindicação pendente para esta igreja.' }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('paroquia_claims')
    .insert({
      paroquia_id: data.paroquiaId,
      user_id: userId,
      nome_solicitante: data.nome,
      email_solicitante: data.email,
      whatsapp: data.whatsapp || null,
      relacao: data.relacao || null,
      role_solicitada: data.roleSolicitada,
      mensagem: data.mensagem || null,
      documento_path: data.documentoPath || null,
      status: 'pendente',
    })
    .select('id')
    .single<{ id: string }>()

  if (insertError || !inserted) {
    return { ok: false, error: insertError?.message ?? 'Erro ao enviar reivindicação.' }
  }

  // Notifica o solicitante
  await createNotification({
    userId,
    type: 'claim_received',
    title: 'Reivindicação enviada',
    body: `Sua reivindicação para "${paroquia.nome}" foi registrada. Assim que for revisada você será avisado.`,
    link: `/conta/minhas-igrejas`,
    meta: { paroquia_id: paroquia.id, claim_id: inserted.id },
  })

  // Notifica system-admins
  await notifySystemAdmins({
    type: 'claim_received',
    title: 'Nova reivindicação de igreja',
    body: `${data.nome} solicitou ser ${data.roleSolicitada === 'admin' ? 'administrador' : 'moderador'} de "${paroquia.nome}".`,
    link: '/admin/aprovacoes',
    meta: { paroquia_id: paroquia.id, claim_id: inserted.id, user_id: userId },
  })

  revalidatePath(`/paroquias/${paroquia.id}`)
  return { ok: true, id: inserted.id }
}

const decisionSchema = z.object({
  claimId: z.string().uuid(),
  action: z.enum(['aprovar', 'rejeitar']),
  adminNotas: z.string().trim().max(2000).optional().nullable(),
})

/**
 * Admin (sistema ou da igreja) aprova ou rejeita um claim.
 * - Aprovar: cria paroquia_members com a role solicitada; se primeiro admin
 *   e igreja ainda não verificada, marca verificado=true.
 * - Rejeitar: atualiza status + notas.
 * Em ambos: notifica solicitante e registra em admin_audit_log.
 */
export async function decideClaim(
  input: z.infer<typeof decisionSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = decisionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Input inválido.' }
  const { claimId, action, adminNotas } = parsed.data

  const userId = await requireAuthUser()
  if (!userId) return { ok: false, error: 'Não autenticado.' }

  const supabase = await createServerSupabaseClient()
  const admin = createAdminClient()

  const { data: claim } = await supabase
    .from('paroquia_claims')
    .select('*, paroquia:paroquias(id, nome, verificado)')
    .eq('id', claimId)
    .maybeSingle<{
      id: string
      paroquia_id: string
      user_id: string | null
      nome_solicitante: string
      email_solicitante: string
      role_solicitada: 'admin' | 'moderator'
      status: string
      paroquia: { id: string; nome: string; verificado: boolean } | null
    }>()

  if (!claim) return { ok: false, error: 'Reivindicação não encontrada.' }
  if (claim.status !== 'pendente') {
    return { ok: false, error: 'Esta reivindicação já foi processada.' }
  }
  if (!claim.paroquia) return { ok: false, error: 'Paróquia do claim não encontrada.' }

  // Autorização: precisa ser system-admin OU admin da igreja alvo.
  // A policy RLS já filtra, mas validamos explicitamente pra dar msg melhor.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle<{ role: string }>()
  const isSystemAdmin = profile?.role === 'admin'

  const { data: churchAdmin } = await supabase
    .from('paroquia_members')
    .select('id')
    .eq('paroquia_id', claim.paroquia_id)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .is('revoked_at', null)
    .maybeSingle<{ id: string }>()
  const isChurchAdmin = !!churchAdmin

  if (!isSystemAdmin && !isChurchAdmin) {
    return { ok: false, error: 'Sem permissão para revisar esta reivindicação.' }
  }

  // Admin de igreja só pode aprovar claims de moderator (não promover outros admins)
  if (!isSystemAdmin && claim.role_solicitada !== 'moderator') {
    return {
      ok: false,
      error: 'Apenas administradores do sistema podem aprovar novos administradores.',
    }
  }

  if (action === 'aprovar') {
    if (!claim.user_id) {
      return { ok: false, error: 'Claim sem usuário vinculado (deve ser um claim feito por usuário logado).' }
    }

    // Cria membership (se não existe ativo)
    const { data: activeMember } = await admin
      .from('paroquia_members')
      .select('id, role')
      .eq('paroquia_id', claim.paroquia_id)
      .eq('user_id', claim.user_id)
      .is('revoked_at', null)
      .maybeSingle<{ id: string; role: string }>()

    if (!activeMember) {
      const { error: memberErr } = await admin.from('paroquia_members').insert({
        paroquia_id: claim.paroquia_id,
        user_id: claim.user_id,
        role: claim.role_solicitada,
        added_by: userId,
      })
      if (memberErr) return { ok: false, error: memberErr.message }
    }

    // Se este é o primeiro admin e a igreja não é verificada, verifica
    if (claim.role_solicitada === 'admin' && !claim.paroquia.verificado) {
      await admin
        .from('paroquias')
        .update({
          verificado: true,
          verificado_por: userId,
          verificado_em: new Date().toISOString(),
        })
        .eq('id', claim.paroquia_id)
    }

    await admin
      .from('paroquia_claims')
      .update({
        status: 'aprovado',
        admin_notas: adminNotas || null,
        revisado_por: userId,
        revisado_em: new Date().toISOString(),
      })
      .eq('id', claim.id)

    await createNotification({
      userId: claim.user_id,
      type: claim.role_solicitada === 'admin' ? 'added_as_admin' : 'added_as_moderator',
      title: 'Reivindicação aprovada',
      body: `Você agora é ${claim.role_solicitada === 'admin' ? 'administrador' : 'moderador'} de "${claim.paroquia.nome}".`,
      link: `/paroquias/${claim.paroquia.id}/gerenciar`,
      meta: { paroquia_id: claim.paroquia.id, claim_id: claim.id },
    })

    await admin.from('admin_audit_log').insert({
      actor_id: userId,
      action: 'paroquia.claim_approved',
      target: claim.paroquia.id,
      payload: {
        claim_id: claim.id,
        role: claim.role_solicitada,
        reviewer_type: isSystemAdmin ? 'system' : 'church_admin',
      },
    })
  } else {
    await admin
      .from('paroquia_claims')
      .update({
        status: 'rejeitado',
        admin_notas: adminNotas || null,
        revisado_por: userId,
        revisado_em: new Date().toISOString(),
      })
      .eq('id', claim.id)

    if (claim.user_id) {
      await createNotification({
        userId: claim.user_id,
        type: 'claim_rejected',
        title: 'Reivindicação recusada',
        body: `Sua reivindicação para "${claim.paroquia.nome}" foi recusada.${adminNotas ? ` Motivo: ${adminNotas}` : ''}`,
        link: `/paroquias/${claim.paroquia.id}`,
        meta: { paroquia_id: claim.paroquia.id, claim_id: claim.id },
      })
    }

    await admin.from('admin_audit_log').insert({
      actor_id: userId,
      action: 'paroquia.claim_rejected',
      target: claim.paroquia.id,
      payload: { claim_id: claim.id, notes: adminNotas },
    })
  }

  revalidatePath('/admin/aprovacoes')
  revalidatePath(`/paroquias/${claim.paroquia.id}`)
  revalidatePath(`/paroquias/${claim.paroquia.id}/gerenciar`)
  return { ok: true }
}
