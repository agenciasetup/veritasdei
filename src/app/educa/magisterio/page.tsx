/**
 * /educa/magisterio — página dedicada de "Pergunte ao Magistério".
 *
 * O dashboard /educa só tem um botão de atalho discreto; a experiência
 * de busca + leitura completa do insight acontece aqui. Evita que a
 * resposta longa fique espremida num card do dashboard.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import MagisterioView from './MagisterioView'

export const dynamic = 'force-dynamic'

export default async function MagisterioPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/educa/magisterio')
  }
  return <MagisterioView />
}
