'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface StudyNote {
  id: string
  user_id: string
  content_type: string
  content_ref: string
  body: string
  created_at: string
  updated_at: string
}

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
    const { data } = await supabase
      .from('user_study_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_ref', contentRef)
      .order('updated_at', { ascending: false })

    setNotes((data as StudyNote[]) || [])
    setLoading(false)
  }, [user?.id, contentType, contentRef])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  async function create(body: string) {
    if (!user?.id || !contentType || !contentRef) return
    const trimmed = body.trim()
    if (!trimmed) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_study_notes')
      .insert({
        user_id: user.id,
        content_type: contentType,
        content_ref: contentRef,
        body: trimmed,
      })
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setNotes((prev) => [data as StudyNote, ...prev])
    }
  }

  async function update(id: string, body: string) {
    const trimmed = body.trim()
    if (!trimmed) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('user_study_notes')
      .update({ body: trimmed })
      .eq('id', id)
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setNotes((prev) => prev.map((n) => (n.id === id ? (data as StudyNote) : n)))
    }
  }

  async function remove(id: string) {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('user_study_notes').delete().eq('id', id)
    setSaving(false)
    if (!error) {
      setNotes((prev) => prev.filter((n) => n.id !== id))
    }
  }

  return { notes, loading, saving, create, update, remove }
}
