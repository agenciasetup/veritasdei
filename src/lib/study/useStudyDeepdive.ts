'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StudyDeepdive } from './types'

export function useStudyDeepdive(contentType: string | null, contentRef: string | null) {
  const [deepdive, setDeepdive] = useState<StudyDeepdive | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(contentType && contentRef))

  useEffect(() => {
    if (!contentType || !contentRef) {
      setDeepdive(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const supabase = createClient()
    supabase
      .from('content_deepdive')
      .select('id, content_type, content_ref, sections, sources, status, published_at')
      .eq('content_type', contentType)
      .eq('content_ref', contentRef)
      .eq('status', 'published')
      .maybeSingle()
      .then((res: { data: unknown; error: unknown }) => {
        if (cancelled) return
        setDeepdive(res.error ? null : ((res.data as StudyDeepdive | null) ?? null))
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [contentType, contentRef])

  return { deepdive, loading }
}
