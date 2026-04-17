'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

interface TrendingHashtag {
  slug: string
  display: string
  usage_count: number
  recent_usage: number
  last_used_at: string | null
  score: number
}

export default function TrendingHashtags() {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([])
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/comunidade/tendencias?limit=8', { cache: 'no-store' })
        if (!res.ok) throw new Error()
        const data = (await res.json()) as { hashtags: TrendingHashtag[] }
        if (!cancelled) setHashtags(data.hashtags)
      } catch {
        if (!cancelled) setErrored(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [])

  if (errored || (!loading && hashtags.length === 0)) {
    return null
  }

  if (loading) return null

  return (
    <section className="mb-3">
      <div className="flex items-center gap-1.5 mb-2 px-0.5">
        <TrendingUp className="w-3 h-3" style={{ color: '#C9A84C' }} strokeWidth={1.75} />
        <h2
          className="text-[10px] uppercase tracking-[0.16em]"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          Em alta
        </h2>
      </div>
      <div
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {hashtags.map(h => (
          <Link
            key={h.slug}
            href={`/comunidade/hashtag/${h.slug}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] whitespace-nowrap"
            style={{
              background: 'transparent',
              border: '1px solid rgba(201,168,76,0.22)',
              color: '#D9C077',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <span>#{h.display}</span>
            {h.recent_usage > 0 && (
              <span className="text-[10px]" style={{ color: '#8A8378' }}>
                {h.recent_usage}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
