/**
 * /educa/trilhas — lista de trilhas do Veritas Educa.
 *
 * Server: protege auth. Renderiza o `TrilhasView` existente sem
 * modificação — ele já é client-only, carrega trilhas do Supabase e
 * gerencia lista↔detalhe via state interno (`openTrailId`).
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import TrilhasView from '@/features/trilhas/TrilhasView'

export const dynamic = 'force-dynamic'

export default async function EducaTrilhasPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/educa/trilhas')
  }

  return <TrilhasView />
}
