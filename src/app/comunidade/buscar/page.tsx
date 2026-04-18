import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import SearchView from '@/components/comunidade/SearchView'
import { getCommunityFlags } from '@/lib/community/config'

export const metadata = {
  title: 'Buscar · Comunidade Veritas',
  description: 'Buscar Veritas, pessoas e hashtags na comunidade.',
}

export default function SearchPage() {
  const flags = getCommunityFlags()
  if (!flags.communityEnabled) notFound()

  return (
    <Suspense fallback={null}>
      <SearchView />
    </Suspense>
  )
}
