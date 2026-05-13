/**
 * /educa/estudo — hub consolidado de estudo do Veritas Educa.
 *
 * Server protege auth, client EducaEstudoView renderiza:
 *   - Continue de onde parou
 *   - Pilares com progresso
 *   - Provas recentes
 *   - Selos desbloqueados
 *   - Atalho pra Grupos de estudo
 *
 * Todos os links de "entrar num pilar/subtópico" vão pra /estudo/* —
 * essas rotas estão na whitelist do middleware educa e renderizam
 * com o EducaShell.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import EducaEstudoView from './EducaEstudoView'

export const dynamic = 'force-dynamic'

export default async function EducaEstudoPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/educa/estudo')
  }

  return <EducaEstudoView />
}
