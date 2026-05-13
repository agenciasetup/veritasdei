/**
 * /educa — dashboard principal do subproduto Veritas Educa.
 *
 * Server component:
 *   - exige login (redirect /login?next=/educa)
 *   - delega UI ao EducaDashboard (client), que reusa hooks de gamificação,
 *     estudo recente e o endpoint /api/verbum/research existentes.
 *
 * Pode ser acessado:
 *   - direto em /educa (no domínio principal)
 *   - como raiz em educa.veritasdei.com.br (no subdomínio, ver Fase 5)
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import EducaDashboard from './EducaDashboard'

export const dynamic = 'force-dynamic'

export default async function EducaPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/educa')
  }

  return <EducaDashboard />
}
