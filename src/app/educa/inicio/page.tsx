/**
 * /educa/inicio — dashboard pessoal do Veritas Educa.
 *
 * Acesso só pra logado + assinante. O middleware já redireciona:
 *   - anônimo → /educa (landing)
 *   - logado sem assinar → /educa/checkout
 *
 * Este server component só confirma o auth (defesa em profundidade) e
 * renderiza a dashboard. A landing (/educa) é separada e sempre pública.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import EducaDashboard from '../EducaDashboard'

export const dynamic = 'force-dynamic'

export default async function EducaInicioPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/educa')
  }

  return <EducaDashboard />
}
