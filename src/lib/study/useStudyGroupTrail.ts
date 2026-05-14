'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface StudyGroupPick {
  subtopic_id: string
  subtopic_slug: string
  title: string
  subtitle: string | null
  cover_url: string | null
  topic_id: string
  topic_title: string
  topic_slug: string
  pillar_slug: string
  pillar_title: string
  note: string | null
  sort_order: number
  added_at: string
  studied_by_me: boolean
}

/**
 * Hook da trilha curada do grupo. Lista é carregada por todo membro; mutações
 * (add/remove/reorder) são autorizadas no banco apenas para o dono via RPC.
 */
export function useStudyGroupTrail(groupId: string | null) {
  const [picks, setPicks] = useState<StudyGroupPick[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(groupId))
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!groupId) {
      setPicks([])
      setLoading(false)
      return
    }
    const supabase = createClient()
    if (!supabase) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase.rpc('study_group_picks_list', {
      p_group_id: groupId,
    })
    if (err) {
      setError(err.message)
      setPicks([])
    } else {
      setPicks((data ?? []) as StudyGroupPick[])
    }
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function add(subtopicId: string, note?: string): Promise<boolean> {
    if (!groupId) return false
    const supabase = createClient()
    if (!supabase) return false
    const { error: err } = await supabase.rpc('study_group_picks_add', {
      p_group_id: groupId,
      p_subtopic_id: subtopicId,
      p_note: note ?? null,
    })
    if (err) {
      setError(err.message)
      return false
    }
    await load()
    return true
  }

  async function remove(subtopicId: string): Promise<boolean> {
    if (!groupId) return false
    const supabase = createClient()
    if (!supabase) return false
    const { error: err } = await supabase.rpc('study_group_picks_remove', {
      p_group_id: groupId,
      p_subtopic_id: subtopicId,
    })
    if (err) {
      setError(err.message)
      return false
    }
    await load()
    return true
  }

  async function reorder(order: string[]): Promise<boolean> {
    if (!groupId) return false
    const supabase = createClient()
    if (!supabase) return false
    const { error: err } = await supabase.rpc('study_group_picks_reorder', {
      p_group_id: groupId,
      p_order: order,
    })
    if (err) {
      setError(err.message)
      return false
    }
    await load()
    return true
  }

  return { picks, loading, error, refresh: load, add, remove, reorder }
}

export interface StudyGroupPact {
  goal_subtopics: number
  motto: string | null
  scripture: string | null
  weekly_subtopics_done: number
  active_members: number
  week_start: string
}

export function useStudyGroupPact(groupId: string | null) {
  const [pact, setPact] = useState<StudyGroupPact | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(groupId))

  const load = useCallback(async () => {
    if (!groupId) {
      setPact(null)
      setLoading(false)
      return
    }
    const supabase = createClient()
    if (!supabase) return
    setLoading(true)
    const { data } = await supabase.rpc('study_group_pact_get', {
      p_group_id: groupId,
    })
    const rows = (data ?? []) as Array<{
      goal_subtopics: number
      motto: string | null
      scripture: string | null
      weekly_subtopics_done: number | string
      active_members: number | string
      week_start: string
    }>
    if (rows.length === 0) {
      setPact(null)
    } else {
      const row = rows[0]
      setPact({
        goal_subtopics: row.goal_subtopics,
        motto: row.motto,
        scripture: row.scripture,
        weekly_subtopics_done: Number(row.weekly_subtopics_done) || 0,
        active_members: Number(row.active_members) || 0,
        week_start: row.week_start,
      })
    }
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function upsert(args: {
    goal_subtopics: number
    motto?: string | null
    scripture?: string | null
  }): Promise<boolean> {
    if (!groupId) return false
    const supabase = createClient()
    if (!supabase) return false
    const { error } = await supabase.rpc('study_group_pact_upsert', {
      p_group_id: groupId,
      p_goal_subtopics: args.goal_subtopics,
      p_motto: args.motto ?? null,
      p_scripture: args.scripture ?? null,
    })
    if (error) return false
    await load()
    return true
  }

  return { pact, loading, refresh: load, upsert }
}
