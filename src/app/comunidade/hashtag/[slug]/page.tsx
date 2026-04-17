import { notFound } from 'next/navigation'
import RequirePremium from '@/components/payments/RequirePremium'
import HashtagFeedClient from '@/components/comunidade/HashtagFeedClient'
import { getCommunityFlags } from '@/lib/community/config'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return {
    title: `#${slug} · Comunidade Veritas`,
    description: `Todos os Veritas com a hashtag #${slug}`,
  }
}

export default async function HashtagPage({ params }: Props) {
  const flags = getCommunityFlags()
  if (!flags.communityEnabled) notFound()

  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug).toLowerCase().trim()

  if (!/^[a-z0-9_]{2,50}$/.test(slug)) {
    notFound()
  }

  return (
    <RequirePremium
      title={`#${slug}`}
      description="Acesse todos os Veritas com esta hashtag."
    >
      <HashtagFeedClient slug={slug} />
    </RequirePremium>
  )
}
