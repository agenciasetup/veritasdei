'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Loader2 } from 'lucide-react'

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

  return (
    <section
      className="rounded-2xl p-4 mb-6"
      style={{
        background: 'rgba(16,16,16,0.65)',
        border: '1px solid rgba(201,168,76,0.14)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4" style={{ color: '#C9A84C' }} />
        <h2
          className="text-xs uppercase tracking-[0.14em]"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          Em alta
        </h2>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#8A8378' }} />
          <span
            className="text-xs"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Carregando tendências...
          </span>
        </div>
      )}

      {!loading && hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((h, idx) => (
            <Link
              key={h.slug}
              href={`/comunidade/hashtag/${h.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
              style={{
                background: idx === 0
                  ? 'rgba(201,168,76,0.14)'
                  : 'rgba(16,16,16,0.75)',
                border: `1px solid ${idx === 0 ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.15)'}`,
                color: '#E3C265',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <span>#{h.display}</span>
              {h.recent_usage > 0 && (
                <span
                  className="text-[10px]"
                  style={{ color: '#8A8378' }}
                >
                  {h.recent_usage}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
