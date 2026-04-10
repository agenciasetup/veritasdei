import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const key = process.env.API_PLACES_NEW
  if (!key) {
    return NextResponse.json({ error: 'API key não configurada.' }, { status: 500 })
  }

  return NextResponse.json({ key })
}
