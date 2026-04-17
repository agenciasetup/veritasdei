import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { hasActivePremium } from '@/lib/payments/entitlements'
import { getCommunityFlags } from './config'

export type PremiumCommunityContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  user: User
}

export async function requireCommunitySession(): Promise<
  { ok: true; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; user: User }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  }

  return { ok: true, supabase, user }
}

export async function requireCommunityPremiumAccess(): Promise<
  { ok: true; context: PremiumCommunityContext }
  | { ok: false; response: NextResponse }
> {
  const flags = getCommunityFlags()
  if (!flags.communityEnabled) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'community_disabled' }, { status: 503 }),
    }
  }

  const session = await requireCommunitySession()
  if (!session.ok) return session

  const premium = await hasActivePremium(session.user.id)
  if (!premium) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'premium_required' }, { status: 403 }),
    }
  }

  return {
    ok: true,
    context: {
      supabase: session.supabase,
      user: session.user,
    },
  }
}
