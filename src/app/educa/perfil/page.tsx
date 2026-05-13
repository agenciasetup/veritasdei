/**
 * /educa/perfil — perfil mínimo do Veritas Educa.
 *
 * Server protege rota. Client compõe avatar + plano + XP/streak + sair.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import EducaProfile from './EducaProfile'

export const dynamic = 'force-dynamic'

export default async function EducaPerfilPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?next=/educa/perfil')
  }

  return <EducaProfile />
}
