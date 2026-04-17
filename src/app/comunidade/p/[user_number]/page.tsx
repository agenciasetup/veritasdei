import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import PublicProfileView from '@/components/comunidade/PublicProfileView'
import { getCommunityFlags } from '@/lib/community/config'
import { getPublicProfileSnapshot } from '@/lib/community/public-profile'

interface PageProps {
  params: Promise<{ user_number: string }>
}

function toAbsoluteUrl(path: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
  if (!appUrl) return path
  return `${appUrl}${path}`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { user_number } = await params
  const snapshot = await getPublicProfileSnapshot(user_number)

  if (!snapshot?.profile) {
    return {
      title: 'Perfil não encontrado — Veritas Dei',
    }
  }

  const title = `${snapshot.profile.name ?? 'Membro'} — Comunidade Veritas`
  const description = `Últimos Veritas públicos de ${snapshot.profile.name ?? 'membro da comunidade'}.`
  const canonicalPath = snapshot.profile.public_handle
    ? `/comunidade/@${snapshot.profile.public_handle}`
    : `/comunidade/p/${snapshot.profile.user_number ?? user_number}`

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

export default async function CommunityPublicNumberPage({ params }: PageProps) {
  const flags = getCommunityFlags()
  if (!flags.communityPublicProfiles) notFound()

  const { user_number } = await params
  if (!/^\d+$/.test(user_number)) {
    notFound()
  }

  const snapshot = await getPublicProfileSnapshot(user_number)
  if (!snapshot?.profile) {
    notFound()
  }

  if (snapshot.profile.public_handle) {
    redirect(`/comunidade/@${snapshot.profile.public_handle}`)
  }

  return <PublicProfileView snapshot={snapshot} />
}
