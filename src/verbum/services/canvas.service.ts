import { createClient } from '@/lib/supabase/client'
import type { VerbumNode, VerbumEdge, VerbumUserCanvas } from '../types/verbum.types'

const supabase = createClient()

/**
 * Load all nodes for the current user (canonical + shared + personal).
 */
export async function loadNodes(userId: string): Promise<VerbumNode[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('verbum_nodes')
    .select('*')
    .or(`is_canonical.eq.true,user_id.eq.${userId}`)
    .order('created_at')

  if (error) {
    console.error('loadNodes error:', error)
    return []
  }
  return (data || []) as VerbumNode[]
}

/**
 * Load all edges for the current user.
 */
export async function loadEdges(userId: string): Promise<VerbumEdge[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('verbum_edges')
    .select('*')
    .or(`is_shared.eq.true,user_id.eq.${userId}`)
    .neq('status', 'rejeitada')
    .order('created_at')

  if (error) {
    console.error('loadEdges error:', error)
    return []
  }
  return (data || []) as VerbumEdge[]
}

/**
 * Insert a new node into the database.
 */
export async function insertNode(
  node: Omit<VerbumNode, 'id' | 'created_at' | 'updated_at' | 'embedding'>
): Promise<VerbumNode | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('verbum_nodes')
    .insert(node)
    .select()
    .single()

  if (error) {
    console.error('insertNode error:', error)
    return null
  }
  return data as VerbumNode
}

/**
 * Update node position after drag.
 */
export async function updateNodePosition(
  nodeId: string,
  pos_x: number,
  pos_y: number
): Promise<void> {
  if (!supabase) return

  await supabase
    .from('verbum_nodes')
    .update({ pos_x, pos_y, updated_at: new Date().toISOString() })
    .eq('id', nodeId)
}

/**
 * Load or create user canvas state.
 */
export async function loadCanvasState(userId: string): Promise<VerbumUserCanvas | null> {
  if (!supabase) return null

  const { data } = await supabase
    .from('verbum_user_canvas')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return data as VerbumUserCanvas | null
}

/**
 * Save user canvas state (viewport, layers, mode).
 */
export async function saveCanvasState(
  userId: string,
  state: Partial<Pick<VerbumUserCanvas, 'viewport_x' | 'viewport_y' | 'viewport_zoom' | 'visible_layers' | 'active_filter' | 'active_mode'>>
): Promise<void> {
  if (!supabase) return

  await supabase
    .from('verbum_user_canvas')
    .upsert(
      {
        user_id: userId,
        ...state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
}
