import { notFound, redirect } from 'next/navigation'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import ClaimForm from './ClaimForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ClaimParoquiaPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/paroquias/${id}/claim`)}`)
  }

  const { data: paroquia } = await supabase
    .from('paroquias')
    .select('id, nome, cidade, estado, foto_url, status, verificado')
    .eq('id', id)
    .maybeSingle<{
      id: string
      nome: string
      cidade: string
      estado: string
      foto_url: string | null
      status: string
      verificado: boolean
    }>()

  if (!paroquia) notFound()
  if (paroquia.status !== 'aprovada') {
    redirect(`/paroquias/${id}?error=pendente`)
  }

  // Se já é membro ativo, manda direto pro painel
  const { data: membership } = await supabase
    .from('paroquia_members')
    .select('role')
    .eq('paroquia_id', id)
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .maybeSingle<{ role: string }>()
  if (membership) {
    redirect(`/paroquias/${id}/gerenciar`)
  }

  // Se há admin ativo, o claim é pra virar moderator; senão, primeiro admin.
  const { count: adminCount } = await supabase
    .from('paroquia_members')
    .select('id', { count: 'exact', head: true })
    .eq('paroquia_id', id)
    .eq('role', 'admin')
    .is('revoked_at', null)

  const isOrphan = (adminCount ?? 0) === 0

  // Claim pendente do mesmo user
  const { data: pendingClaim } = await supabase
    .from('paroquia_claims')
    .select('id, role_solicitada, created_at')
    .eq('paroquia_id', id)
    .eq('user_id', user.id)
    .eq('status', 'pendente')
    .maybeSingle<{ id: string; role_solicitada: string; created_at: string }>()

  // Prefill do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, whatsapp')
    .eq('id', user.id)
    .maybeSingle<{ name: string | null; email: string | null; whatsapp: string | null }>()

  return (
    <ClaimForm
      paroquia={paroquia}
      userId={user.id}
      isOrphan={isOrphan}
      pendingClaim={pendingClaim}
      prefill={{
        nome: profile?.name ?? '',
        email: profile?.email ?? user.email ?? '',
        whatsapp: profile?.whatsapp ?? '',
      }}
    />
  )
}
