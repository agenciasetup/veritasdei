'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuthUser } from '@/lib/auth/require-auth'
import { createNotification } from '@/lib/paroquia/notifications'

/** Retorna true se user é admin ativo da paróquia. */
async function assertChurchAdmin(paroquiaId: string, userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data: sysProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle<{ role: string }>()
  if (sysProfile?.role === 'admin') return true
  const { data: m } = await admin
    .from('paroquia_members')
    .select('id')
    .eq('paroquia_id', paroquiaId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .is('revoked_at', null)
    .maybeSingle<{ id: string }>()
  return !!m
}

// ─── Promover/Rebaixar ────────────────────────────────────────────────

const changeRoleSchema = z.object({
  memberId: z.string().uuid(),
  newRole: z.enum(['admin', 'moderator']),
})

export async function changeMemberRole(
  input: z.infer<typeof changeRoleSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = changeRoleSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Input inválido.' }

  const actor = await requireAuthUser()
  if (!actor) return { ok: false, error: 'Não autenticado.' }

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('paroquia_members')
    .select('id, paroquia_id, user_id, role, paroquia:paroquias(nome)')
    .eq('id', parsed.data.memberId)
    .maybeSingle<{
      id: string
      paroquia_id: string
      user_id: string
      role: 'admin' | 'moderator'
      paroquia: { nome: string } | null
    }>()
  if (!member) return { ok: false, error: 'Membro não encontrado.' }

  if (!(await assertChurchAdmin(member.paroquia_id, actor))) {
    return { ok: false, error: 'Sem permissão.' }
  }

  if (member.role === parsed.data.newRole) return { ok: true }

  const { error } = await admin
    .from('paroquia_members')
    .update({ role: parsed.data.newRole })
    .eq('id', member.id)

  if (error) return { ok: false, error: error.message }

  await createNotification({
    userId: member.user_id,
    type: 'role_changed',
    title: `Sua função foi alterada`,
    body: `Você agora é ${parsed.data.newRole === 'admin' ? 'administrador' : 'moderador'} de "${member.paroquia?.nome ?? 'uma igreja'}".`,
    link: `/paroquias/${member.paroquia_id}/gerenciar`,
    meta: { paroquia_id: member.paroquia_id, new_role: parsed.data.newRole },
  })

  revalidatePath(`/paroquias/${member.paroquia_id}/gerenciar`)
  return { ok: true }
}

// ─── Revogar (remove do time) ─────────────────────────────────────────

const revokeSchema = z.object({
  memberId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
})

export async function revokeMember(
  input: z.infer<typeof revokeSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = revokeSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Input inválido.' }

  const actor = await requireAuthUser()
  if (!actor) return { ok: false, error: 'Não autenticado.' }

  const admin = createAdminClient()
  const { data: member } = await admin
    .from('paroquia_members')
    .select('id, paroquia_id, user_id, role, paroquia:paroquias(nome)')
    .eq('id', parsed.data.memberId)
    .is('revoked_at', null)
    .maybeSingle<{
      id: string
      paroquia_id: string
      user_id: string
      role: 'admin' | 'moderator'
      paroquia: { nome: string } | null
    }>()
  if (!member) return { ok: false, error: 'Membro não encontrado ou já revogado.' }

  const isSelf = member.user_id === actor
  if (!isSelf && !(await assertChurchAdmin(member.paroquia_id, actor))) {
    return { ok: false, error: 'Sem permissão.' }
  }

  // O trigger paroquia_members_guard_last_admin faz a validação real;
  // aqui damos mensagem amigável antes do erro de DB.
  if (member.role === 'admin') {
    const { count } = await admin
      .from('paroquia_members')
      .select('id', { count: 'exact', head: true })
      .eq('paroquia_id', member.paroquia_id)
      .eq('role', 'admin')
      .is('revoked_at', null)
    if ((count ?? 0) <= 1) {
      return {
        ok: false,
        error: 'Esta igreja ficaria sem administrador. Promova outro membro antes de sair.',
      }
    }
  }

  const { error } = await admin
    .from('paroquia_members')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: actor,
      revoke_reason: parsed.data.reason || null,
    })
    .eq('id', member.id)

  if (error) return { ok: false, error: error.message }

  await admin.from('admin_audit_log').insert({
    actor_id: actor,
    action: isSelf ? 'paroquia.member_self_left' : 'paroquia.member_revoked',
    target: member.paroquia_id,
    payload: { member_id: member.id, user_id: member.user_id, role: member.role, reason: parsed.data.reason },
  })

  if (!isSelf) {
    await createNotification({
      userId: member.user_id,
      type: 'removed_from_team',
      title: 'Você foi removido da equipe',
      body: `Você não é mais ${member.role === 'admin' ? 'administrador' : 'moderador'} de "${member.paroquia?.nome ?? 'uma igreja'}".${parsed.data.reason ? ` Motivo: ${parsed.data.reason}` : ''}`,
      link: '/conta/minhas-igrejas',
      meta: { paroquia_id: member.paroquia_id },
    })
  }

  revalidatePath(`/paroquias/${member.paroquia_id}/gerenciar`)
  revalidatePath('/conta/minhas-igrejas')
  return { ok: true }
}

