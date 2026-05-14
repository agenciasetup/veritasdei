/**
 * /educa/estudo — hub consolidado de estudo do Veritas Educa.
 *
 * Server protege auth e pré-carrega dados públicos cacheáveis
 * (banners ativos + pilares visíveis) pra eliminar o flash de loading
 * no client. Os hooks client-side seguem responsáveis pelos dados
 * por-usuário (progresso, notas, provas, selos).
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getActiveBanners, getPillars } from '@/lib/educa/server-data'
import EducaEstudoView from './EducaEstudoView'

// Auth depende de cookie — não cacheia a página inteira. Os dados
// públicos abaixo já são cacheados via `unstable_cache` no helper.
export const dynamic = 'force-dynamic'

export default async function EducaEstudoPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/educa/estudo')
  }

  // Paraleliza as duas leituras públicas — ambas vão pro cache do Next.
  const [banners, pillars] = await Promise.all([
    getActiveBanners(),
    getPillars(),
  ])

  return <EducaEstudoView initialBanners={banners} initialPillars={pillars} />
}
