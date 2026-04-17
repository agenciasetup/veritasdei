import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PublicProfileView from '@/components/comunidade/PublicProfileView'
import { getCommunityFlags } from '@/lib/community/config'
import { getPublicProfileSnapshot } from '@/lib/community/public-profile'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ identifier: string }>
}

function toAbsoluteUrl(path: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!appUrl) return path
  return `${appUrl}${path}`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { identifier } = await params
  const handle = normalizeHandleFromParam(identifier)
  if (!handle) {
    return { title: 'Perfil da Comunidade — Veritas Dei' }
  }

  const snapshot = await getPublicProfileSnapshot(`@${handle}`)
  if (!snapshot?.profile) {
    return { title: 'Perfil não encontrado — Veritas Dei' }
  }

  const title = `${snapshot.profile.name ?? 'Membro'} (@${snapshot.profile.public_handle ?? 'perfil'}) — Comunidade Veritas`
  const description = `Últimos Veritas públicos de ${snapshot.profile.name ?? 'membro da comunidade'}.`
  const canonicalPath = snapshot.profile.public_handle
    ? `/comunidade/@${snapshot.profile.public_handle}`
    : snapshot.profile.user_number
      ? `/comunidade/p/${snapshot.profile.user_number}`
      : `/comunidade/${identifier}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: toAbsoluteUrl(canonicalPath),
      images: snapshot.profile.profile_image_url
        ? [{ url: snapshot.profile.profile_image_url }]
        : undefined,
    },
  }
}

// Aceita identifier em qualquer forma: "@handle", "%40handle", "handle".
// Retorna o handle normalizado (lowercased) sem o @.
function normalizeHandleFromParam(raw: string): string | null {
  let v = raw
  // Next.js pode ou não decodificar dynamic params — fazemos manualmente
  // pra cobrir ambos os casos.
  try {
    v = decodeURIComponent(v)
  } catch {
    // Param mal formado — deixa como veio.
  }
  v = v.trim()
  if (v.startsWith('@')) v = v.slice(1)
  v = v.toLowerCase()
  if (!/^[a-z0-9_]{3,20}$/.test(v)) return null
  return v
}

export default async function CommunityPublicHandlePage({ params }: PageProps) {
  const flags = getCommunityFlags()
  if (!flags.communityPublicProfiles) notFound()

  const { identifier } = await params
  const handle = normalizeHandleFromParam(identifier)
  if (!handle) {
    notFound()
  }

  const snapshot = await getPublicProfileSnapshot(`@${handle}`)
  if (!snapshot?.profile) {
    notFound()
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <PublicProfileView snapshot={snapshot} viewerUserId={user?.id ?? null} />
}
