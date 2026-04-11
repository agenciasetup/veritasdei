import { createClient } from '@/lib/supabase/client'
import { sanitizePostgrestFilter } from '@/lib/utils/sanitize'
import type { VerbumFlow, VerbumFlowShare, VerbumFlowFavorite } from '../types/verbum.types'

// Lazy-init: deferred from module import to prevent premature Supabase auth init.
// createClient() is a singleton — calling ??= just defers the FIRST creation.
let supabase: ReturnType<typeof createClient> | undefined

// ─── Flow CRUD ───

export async function createFlow(
  userId: string,
  name: string,
  description?: string
): Promise<VerbumFlow | null> {
  supabase ??= createClient()
  if (!supabase)return null

  const { data, error } = await supabase
    .from('verbum_flows')
    .insert({ user_id: userId, name, description: description || null })
    .select()
    .single()

  if (error) {
    console.error('createFlow error:', error)
    return null
  }
  return data as VerbumFlow
}

export async function getUserFlows(userId: string): Promise<VerbumFlow[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const { data, error } = await supabase
    .from('verbum_flows')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('getUserFlows error:', error)
    return []
  }
  return (data || []) as VerbumFlow[]
}

export async function getFlow(flowId: string): Promise<VerbumFlow | null> {
  supabase ??= createClient()
  if (!supabase)return null

  const { data, error } = await supabase
    .from('verbum_flows')
    .select('*')
    .eq('id', flowId)
    .single()

  if (error) return null
  return data as VerbumFlow
}

export async function updateFlow(
  flowId: string,
  updates: Partial<Pick<VerbumFlow, 'name' | 'description' | 'is_public' | 'node_count' | 'edge_count' | 'thumbnail_data'>>
): Promise<void> {
  supabase ??= createClient()
  if (!supabase)return

  await supabase
    .from('verbum_flows')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', flowId)
}

export async function deleteFlow(flowId: string): Promise<void> {
  supabase ??= createClient()
  if (!supabase)return

  await supabase.from('verbum_flows').delete().eq('id', flowId)
}

export async function duplicateFlow(flowId: string, userId: string, newName: string): Promise<VerbumFlow | null> {
  supabase ??= createClient()
  if (!supabase)return null

  // Get source flow
  const source = await getFlow(flowId)
  if (!source) return null

  // Create new flow
  const newFlow = await createFlow(userId, newName, source.description || undefined)
  if (!newFlow) return null

  // Copy nodes
  const { data: sourceNodes } = await supabase
    .from('verbum_nodes')
    .select('*')
    .eq('flow_id', flowId)

  if (sourceNodes && sourceNodes.length > 0) {
    const idMap: Record<string, string> = {}

    for (const node of sourceNodes) {
      const newId = crypto.randomUUID()
      idMap[node.id] = newId

      await supabase.from('verbum_nodes').insert({
        id: newId,
        user_id: userId,
        flow_id: newFlow.id,
        node_type: node.node_type,
        title: node.title,
        title_latin: node.title_latin,
        description: node.description,
        canonical_entity_id: node.canonical_entity_id,
        bible_book: node.bible_book,
        bible_chapter: node.bible_chapter,
        bible_verse: node.bible_verse,
        bible_reference: node.bible_reference,
        bible_text: node.bible_text,
        ccc_paragraph: node.ccc_paragraph,
        ccc_text: node.ccc_text,
        layer_id: node.layer_id,
        pos_x: node.pos_x,
        pos_y: node.pos_y,
        is_canonical: false,
        is_shared: false,
        sources: node.sources,
      })
    }

    // Copy edges with remapped IDs
    const { data: sourceEdges } = await supabase
      .from('verbum_edges')
      .select('*')
      .eq('flow_id', flowId)

    if (sourceEdges) {
      for (const edge of sourceEdges) {
        const newSource = idMap[edge.source_node_id]
        const newTarget = idMap[edge.target_node_id]
        if (newSource && newTarget) {
          await supabase.from('verbum_edges').insert({
            user_id: userId,
            flow_id: newFlow.id,
            source_node_id: newSource,
            target_node_id: newTarget,
            relation_type: edge.relation_type,
            magisterial_weight: edge.magisterial_weight,
            ai_explanation: edge.ai_explanation,
            ai_explanation_short: edge.ai_explanation_short,
            theological_name: edge.theological_name,
            sources: edge.sources,
            status: edge.status,
            is_auto_generated: false,
            is_shared: false,
          })
        }
      }
    }
  }

  // Update counts
  const nodeCount = sourceNodes?.length || 0
  const { count: edgeCount } = await supabase
    .from('verbum_edges')
    .select('*', { count: 'exact', head: true })
    .eq('flow_id', newFlow.id)

  await updateFlow(newFlow.id, { node_count: nodeCount, edge_count: edgeCount || 0 })

  // Increment clone count on source — use RPC for atomicity, log error if unavailable
  await supabase.rpc('increment_clone_count', { flow_id_param: flowId }).catch(() => {
    console.warn('increment_clone_count RPC unavailable, skipping')
  })

  return { ...newFlow, node_count: nodeCount, edge_count: edgeCount || 0 }
}

