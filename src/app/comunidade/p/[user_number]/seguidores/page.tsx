import { notFound } from 'next/navigation'
import RequirePremium from '@/components/payments/RequirePremium'
import FollowListClient from '@/components/comunidade/FollowListClient'
import { getCommunityFlags } from '@/lib/community/config'
import { getPublicProfileSnapshot } from '@/lib/community/public-profile'

interface Props {
  params: Promise<{ user_number: string }>
}

export default async function FollowersByNumberPage({ params }: Props) {
  const flags = getCommunityFlags()
  if (!flags.communityPublicProfiles) notFound()

  const { user_number } = await params
  if (!/^\d+$/.test(user_number)) notFound()

  const snapshot = await getPublicProfileSnapshot(user_number)
  if (!snapshot?.profile) notFound()

  return (
    <RequirePremium title="Seguidores" description="Comunidade Veritas">
      <FollowListClient
        userId={snapshot.profile.id}
        handle={snapshot.profile.public_handle}
        userNumber={snapshot.profile.user_number}
        type="followers"
        displayName={snapshot.profile.name ?? `#${snapshot.profile.user_number ?? ''}`}
      />
    </RequirePremium>
  )
}
