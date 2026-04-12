/**
 * Queries de propósitos contra Supabase.
 *
 * Regras:
 * - Todas usam o browser client (o usuário é o dono pelas policies RLS).
 * - `checkIn` é idempotente (upsert por (proposito_id, feito_em)).
 * - `listWithLogs` devolve propósitos + logs recentes em uma ida só.
 * - `ensureSeed` cria propósitos sugeridos inativos na primeira chamada,
 *   resolvendo a falta de trigger sem tocar no `handle_new_user()` existente.
 */

import { createClient } from '@/lib/supabase/client'
import type { Proposito, PropositoLog, NotificacoesPrefs } from '@/types/propositos'
import { PROPOSITOS_SUGERIDOS } from '@/lib/propositos'

/* ─── Leitura ─────────────────────────────────────────────────────── */

export async function listPropositos(userId: string): Promise<Proposito[]> {
  const supabase = createClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_propositos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) {
    console.warn('[propositos] listPropositos', error.message)
    return []
  }
  return (data ?? []) as unknown as Proposito[]
}

export async function listLogsRecentes(
  userId: string,
  sinceDate: string,
): Promise<PropositoLog[]> {
  const supabase = createClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('user_propositos_log')
    .select('*')
    .eq('user_id', userId)
    .gte('feito_em', sinceDate)
    .order('feito_em', { ascending: false })
  if (error) {
    console.warn('[propositos] listLogsRecentes', error.message)
    return []
  }
  return (data ?? []) as unknown as PropositoLog[]
}

/* ─── Check-in ─────────────────────────────────────────────────────── */

export async function checkInProposito(
  propositoId: string,
  userId: string,
  feitoEm: string,
  observacao?: string,
): Promise<{ error: string | null }> {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase não configurado.' }

  const { error } = await supabase
    .from('user_propositos_log')
    .upsert(
      {
        proposito_id: propositoId,
        user_id: userId,
        feito_em: feitoEm,
        observacao: observacao ?? null,
      },
      { onConflict: 'proposito_id,feito_em' },
    )
  if (error) return { error: error.message }
  return { error: null }
}

export async function desfazerCheckIn(
  propositoId: string,
  feitoEm: string,
): Promise<{ error: string | null }> {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase não configurado.' }
  const { error } = await supabase
    .from('user_propositos_log')
    .delete()
    .eq('proposito_id', propositoId)
    .eq('feito_em', feitoEm)
  return { error: error?.message ?? null }
}

/* ─── CRUD ─────────────────────────────────────────────────────────── */

export type PropositoDraft = {
  tipo: string
  titulo: string
  descricao?: string | null
  cadencia: 'diaria' | 'semanal' | 'mensal' | 'dias_semana'
  meta_por_periodo: number
  dias_semana?: number[] | null
  horario_sugerido?: string | null
  ativo: boolean
}

export async function createProposito(
  userId: string,
  draft: PropositoDraft,
): Promise<{ id: string | null; error: string | null }> {
  const supabase = createClient()
  if (!supabase) return { id: null, error: 'Supabase não configurado.' }
  const { data, error } = await supabase
    .from('user_propositos')
    .insert({
      user_id: userId,
      tipo: draft.tipo,
      titulo: draft.titulo,
      descricao: draft.descricao ?? null,
      cadencia: draft.cadencia,
      meta_por_periodo: draft.meta_por_periodo,
      dias_semana: draft.dias_semana ?? null,
      horario_sugerido: draft.horario_sugerido ?? null,
      ativo: draft.ativo,
    })
    .select('id')
    .single()
  if (error) return { id: null, error: error.message }
  return { id: (data as { id: string }).id, error: null }
}

export async function updateProposito(
  propositoId: string,
  patch: Partial<PropositoDraft>,
): Promise<{ error: string | null }> {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase não configurado.' }
  const { error } = await supabase
    .from('user_propositos')
    .update(patch)
    .eq('id', propositoId)
  return { error: error?.message ?? null }
}

export async function deleteProposito(
  propositoId: string,
): Promise<{ error: string | null }> {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase não configurado.' }
  const { error } = await supabase
    .from('user_propositos')
    .delete()
    .eq('id', propositoId)
  return { error: error?.message ?? null }
}

/* ─── Seed lazy ───────────────────────────────────────────────────── */

/**
 * Se o usuário não tem nenhum propósito, cria os sugeridos como **inativos**.
 * Assim a home não fica vazia e o usuário ativa depois no perfil.
 * Chame uma única vez (o PropositosContext faz isso na montagem).
 */
export async function ensureSeedPropositos(userId: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) return

  const { count, error: countError } = await supabase
    .from('user_propositos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError || (count ?? 0) > 0) return

  const rows = PROPOSITOS_SUGERIDOS.map(p => ({
    user_id: userId,
    tipo: p.tipo,
    titulo: p.titulo,
    descricao: p.descricao,
    cadencia: p.cadencia,
    meta_por_periodo: p.meta_por_periodo,
    horario_sugerido: p.horario_sugerido,
    ativo: false, // inativos até o usuário confirmar
  }))

  const { error } = await supabase.from('user_propositos').insert(rows)
  if (error) console.warn('[propositos] ensureSeedPropositos', error.message)
}

/* ─── Notificações prefs ───────────────────────────────────────────── */

export async function getNotifPrefs(userId: string): Promise<NotificacoesPrefs | null> {
  const supabase = createClient()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_notificacoes_prefs')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.warn('[propositos] getNotifPrefs', error.message)
    return null
  }
  return (data as unknown as NotificacoesPrefs) ?? null
}

export async function upsertNotifPrefs(
  userId: string,
  patch: Partial<Omit<NotificacoesPrefs, 'user_id' | 'atualizado_em'>>,
): Promise<{ error: string | null }> {
  const supabase = createClient()
  if (!supabase) return { error: 'Supabase não configurado.' }
  const { error } = await supabase
    .from('user_notificacoes_prefs')
    .upsert(
      {
        user_id: userId,
        ...patch,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
  return { error: error?.message ?? null }
}
