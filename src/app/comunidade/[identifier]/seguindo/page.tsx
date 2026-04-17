import { notFound } from 'next/navigation'
import RequirePremium from '@/components/payments/RequirePremium'
import FollowListClient from '@/components/comunidade/FollowListClient'
import { getCommunityFlags } from '@/lib/community/config'
import { getPublicProfileSnapshot } from '@/lib/community/public-profile'

interface Props {
  params: Promise<{ identifier: string }>
}

function normalizeHandle(raw: string): string | null {
  let v = raw
  try { v = decodeURIComponent(v) } catch { /* noop */ }
  v = v.trim()
  if (v.startsWith('@')) v = v.slice(1)
  v = v.toLowerCase()
  if (!/^[a-z0-9_]{3,20}$/.test(v)) return null
  return v
}

export async function generateMetadata({ params }: Props) {
  const { identifier } = await params
  return { title: `Seguindo · ${identifier}` }
}

export default async function FollowingPage({ params }: Props) {
  const flags = getCommunityFlags()
  if (!flags.communityPublicProfiles) notFound()

  const { identifier } = await params
  const handle = normalizeHandle(identifier)
  if (!handle) notFound()

  const snapshot = await getPublicProfileSnapshot(`@${handle}`)
  if (!snapshot?.profile) notFound()

  return (
    <RequirePremium title="Seguindo" description="Comunidade Veritas">
      <FollowListClient
        userId={snapshot.profile.id}
        handle={snapshot.profile.public_handle}
        userNumber={snapshot.profile.user_number}
        type="following"
        displayName={snapshot.profile.name ?? `@${snapshot.profile.public_handle ?? ''}`}
      />
    </RequirePremium>
  )
}
