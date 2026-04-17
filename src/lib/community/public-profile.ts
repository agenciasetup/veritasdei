import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PublicProfileSnapshot } from './types'

export async function getPublicProfileSnapshot(identifier: string): Promise<PublicProfileSnapshot | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.rpc('get_public_profile_snapshot', {
    identifier,
  })

  if (error) {
    console.warn('[community] public profile snapshot error:', error.message)
    return null
  }

  const snapshot = data as PublicProfileSnapshot | null
  if (!snapshot?.profile) return null
  return snapshot
}
