import { notFound, redirect } from 'next/navigation'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import GerenciarClient from './GerenciarClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GerenciarParoquiaPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/paroquias/${id}/gerenciar`)}`)

  const { data: paroquia } = await supabase
    .from('paroquias')
    .select('id, nome, cidade, estado, foto_url, status, verificado, owner_user_id')
    .eq('id', id)
    .maybeSingle<{
      id: string
      nome: string
      cidade: string
      estado: string
      foto_url: string | null
      status: string
      verificado: boolean
      owner_user_id: string | null
    }>()
  if (!paroquia) notFound()

  const { data: myMembership } = await supabase
    .from('paroquia_members')
    .select('id, role, added_at')
    .eq('paroquia_id', id)
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .maybeSingle<{ id: string; role: 'admin' | 'moderator'; added_at: string }>()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle<{ role: string }>()
  const isSystemAdmin = profile?.role === 'admin'

  if (!myMembership && !isSystemAdmin) {
    redirect(`/paroquias/${id}`)
  }

  // Carrega equipe
  const { data: members } = await supabase
    .from('paroquia_members')
    .select('id, user_id, role, added_at, added_by')
    .eq('paroquia_id', id)
    .is('revoked_at', null)
    .order('role', { ascending: true })
    .order('added_at', { ascending: true })
    .returns<
      Array<{
        id: string
        user_id: string
        role: 'admin' | 'moderator'
        added_at: string
        added_by: string | null
      }>
    >()

  const memberIds = (members ?? []).map(m => m.user_id)
  const { data: memberProfiles } = memberIds.length
    ? await supabase
        .from('profiles')
        .select('id, name, email, profile_image_url, public_handle')
        .in('id', memberIds)
        .returns<
          Array<{
            id: string
            name: string | null
            email: string | null
            profile_image_url: string | null
            public_handle: string | null
          }>
        >()
    : { data: [] }
  const profilesById = new Map(
    (memberProfiles ?? []).map(p => [p.id, p]),
  )

  // Claims pendentes (só moderator — admin já é filtrado no actions)
  const { data: pendingClaims } = await supabase
    .from('paroquia_claims')
    .select('id, user_id, nome_solicitante, email_solicitante, whatsapp, relacao, role_solicitada, mensagem, documento_path, created_at')
    .eq('paroquia_id', id)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })
    .returns<
      Array<{
        id: string
        user_id: string | null
        nome_solicitante: string
        email_solicitante: string
        whatsapp: string | null
        relacao: string | null
        role_solicitada: 'admin' | 'moderator'
        mensagem: string | null
        documento_path: string | null
        created_at: string
      }>
    >()

  return (
    <GerenciarClient
      paroquia={paroquia}
      currentUserId={user.id}
      myRole={myMembership?.role ?? (isSystemAdmin ? 'admin' : 'moderator')}
      isSystemAdmin={isSystemAdmin}
      members={(members ?? []).map(m => ({
        ...m,
        profile: profilesById.get(m.user_id) ?? null,
      }))}
      pendingClaims={pendingClaims ?? []}
    />
  )
}
