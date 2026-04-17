/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Loader2 } from 'lucide-react'
import CrossIcon from '@/components/icons/CrossIcon'
import VeritasCard from '@/components/comunidade/VeritasCard'
import { useAuth } from '@/contexts/AuthContext'
import type { VeritasPost } from '@/lib/community/types'

interface PersonResult {
  id: string
  name: string | null
  public_handle: string | null
  user_number: number | null
  profile_image_url: string | null
  cover_image_url: string | null
  bio_short: string | null
  community_role: string
  verified: boolean
  rank: number
}

interface HashtagResult {
  slug: string
  display: string
  usage_count: number
  last_used_at: string | null
  similarity: number
}

interface SearchResponse {
  query: string
  tab: string
  posts: VeritasPost[]
  people: PersonResult[]
  hashtags: HashtagResult[]
}

type Tab = 'top' | 'posts' | 'people' | 'hashtags'

const TAB_LABELS: Record<Tab, string> = {
  top: 'Top',
  posts: 'Veritas',
  people: 'Pessoas',
  hashtags: 'Hashtags',
}

export default function SearchView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const initialQuery = searchParams.get('q') ?? ''
  const initialTab = (searchParams.get('tab') as Tab) ?? 'top'

  const [inputValue, setInputValue] = useState(initialQuery)
  const [query, setQuery] = useState(initialQuery)
  const [tab, setTab] = useState<Tab>(initialTab)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ q: query, tab })
        const res = await fetch(`/api/comunidade/buscar?${params}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Falha na busca')
        const data = (await res.json()) as SearchResponse
        setResults(data)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError(e instanceof Error ? e.message : 'Erro na busca')
        }
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [query, tab])

  function submitInput() {
    const v = inputValue.trim()
    setQuery(v)
    const params = new URLSearchParams()
    if (v) params.set('q', v)
    if (tab !== 'top') params.set('tab', tab)
    router.replace(`/comunidade/buscar${params.toString() ? '?' + params : ''}`)
  }

  function switchTab(next: Tab) {
    setTab(next)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (next !== 'top') params.set('tab', next)
    router.replace(`/comunidade/buscar${params.toString() ? '?' + params : ''}`)
  }

  const viewerId = user?.id ?? null

  return (
    <main className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-3xl mx-auto relative z-10">
        <Link
          href="/comunidade"
          className="inline-flex items-center gap-2 mb-6 text-sm"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao feed
        </Link>

        <div
          className="rounded-2xl p-2 mb-4"
          style={{
            background: 'rgba(16,16,16,0.78)',
            border: '1px solid rgba(201,168,76,0.16)',
          }}
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 ml-2" style={{ color: '#8A8378' }} />
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submitInput()
              }}
              placeholder="Buscar Veritas, pessoas ou hashtags..."
              autoFocus
              className="flex-1 bg-transparent px-2 py-2 text-sm"
              style={{
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
                outline: 'none',
                border: 'none',
              }}
            />
            <button
              type="button"
              onClick={submitInput}
              className="px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em]"
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                color: '#0A0A0A',
                fontFamily: 'Cinzel, serif',
              }}
            >
              Buscar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          {(['top', 'posts', 'people', 'hashtags'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className="px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em] whitespace-nowrap"
              style={{
                background: tab === t ? 'rgba(201,168,76,0.14)' : 'rgba(16,16,16,0.65)',
                border: tab === t ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(201,168,76,0.12)',
                color: tab === t ? '#C9A84C' : '#8A8378',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="mb-4 rounded-xl p-3 text-sm"
            style={{
              background: 'rgba(107,29,42,0.12)',
              border: '1px solid rgba(217,79,92,0.35)',
              color: '#D94F5C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
          </div>
        )}

        {!loading && query.length >= 2 && results && (
          <div className="space-y-8">
            {(tab === 'top' || tab === 'hashtags') && results.hashtags.length > 0 && (
              <section>
                <h2
                  className="text-sm uppercase tracking-[0.12em] mb-3"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  Hashtags
                </h2>
                <div className="space-y-2">
                  {results.hashtags.map(h => (
                    <Link
                      key={h.slug}
                      href={`/comunidade/hashtag/${h.slug}`}
                      className="block rounded-xl p-3"
                      style={{
                        background: 'rgba(16,16,16,0.75)',
                        border: '1px solid rgba(201,168,76,0.14)',
                      }}
                    >
                      <p
                        className="text-base"
                        style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
                      >
                        #{h.display}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {h.usage_count} {h.usage_count === 1 ? 'Veritas' : 'Veritas'}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(tab === 'top' || tab === 'people') && results.people.length > 0 && (
              <section>
                <h2
                  className="text-sm uppercase tracking-[0.12em] mb-3"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  Pessoas
                </h2>
                <div className="space-y-2">
                  {results.people.map(p => {
                    const href = p.public_handle
                      ? `/comunidade/@${p.public_handle}`
                      : p.user_number
                        ? `/comunidade/p/${p.user_number}`
                        : '#'
                    return (
                      <Link
                        key={p.id}
                        href={href}
                        className="flex items-start gap-3 rounded-xl p-3"
                        style={{
                          background: 'rgba(16,16,16,0.75)',
                          border: '1px solid rgba(201,168,76,0.14)',
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
                          style={{
                            background: p.profile_image_url ? 'transparent' : 'rgba(201,168,76,0.1)',
                            border: '1px solid rgba(201,168,76,0.2)',
                          }}
                        >
                          {p.profile_image_url ? (
                            <img src={p.profile_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <CrossIcon size="sm" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium"
                            style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                          >
                            {p.name ?? 'Membro Veritas'}
                            {p.verified && (
                              <span
                                className="ml-2 text-xs"
                                style={{ color: '#C9A84C' }}
                              >
                                ✓
                              </span>
                            )}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                          >
                            {p.public_handle ? `@${p.public_handle}` : `#${p.user_number ?? 'sem-número'}`}
                            {p.community_role && p.community_role !== 'leigo' && ` · ${p.community_role}`}
                          </p>
                          {p.bio_short && (
                            <p
                              className="text-xs mt-1"
                              style={{ color: '#B8B0A2', fontFamily: 'Poppins, sans-serif' }}
                            >
                              {p.bio_short}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {(tab === 'top' || tab === 'posts') && results.posts.length > 0 && (
              <section>
                <h2
                  className="text-sm uppercase tracking-[0.12em] mb-3"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  Veritas
                </h2>
                <div className="space-y-4">
                  {results.posts.map(post => (
                    <VeritasCard
                      key={post.id}
                      post={post}
                      viewerUserId={viewerId}
                      hideInlineReply
                    />
                  ))}
                </div>
              </section>
            )}

            {results.hashtags.length === 0 && results.people.length === 0 && results.posts.length === 0 && (
              <div
                className="rounded-2xl p-8 text-center"
                style={{
                  background: 'rgba(16,16,16,0.65)',
                  border: '1px solid rgba(201,168,76,0.1)',
                }}
              >
                <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
                  Nada encontrado para &quot;{query}&quot;.
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && query.length < 2 && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(16,16,16,0.65)',
              border: '1px solid rgba(201,168,76,0.1)',
            }}
          >
            <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
              Digite pelo menos 2 caracteres.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