// ─── Public Gallery ───

export async function getPublicFlows(
  limit = 20,
  offset = 0,
  sortBy: 'recent' | 'popular' | 'nodes' = 'recent'
): Promise<{ flows: VerbumFlow[]; total: number }> {
  supabase ??= createClient()
  if (!supabase)return { flows: [], total: 0 }

  const orderCol = sortBy === 'recent' ? 'created_at' : sortBy === 'popular' ? 'clone_count' : 'node_count'

  const { count } = await supabase
    .from('verbum_flows')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)

  const { data, error } = await supabase
    .from('verbum_flows')
    .select('*')
    .eq('is_public', true)
    .order(orderCol, { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('getPublicFlows error:', error)
    return { flows: [], total: 0 }
  }

  return { flows: (data || []) as VerbumFlow[], total: count || 0 }
}

export async function searchPublicFlows(query: string, limit = 20): Promise<VerbumFlow[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const { data } = await supabase
    .from('verbum_flows')
    .select('*')
    .eq('is_public', true)
    .or(`name.ilike.%${sanitizePostgrestFilter(query)}%,description.ilike.%${sanitizePostgrestFilter(query)}%`)
    .order('clone_count', { ascending: false })
    .limit(limit)

  return (data || []) as VerbumFlow[]
}

// ─── Sharing ───

export async function shareFlow(
  flowId: string,
  sharedBy: string,
  email: string,
  permission: 'view' | 'edit' = 'view'
): Promise<VerbumFlowShare | null> {
  supabase ??= createClient()
  if (!supabase)return null

  // Try to find user by email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  // Direct insert — relies on UNIQUE(flow_id, shared_with_email) constraint
  const { data, error } = await supabase
    .from('verbum_flow_shares')
    .insert({
      flow_id: flowId,
      shared_by: sharedBy,
      shared_with_email: email.toLowerCase(),
      shared_with_user: profile?.id || null,
      permission,
      accepted: false,
    })
    .select()
    .single()

  if (error) {
    // Unique violation = already shared
    if (error.code === '23505') return null
    console.error('shareFlow error:', error)
    return null
  }
  return data as VerbumFlowShare
}

export async function getFlowShares(flowId: string): Promise<VerbumFlowShare[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const { data } = await supabase
    .from('verbum_flow_shares')
    .select('*')
    .eq('flow_id', flowId)
    .order('created_at', { ascending: false })

  return (data || []) as VerbumFlowShare[]
}

export async function getSharedWithMe(userId: string, email: string): Promise<(VerbumFlowShare & { flow?: VerbumFlow })[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const { data } = await supabase
    .from('verbum_flow_shares')
    .select('*, flow:verbum_flows(*)')
    .or(`shared_with_user.eq.${userId},shared_with_email.eq.${email}`)
    .order('created_at', { ascending: false })

  return (data || []) as (VerbumFlowShare & { flow?: VerbumFlow })[]
}

export async function acceptShare(shareId: string): Promise<void> {
  supabase ??= createClient()
  if (!supabase)return

  await supabase
    .from('verbum_flow_shares')
    .update({ accepted: true })
    .eq('id', shareId)
}

export async function revokeShare(shareId: string): Promise<void> {
  supabase ??= createClient()
  if (!supabase)return

  await supabase.from('verbum_flow_shares').delete().eq('id', shareId)
}

// ─── Favorites ───

