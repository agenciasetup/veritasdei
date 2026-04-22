'use client'

import GracasFeed from '@/app/gracas/GracasFeed'

export default function GracasDoSantoSection({ santoId }: { santoId: string }) {
  return <GracasFeed santoId={santoId} />
}
