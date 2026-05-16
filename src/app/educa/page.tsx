/**
 * /educa — dashboard pessoal do Veritas Educa (a "Início").
 *
 * Acesso só pra logado + assinante. O middleware redireciona:
 *   - anônimo → / (landing pública)
 *   - logado sem assinar → /educa/checkout
 *
 * A landing (sales) fica em / (raiz do subdomínio), renderizada por
 * src/app/page.tsx quando product=veritas-educa.
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
    redirect('/')
  }

  return <EducaDashboard />
}