// ─── Adicionar por email ─────────────────────────────────────────────

const addByEmailSchema = z.object({
  paroquiaId: z.string().uuid(),
  email: z.string().trim().email(),
  role: z.enum(['admin', 'moderator']),
})

export async function addMemberByEmail(
  input: z.infer<typeof addByEmailSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = addByEmailSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Email inválido.' }

  const actor = await requireAuthUser()
  if (!actor) return { ok: false, error: 'Não autenticado.' }

  if (!(await assertChurchAdmin(parsed.data.paroquiaId, actor))) {
    return { ok: false, error: 'Sem permissão.' }
  }

  const admin = createAdminClient()

  // Busca usuário pelo email em profiles (match case-insensitive)
  const { data: user } = await admin
    .from('profiles')
    .select('id, name, email')
    .ilike('email', parsed.data.email)
    .maybeSingle<{ id: string; name: string | null; email: string | null }>()

  if (!user) {
    return {
      ok: false,
      error: 'Usuário com esse email não encontrado. Peça para ele criar uma conta primeiro.',
    }
  }

  // Já é membro ativo?
  const { data: existing } = await admin
    .from('paroquia_members')
    .select('id, role')
    .eq('paroquia_id', parsed.data.paroquiaId)
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .maybeSingle<{ id: string; role: string }>()
  if (existing) {
    return { ok: false, error: `Este usuário já é ${existing.role} desta igreja.` }
  }

  const { data: paroquia } = await admin
    .from('paroquias')
    .select('nome')
    .eq('id', parsed.data.paroquiaId)
    .maybeSingle<{ nome: string }>()

  const { error } = await admin.from('paroquia_members').insert({
    paroquia_id: parsed.data.paroquiaId,
    user_id: user.id,
    role: parsed.data.role,
    added_by: actor,
  })
  if (error) return { ok: false, error: error.message }

  await createNotification({
    userId: user.id,
    type: parsed.data.role === 'admin' ? 'added_as_admin' : 'added_as_moderator',
    title: 'Você foi adicionado a uma equipe',
    body: `Você agora é ${parsed.data.role === 'admin' ? 'administrador' : 'moderador'} de "${paroquia?.nome ?? 'uma igreja'}".`,
    link: `/paroquias/${parsed.data.paroquiaId}/gerenciar`,
    meta: { paroquia_id: parsed.data.paroquiaId, role: parsed.data.role },
  })

  revalidatePath(`/paroquias/${parsed.data.paroquiaId}/gerenciar`)
  return { ok: true }
}
