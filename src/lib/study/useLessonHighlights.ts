'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export type HighlightColor = 'gold' | 'wine' | 'sage' | 'sky' | 'plain'
export type HighlightVisibility = 'private' | 'group' | 'public'

export interface LessonHighlight {
  id: string
  user_id: string
  content_type: string
  content_ref: string
  item_id: string
  char_start: number
  char_end: number
  color: HighlightColor
  visibility: HighlightVisibility
  group_id: string | null
  note_id: string | null
  created_at: string
}

interface CreateArgs {
  itemId: string
  charStart: number
  charEnd: number
  color: HighlightColor
  visibility: HighlightVisibility
  groupId?: string | null
}

/**
 * Marcadores (highlights) visíveis no subtópico atual.
 * Filtrados por RLS:
 *  - próprios (qualquer visibility)
 *  - públicos (visibility='public')
 *  - de grupos dos quais o usuário é membro
 *
 * Indexado por item_id para o componente de renderização poder filtrar
 * sem percorrer toda a lista em cada item.
 */
export function useLessonHighlights(
  contentType: string | null,
  contentRef: string | null,
) {
  const { user } = useAuth()
  const [highlights, setHighlights] = useState<LessonHighlight[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(contentType && contentRef))

  const fetchHighlights = useCallback(async () => {
    if (!contentType || !contentRef) {
      setHighlights([])
      setLoading(false)
      return
    }
    setLoading(true)
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('user_lesson_highlights')
      .select(
        'id, user_id, content_type, content_ref, item_id, char_start, char_end, color, visibility, group_id, note_id, created_at',
      )
      .eq('content_type', contentType)
      .eq('content_ref', contentRef)
      .order('created_at', { ascending: true })

    setHighlights((data ?? []) as LessonHighlight[])
    setLoading(false)
  }, [contentType, contentRef])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHighlights()
  }, [fetchHighlights])

  const byItem = useMemo(() => {
    const map = new Map<string, LessonHighlight[]>()
    for (const h of highlights) {
      const arr = map.get(h.item_id)
      if (arr) arr.push(h)
      else map.set(h.item_id, [h])
    }
    return map
  }, [highlights])

  const create = useCallback(
    async (args: CreateArgs): Promise<LessonHighlight | null> => {
      if (!user?.id || !contentType || !contentRef) return null
      if (args.charEnd <= args.charStart) return null

      const supabase = createClient()
      if (!supabase) return null

      const payload = {
        user_id: user.id,
        content_type: contentType,
        content_ref: contentRef,
        item_id: args.itemId,
        char_start: args.charStart,
        char_end: args.charEnd,
        color: args.color,
        visibility: args.visibility,
        group_id: args.visibility === 'group' ? (args.groupId ?? null) : null,
      }
      const { data, error } = await supabase
        .from('user_lesson_highlights')
        .insert(payload)
        .select(
          'id, user_id, content_type, content_ref, item_id, char_start, char_end, color, visibility, group_id, note_id, created_at',
        )
        .single()

      if (error || !data) return null
      const created = data as LessonHighlight
      setHighlights((prev) => [...prev, created])
      return created
    },
    [user, contentType, contentRef],
  )

  const remove = useCallback(async (id: string) => {
    const supabase = createClient()
    if (!supabase) return
    const { error } = await supabase
      .from('user_lesson_highlights')
      .delete()
      .eq('id', id)
    if (!error) setHighlights((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const updateColor = useCallback(
    async (id: string, color: HighlightColor) => {
      const supabase = createClient()
      if (!supabase) return
      const { error } = await supabase
        .from('user_lesson_highlights')
        .update({ color })
        .eq('id', id)
      if (!error) {
        setHighlights((prev) =>
          prev.map((h) => (h.id === id ? { ...h, color } : h)),
        )
      }
    },
    [],
  )

  return {
    highlights,
    byItem,
    loading,
    create,
    remove,
    updateColor,
    refresh: fetchHighlights,
  }
}
