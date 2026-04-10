'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface MapNode {
  slug: string
  title: string
  studied: number
  total: number
  topicCount: number
}

/**
 * Loads all content groups with topic counts and user progress
 * for the Knowledge Map visualization.
 */
export function useKnowledgeMap(userId: string | undefined) {
  const [nodes, setNodes] = useState<MapNode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      if (!supabase) {
        setLoading(false)
        return
      }

      try {
        const { data: groups } = await supabase
          .from('content_groups')
          .select('id, slug, title')
          .eq('visible', true)
          .order('sort_order')

        if (!groups || groups.length === 0) {
          setLoading(false)
          return
        }

        const { data: topics } = await supabase
          .from('content_topics')
          .select('id, group_id')

        const { data: subtopics } = await supabase
          .from('content_subtopics')
          .select('id, topic_id')

        // Build mappings
        const topicToGroup: Record<string, string> = {}
        const topicsPerGroup: Record<string, number> = {}
        ;(topics ?? []).forEach((t: { id: string; group_id: string }) => {
          topicToGroup[t.id] = t.group_id
          topicsPerGroup[t.group_id] = (topicsPerGroup[t.group_id] || 0) + 1
        })

        const subtopicsPerGroup: Record<string, number> = {}
        ;(subtopics ?? []).forEach((s: { id: string; topic_id: string }) => {
          const groupId = topicToGroup[s.topic_id]
          if (groupId) {
            subtopicsPerGroup[groupId] = (subtopicsPerGroup[groupId] || 0) + 1
          }
        })

        // Load user progress if logged in
        let studiedPerType: Record<string, number> = {}
        if (userId) {
          const { data: progress } = await supabase
            .from('user_content_progress')
            .select('content_type')
            .eq('user_id', userId)

          ;(progress ?? []).forEach((p: { content_type: string }) => {
            studiedPerType[p.content_type] = (studiedPerType[p.content_type] || 0) + 1
          })
        }

        const result: MapNode[] = groups
          .map((g: { id: string; slug: string; title: string }) => ({
            slug: g.slug,
            title: g.title,
            studied: studiedPerType[g.slug] || 0,
            total: subtopicsPerGroup[g.id] || 0,
            topicCount: topicsPerGroup[g.id] || 0,
          }))
          .filter((n: MapNode) => n.total > 0)

        setNodes(result)
      } catch {
        // Silently degrade
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  return { nodes, loading }
}
