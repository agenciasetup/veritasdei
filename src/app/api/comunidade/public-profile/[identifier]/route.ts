import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCommunityFlags } from '@/lib/community/config'
import type { PublicProfileSnapshot } from '@/lib/community/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ identifier: string }> },
) {
  const flags = getCommunityFlags()
  if (!flags.communityPublicProfiles) {
    return NextResponse.json({ error: 'public_profiles_disabled' }, { status: 503 })
  }

  const { identifier } = await params
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .rpc('get_public_profile_snapshot', {
      identifier,
    })

  if (error) {
    return NextResponse.json({ error: 'snapshot_failed', detail: error.message }, { status: 500 })
  }

  const snapshot = data as PublicProfileSnapshot | null

  if (!snapshot?.profile) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(snapshot)
}
