'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ContentGroup {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  icon: string | null
  cover_url: string | null
  sort_order: number
  visible: boolean
}

export interface ContentTopic {
  id: string
  group_id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  icon: string | null
  cover_url: string | null
  sort_order: number
  visible: boolean
}

export interface ContentSubtopic {
  id: string
  topic_id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  cover_url: string | null
  sort_order: number
  visible: boolean
}

export interface ContentItem {
  id: string
  subtopic_id: string
  kind: string
  title: string | null
  body: string
  reference: string | null
  image_url: string | null
  sort_order: number
  visible: boolean
}

export function useContentGroup(groupSlug: string) {
  const [group, setGroup] = useState<ContentGroup | null>(null)
  const [topics, setTopics] = useState<ContentTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) { setLoading(false); return }

    async function load() {
      const { data: groupData } = await supabase!
        .from('content_groups')
        .select('*')
        .eq('slug', groupSlug)
        .eq('visible', true)
        .single()

      if (groupData) {
        setGroup(groupData as ContentGroup)
        const { data: topicsData } = await supabase!
          .from('content_topics')
          .select('*')
          .eq('group_id', (groupData as ContentGroup).id)
          .eq('visible', true)
          .order('sort_order')
        setTopics((topicsData as ContentTopic[]) ?? [])
      }
      setLoading(false)
    }
    load()
  }, [groupSlug])

  return { group, topics, loading }
}

export function useContentTopicSubtopics(topicId: string | null) {
  const [subtopics, setSubtopics] = useState<ContentSubtopic[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!topicId) { setSubtopics([]); return }
    const supabase = createClient()
    if (!supabase) return

    setLoading(true)
    async function load() {
      const { data } = await supabase!
        .from('content_subtopics')
        .select('*')
        .eq('topic_id', topicId!)
        .eq('visible', true)
        .order('sort_order')
      setSubtopics((data as ContentSubtopic[]) ?? [])
      setLoading(false)
    }
    load()
  }, [topicId])

  return { subtopics, loading }
}

export function useContentItems(subtopicId: string | null) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!subtopicId) { setItems([]); return }
    const supabase = createClient()
    if (!supabase) return

    setLoading(true)
    async function load() {
      const { data } = await supabase!
        .from('content_items')
        .select('*')
        .eq('subtopic_id', subtopicId!)
        .eq('visible', true)
        .order('sort_order')
      setItems((data as ContentItem[]) ?? [])
      setLoading(false)
    }
    load()
  }, [subtopicId])

  return { items, loading }
}

// Fetch all subtopics + items for a topic in one go (for single-subtopic topics)
export function useTopicFullContent(topicId: string | null) {
  const [subtopics, setSubtopics] = useState<(ContentSubtopic & { items: ContentItem[] })[]>([])
  const [loading, setLoading] = useState(false)

  const fetchContent = useCallback(async () => {
    if (!topicId) { setSubtopics([]); return }
    const supabase = createClient()
    if (!supabase) return

    setLoading(true)
    const { data: subs } = await supabase
      .from('content_subtopics')
      .select('*')
      .eq('topic_id', topicId)
      .eq('visible', true)
      .order('sort_order')

    if (!subs || subs.length === 0) {
      setSubtopics([])
      setLoading(false)
      return
    }

    const subIds = (subs as ContentSubtopic[]).map(s => s.id)
    const { data: allItems } = await supabase
      .from('content_items')
      .select('*')
      .in('subtopic_id', subIds)
      .eq('visible', true)
      .order('sort_order')

    const itemsBySubtopic: Record<string, ContentItem[]> = {}
    ;((allItems ?? []) as ContentItem[]).forEach((item) => {
      if (!itemsBySubtopic[item.subtopic_id]) itemsBySubtopic[item.subtopic_id] = []
      itemsBySubtopic[item.subtopic_id].push(item)
    })

    setSubtopics((subs as ContentSubtopic[]).map(s => ({ ...s, items: itemsBySubtopic[s.id] ?? [] })))
    setLoading(false)
  }, [topicId])

  useEffect(() => { fetchContent() }, [fetchContent])

  return { subtopics, loading }
}
