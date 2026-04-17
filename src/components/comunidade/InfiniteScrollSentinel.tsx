'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface Props {
  onVisible: () => void
  loading: boolean
  hasMore: boolean
  rootMargin?: string
}

/**
 * Div que dispara onVisible quando entra no viewport. Usado para infinite
 * scroll no feed/hashtag/thread. Se `hasMore` for false, não renderiza.
 */
export default function InfiniteScrollSentinel({
  onVisible,
  loading,
  hasMore,
  rootMargin = '400px 0px',
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasMore) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !loading) {
            onVisible()
          }
        }
      },
      { rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [onVisible, loading, hasMore, rootMargin])

  if (!hasMore) return null

  return (
    <div ref={ref} className="flex justify-center py-4">
      {loading && (
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#C9A84C' }} />
      )}
    </div>
  )
}
