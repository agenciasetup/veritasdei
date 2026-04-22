import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getFestaInfoDoUsuario } from '@/lib/santos/festa'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ info: null })

  const info = await getFestaInfoDoUsuario(user.id)
  return NextResponse.json({ info })
}
