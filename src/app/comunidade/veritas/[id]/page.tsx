import { notFound } from 'next/navigation'
import ThreadView from '@/components/comunidade/ThreadView'
import { getCommunityFlags } from '@/lib/community/config'

interface Props {
  params: Promise<{ id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  return {
    title: 'Veritas · Comunidade',
    description: `Thread do Veritas ${id}`,
  }
}

export default async function VeritasThreadPage({ params }: Props) {
  const flags = getCommunityFlags()
  if (!flags.communityEnabled) notFound()

  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  return <ThreadView postId={id} />
}
