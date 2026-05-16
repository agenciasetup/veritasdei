import { createServerSupabaseClient } from '@/lib/supabase/server'
import { RosarioPageClient } from '@/features/rosario/components/RosarioPageClient'
import { loadActiveSkin } from '@/features/rosario/skins/loadActiveSkin'

export const metadata = {
  title: 'Santo Rosário — Veritas Dei',
  description:
    'Reze o Santo Rosário interativo meditando os mistérios da vida de Cristo com Nossa Senhora.',
}

export const dynamic = 'force-dynamic'

export default async function RosarioPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const activeSkin = await loadActiveSkin(supabase, user?.id ?? null)
  return <RosarioPageClient activeSkin={activeSkin} />
}
