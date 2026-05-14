'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface StudyGroupPost {
  id: string
  user_id: string
  name: string | null
  profile_image_url: string | null
  public_handle: string | null
  body: string
  pinned: boolean
  created_at: string
  can_delete: boolean
}

/**
 * Mural de reflexões coletivas do grupo. Leitura/escrita por qualquer membro;
 * pin é restrito ao dono no banco (RPC valida).
 */
export function useStudyGroupPosts(groupId: string | null) {
  const [posts, setPosts] = useState<StudyGroupPost[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(groupId))

  const load = useCallback(async () => {
    if (!groupId) {
      setPosts([])
      setLoading(false)
      return
    }
    const supabase = createClient()
    if (!supabase) return
    setLoading(true)
    const { data } = await supabase.rpc('study_group_posts_list', {
      p_group_id: groupId,
      p_limit: 30,
    })
    setPosts((data ?? []) as StudyGroupPost[])
    setLoading(false)
  }, [groupId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function create(body: string): Promise<boolean> {
    if (!groupId) return false
    const supabase = createClient()
    if (!supabase) return false
    const { error } = await supabase.rpc('study_group_posts_create', {
      p_group_id: groupId,
      p_body: body,
    })
    if (error) return false
    await load()
    return true
  }

  async function remove(postId: string): Promise<boolean> {
    const supabase = createClient()
    if (!supabase) return false
    const { error } = await supabase.rpc('study_group_posts_delete', {
      p_post_id: postId,
    })
    if (error) return false
    await load()
    return true
  }

  async function togglePin(postId: string): Promise<boolean> {
    const supabase = createClient()
    if (!supabase) return false
    const { error } = await supabase.rpc('study_group_posts_toggle_pin', {
      p_post_id: postId,
    })
    if (error) return false
    await load()
    return true
  }

  return { posts, loading, refresh: load, create, remove, togglePin }
}
