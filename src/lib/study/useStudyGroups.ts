'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface StudyGroup {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_by: string | null
  member_count: number
  created_at: string
  /** Papel do usuário atual neste grupo (populado em queries que já sabem o auth) */
  my_role?: 'owner' | 'member' | null
}

export interface StudyGroupMember {
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
  profile: {
    name: string | null
    public_handle: string | null
    profile_image_url: string | null
    community_role: string
    verified: boolean
  } | null
}

/**
 * Retorna todos os grupos dos quais o usuário é membro. Não lista grupos
 * aos quais ele ainda não pertence (descoberta é por convite — invite_code).
 */
export function useMyStudyGroups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(user))

  const userId = user?.id ?? null
  const fetch = useCallback(async () => {
    if (!userId) {
      setGroups([])
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    const { data: memberships } = await supabase
      .from('study_group_members')
      .select('group_id, role, joined_at')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    const rows = (memberships ?? []) as Array<{ group_id: string; role: 'owner' | 'member'; joined_at: string }>
    if (rows.length === 0) {
      setGroups([])
      setLoading(false)
      return
    }

    const ids = rows.map((r) => r.group_id)
    const { data: groupRows } = await supabase
      .from('study_groups')
      .select('id, name, description, invite_code, created_by, member_count, created_at')
      .in('id', ids)
      .order('created_at', { ascending: false })

    const roleById = new Map(rows.map((r) => [r.group_id, r.role]))
    const mapped: StudyGroup[] = ((groupRows ?? []) as StudyGroup[]).map((g) => ({
      ...g,
      my_role: roleById.get(g.id) ?? null,
    }))
    setGroups(mapped)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch()
  }, [fetch])

  async function createGroup(name: string, description?: string): Promise<StudyGroup | null> {
    if (!user?.id) return null
    const trimmed = name.trim()
    if (!trimmed) return null
    const supabase = createClient()
    if (!supabase) return null

    // Gera invite_code via função SQL; tenta algumas vezes se colidir (caso raro).
    let inviteCode: string | null = null
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.rpc('study_groups_gen_invite_code')
      if (typeof data === 'string' && data) {
        const { data: existing } = await supabase
          .from('study_groups')
          .select('id')
          .eq('invite_code', data)
          .maybeSingle()
        if (!existing) {
          inviteCode = data
          break
        }
      }
    }
    if (!inviteCode) return null

    const { data: created, error } = await supabase
      .from('study_groups')
      .insert({
        name: trimmed,
        description: description?.trim() || null,
        invite_code: inviteCode,
        created_by: user.id,
        member_count: 0,
      })
      .select()
      .single()
    if (error || !created) return null

    // Auto-inscreve o criador como owner.
    const { error: memberError } = await supabase.from('study_group_members').insert({
      group_id: (created as StudyGroup).id,
      user_id: user.id,
      role: 'owner',
    })
    if (memberError) {
      // Rollback best-effort.
      await supabase.from('study_groups').delete().eq('id', (created as StudyGroup).id)
      return null
    }

    await fetch()
    return { ...(created as StudyGroup), my_role: 'owner', member_count: 1 }
  }

  async function joinByCode(inviteCode: string): Promise<StudyGroup | null> {
    if (!user?.id) return null
    const code = inviteCode.trim().toUpperCase()
    if (code.length < 4) return null
    const supabase = createClient()
    if (!supabase) return null

    // RPC SECURITY DEFINER resolve invite_code → group_id e insere membership.
    // Idempotente: se já é membro, só retorna o grupo. A RLS de SELECT em
    // study_groups bloqueia non-members, então esse RPC é o único caminho.
    const { data, error } = await supabase.rpc('study_groups_join_by_code', { p_code: code })
    if (error || !data || !Array.isArray(data) || data.length === 0) return null

    const row = data[0] as StudyGroup & { my_role: 'owner' | 'member' }
    await fetch()
    return row
  }

  async function leaveGroup(groupId: string) {
    if (!user?.id) return
    const supabase = createClient()
    if (!supabase) return
    await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)
    await fetch()
  }

  return { groups, loading, createGroup, joinByCode, leaveGroup, refresh: fetch }
}

/**
 * Carrega membros de um grupo (com profile embutido). Usa 2 queries:
 * membership + profiles. Disponível para qualquer membro do grupo.
 */
export function useStudyGroupMembers(groupId: string | null) {
  const [members, setMembers] = useState<StudyGroupMember[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(groupId))

  const fetch = useCallback(async () => {
    if (!groupId) {
      setMembers([])
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data: rows } = await supabase
      .from('study_group_members')
      .select('user_id, role, joined_at')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    const membership = (rows ?? []) as Array<Omit<StudyGroupMember, 'profile'>>
    if (membership.length === 0) {
      setMembers([])
      setLoading(false)
      return
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, public_handle, profile_image_url, community_role, verified')
      .in('id', membership.map((m) => m.user_id))
    type ProfileRow = { id: string } & NonNullable<StudyGroupMember['profile']>
    const profileById = new Map<string, ProfileRow>()
    for (const p of (profiles ?? []) as ProfileRow[]) profileById.set(p.id, p)

    setMembers(
      membership.map((m) => ({
        ...m,
        profile: profileById.get(m.user_id)
          ? {
              name: profileById.get(m.user_id)!.name,
              public_handle: profileById.get(m.user_id)!.public_handle,
              profile_image_url: profileById.get(m.user_id)!.profile_image_url,
              community_role: profileById.get(m.user_id)!.community_role,
              verified: profileById.get(m.user_id)!.verified,
            }
          : null,
      })),
    )
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetch()
  }, [fetch])

  return { members, loading, refresh: fetch }
}
