import { createClient } from '@/lib/supabase/client'

let supabase: ReturnType<typeof createClient> | undefined

export interface VerbumComment {
  id: string
  flow_id: string
  user_id: string
  node_id: string | null
  edge_id: string | null
  content: string
  created_at: string
  updated_at: string
  // Joined from profiles
  user_name?: string | null
  user_avatar?: string | null
}

export async function getComments(
  flowId: string,
  target: { nodeId?: string; edgeId?: string }
): Promise<VerbumComment[]> {
  supabase ??= createClient()
  if (!supabase) return []

  let query = supabase
    .from('verbum_comments')
    .select('*, profiles:user_id(name, profile_image_url)')
    .eq('flow_id', flowId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (target.nodeId) {
    query = query.eq('node_id', target.nodeId)
  } else if (target.edgeId) {
    query = query.eq('edge_id', target.edgeId)
  }

  const { data, error } = await query
  if (error) {
    console.error('getComments error:', error)
    return []
  }

  return (data || []).map((c: Record<string, unknown>) => {
    const profile = c.profiles as Record<string, unknown> | null
    return {
      id: c.id as string,
      flow_id: c.flow_id as string,
      user_id: c.user_id as string,
      node_id: c.node_id as string | null,
      edge_id: c.edge_id as string | null,
      content: c.content as string,
      created_at: c.created_at as string,
      updated_at: c.updated_at as string,
      user_name: (profile?.name as string) || null,
      user_avatar: (profile?.profile_image_url as string) || null,
    } as VerbumComment
  })
}

export async function addComment(
  flowId: string,
  userId: string,
  content: string,
  target: { nodeId?: string; edgeId?: string }
): Promise<VerbumComment | null> {
  supabase ??= createClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('verbum_comments')
    .insert({
      flow_id: flowId,
      user_id: userId,
      node_id: target.nodeId || null,
      edge_id: target.edgeId || null,
      content,
    })
    .select('*, profiles:user_id(name, profile_image_url)')
    .single()

  if (error) {
    console.error('addComment error:', error)
    return null
  }

  const profile = (data as Record<string, unknown>).profiles as Record<string, unknown> | null
  return {
    ...(data as unknown as VerbumComment),
    user_name: (profile?.name as string) || null,
    user_avatar: (profile?.profile_image_url as string) || null,
  }
}

export async function updateComment(commentId: string, content: string): Promise<boolean> {
  supabase ??= createClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('verbum_comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) {
    console.error('updateComment error:', error)
    return false
  }
  return true
}

export async function deleteComment(commentId: string): Promise<boolean> {
  supabase ??= createClient()
  if (!supabase) return false

  const { error } = await supabase
    .from('verbum_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('deleteComment error:', error)
    return false
  }
  return true
}
