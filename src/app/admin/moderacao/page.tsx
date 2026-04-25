import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminModerationShell from '@/components/admin/AdminModerationShell'

export const metadata = {
  title: 'Moderação · Admin VeritasDei',
  description: 'Painel consolidado de SOS, apelações, parental, LGPD e bans.',
}

export default async function AdminModeracaoPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/moderacao')

  const { data: profile } = await supabase
    .from('profiles')
    .select('community_role')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.community_role
  if (role !== 'admin' && role !== 'moderator') {
    redirect('/comunidade')
  }

  return <AdminModerationShell currentUserId={user.id} role={role} />
}
