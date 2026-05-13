/**
 * /estudo/grupos/[id] — dashboard de um grupo de estudo.
 *
 * Server protege auth. O Drawer de membros antigo continua existindo no
 * /estudo/grupos (lista) — mas agora cada grupo tem uma página própria
 * com dashboard cheio (XP, ranking, feed de atividade).
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import GroupDashboard from './GroupDashboard'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export default async function GrupoDashboardPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/estudo/grupos/${id}`)
  }
  return <GroupDashboard groupId={id} />
}