export async function toggleFavorite(userId: string, flowId: string): Promise<boolean> {
  supabase ??= createClient()
  if (!supabase)return false

  // Try to insert first — UNIQUE(user_id, flow_id) prevents duplicates
  const { error } = await supabase
    .from('verbum_flow_favorites')
    .insert({ user_id: userId, flow_id: flowId })

  if (error) {
    // Unique violation means it exists — delete it (unfavorite)
    if (error.code === '23505') {
      await supabase
        .from('verbum_flow_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('flow_id', flowId)
      return false // unfavorited
    }
    console.error('toggleFavorite error:', error)
    return false
  }

  return true // favorited
}

export async function getUserFavorites(userId: string): Promise<string[]> {
  supabase ??= createClient()
  if (!supabase)return []

  const { data } = await supabase
    .from('verbum_flow_favorites')
    .select('flow_id')
    .eq('user_id', userId)

  return (data || []).map((d: { flow_id: string }) => d.flow_id)
}

// ─── Flow Nodes/Edges Persistence ───

export async function loadFlowNodes(flowId: string) {
  supabase ??= createClient()
  if (!supabase)return []

  const { data } = await supabase
    .from('verbum_nodes')
    .select('*')
    .eq('flow_id', flowId)
    .order('created_at')

  return data || []
}

export async function loadFlowEdges(flowId: string) {
  supabase ??= createClient()
  if (!supabase)return []

  const { data } = await supabase
    .from('verbum_edges')
    .select('*')
    .eq('flow_id', flowId)
    .neq('status', 'rejeitada')
    .order('created_at')

  return data || []
}

export async function saveFlowNode(
  flowId: string,
  userId: string,
  node: {
    id: string
    node_type: string
    title: string
    title_latin?: string | null
    description?: string | null
    bible_reference?: string | null
    bible_text?: string | null
    bible_book?: string | null
    layer_id: number
    pos_x: number
    pos_y: number
    is_canonical?: boolean
    canonical_entity_id?: string | null
  }
): Promise<void> {
  supabase ??= createClient()
  if (!supabase)return

  await supabase.from('verbum_nodes').upsert({
    id: node.id,
    user_id: userId,
    flow_id: flowId,
    node_type: node.node_type,
    title: node.title,
    title_latin: node.title_latin || null,
    description: node.description || null,
    bible_reference: node.bible_reference || null,
    bible_text: node.bible_text || null,
    bible_book: node.bible_book || null,
    layer_id: node.layer_id,
    pos_x: node.pos_x,
    pos_y: node.pos_y,
    is_canonical: node.is_canonical || false,
    canonical_entity_id: node.canonical_entity_id || null,
    is_shared: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
}

export async function saveFlowEdge(
  flowId: string,
  userId: string,
  edge: {
    id: string
    source_node_id: string
    target_node_id: string
    relation_type: string
    magisterial_weight?: number
    theological_name?: string | null
    ai_explanation_short?: string | null
    ai_explanation?: string | null
    sources?: unknown[]
    status?: string
    is_auto_generated?: boolean
  }
): Promise<void> {
  supabase ??= createClient()
  if (!supabase)return

  await supabase.from('verbum_edges').upsert({
    id: edge.id,
    user_id: userId,
    flow_id: flowId,
    source_node_id: edge.source_node_id,
    target_node_id: edge.target_node_id,
    relation_type: edge.relation_type,
    magisterial_weight: edge.magisterial_weight || 3,
    theological_name: edge.theological_name || null,
    ai_explanation_short: edge.ai_explanation_short || null,
    ai_explanation: edge.ai_explanation || null,
    sources: edge.sources || [],
    status: edge.status || 'proposta',
    is_auto_generated: edge.is_auto_generated || false,
    is_shared: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
}

export async function deleteFlowNode(nodeId: string): Promise<void> {
  supabase ??= createClient()
  if (!supabase)return
  await supabase.from('verbum_nodes').delete().eq('id', nodeId)
}

export async function deleteFlowEdge(edgeId: string): Promise<void> {
  supabase ??= createClient()
  if (!supabase)return
  await supabase.from('verbum_edges').delete().eq('id', edgeId)
}

export async function updateNodePosition(nodeId: string, posX: number, posY: number): Promise<void> {
  supabase ??= createClient()
  if (!supabase)return
  await supabase
    .from('verbum_nodes')
    .update({ pos_x: posX, pos_y: posY, updated_at: new Date().toISOString() })
    .eq('id', nodeId)
}
