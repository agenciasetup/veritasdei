'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export type NoteVisibility = 'private' | 'group' | 'public'

export interface StudyNoteAuthor {
  id: string
  name: string | null
  public_handle: string | null
  profile_image_url: string | null
  community_role: string
  verified: boolean
}

export interface StudyNote {
  id: string
  user_id: string
  content_type: string
  content_ref: string
  body: string
  visibility: NoteVisibility
  group_id: string | null
  parent_note_id: string | null
  created_at: string
  updated_at: string
  author: StudyNoteAuthor | null
  /** Respostas diretas (1 nível). O servidor retorna threads completas
   * via mesma query; o cliente aninha. */
  replies: StudyNote[]
}

interface CreateArgs {
  body: string
  visibility: NoteVisibility
  groupId?: string | null
  parentNoteId?: string | null
}

/**
 * Anotações visíveis para o usuário num subtópico. Inclui:
 * - próprias (qualquer visibility)
 * - públicas (visibility='public')
 * - de grupos dos quais o usuário é membro
 *
 * A RLS do DB aplica os filtros acima; este hook só consome.
 * Replies são embutidas em `replies[]` da anotação raiz.
 */
export function useStudyNotes(contentType: string | null, contentRef: string | null) {
  const { user } = useAuth()
  const [notes, setNotes] = useState<StudyNote[]>([])
  const [loading, setLoading] = useState<boolean>(Boolean(user && contentType && contentRef))
  const [saving, setSaving] = useState(false)

  const fetchNotes = useCallback(async () => {
    if (!user?.id || !contentType || !contentRef) {
      setNotes([])
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
      .from('user_study_notes')
      .select(
        'id, user_id, content_type, content_ref, body, visibility, group_id, parent_note_id, created_at, updated_at',
      )
      .eq('content_type', contentType)
      .eq('content_ref', contentRef)
      .order('created_at', { ascending: false })

    const raw = (rows ?? []) as Array<Omit<StudyNote, 'author' | 'replies'>>

    // Fetch profiles para todos os autores em uma query.
    const authorIds = Array.from(new Set(raw.map((n) => n.user_id)))
    const profilesById = new Map<string, StudyNoteAuthor>()
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, public_handle, profile_image_url, community_role, verified')
        .in('id', authorIds)
      for (const p of (profiles ?? []) as StudyNoteAuthor[]) {
        profilesById.set(p.id, p)
      }
    }

    // Separa raízes e replies; aninha replies ordenadas ASC por data.
    const roots: StudyNote[] = []
    const repliesByParent = new Map<string, StudyNote[]>()
    for (const n of raw) {
      const enriched: StudyNote = {
        ...n,
        author: profilesById.get(n.user_id) ?? null,
        replies: [],
      }
      if (n.parent_note_id) {
        if (!repliesByParent.has(n.parent_note_id)) repliesByParent.set(n.parent_note_id, [])
        repliesByParent.get(n.parent_note_id)!.push(enriched)
      } else {
        roots.push(enriched)
      }
    }
    for (const root of roots) {
      const children = repliesByParent.get(root.id) ?? []
      // Ordem cronológica ascendente para replies.
      children.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      root.replies = children
    }
    setNotes(roots)
    setLoading(false)
  }, [user?.id, contentType, contentRef])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotes()
  }, [fetchNotes])

  async function create(args: CreateArgs) {
    if (!user?.id || !contentType || !contentRef) return null
    const trimmed = args.body.trim()
    if (!trimmed) return null
    setSaving(true)
    const supabase = createClient()
    if (!supabase) {
      setSaving(false)
      return null
    }

    const payload = {
      user_id: user.id,
      content_type: contentType,
      content_ref: contentRef,
      body: trimmed,
      visibility: args.visibility,
      group_id: args.visibility === 'group' ? (args.groupId ?? null) : null,
      parent_note_id: args.parentNoteId ?? null,
    }
    const { error } = await supabase.from('user_study_notes').insert(payload)
    setSaving(false)
    if (error) return null
    // Refetch para garantir enriquecimento com profile do autor.
    await fetchNotes()
    return true
  }

  async function update(id: string, body: string) {
    const trimmed = body.trim()
    if (!trimmed) return
    setSaving(true)
    const supabase = createClient()
    if (!supabase) {
      setSaving(false)
      return
    }
    const { error } = await supabase
      .from('user_study_notes')
      .update({ body: trimmed })
      .eq('id', id)
    setSaving(false)
    if (!error) await fetchNotes()
  }

  async function remove(id: string) {
    setSaving(true)
    const supabase = createClient()
    if (!supabase) {
      setSaving(false)
      return
    }
    const { error } = await supabase.from('user_study_notes').delete().eq('id', id)
    setSaving(false)
    if (!error) await fetchNotes()
  }

  async function setVisibility(
    id: string,
    visibility: NoteVisibility,
    groupId?: string | null,
  ) {
    setSaving(true)
    const supabase = createClient()
    if (!supabase) {
      setSaving(false)
      return
    }
    const { error } = await supabase
      .from('user_study_notes')
      .update({
        visibility,
        group_id: visibility === 'group' ? (groupId ?? null) : null,
      })
      .eq('id', id)
    setSaving(false)
    if (!error) await fetchNotes()
  }

  return { notes, loading, saving, create, update, remove, setVisibility, refresh: fetchNotes }
}
