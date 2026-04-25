import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type AdminRole = 'admin' | 'moderator'

export type AdminContext = {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  user: User
  role: AdminRole
  email: string | null
}

export async function requireAdmin(roles: AdminRole[] = ['admin', 'moderator']): Promise<
  { ok: true; ctx: AdminContext } | { ok: false; response: NextResponse }
> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }) }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('community_role')
    .eq('id', user.id)
    .maybeSingle()
  if (error) {
    return { ok: false, response: NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 }) }
  }
  const role = profile?.community_role as AdminRole | null | undefined
  if (!role || !roles.includes(role)) {
    return { ok: false, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  }

  return {
    ok: true,
    ctx: { supabase, user, role, email: user.email ?? null },
  }
}
