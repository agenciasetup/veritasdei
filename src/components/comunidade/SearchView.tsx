'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Search, X, Clock } from 'lucide-react'
import CrossIcon from '@/components/icons/CrossIcon'
import VeritasCard from '@/components/comunidade/VeritasCard'
import RoleBadge from '@/components/comunidade/RoleBadge'
import VerifiedBadge from '@/components/comunidade/VerifiedBadge'
import { OrnamentDivider } from '@/components/landing/components/OrnamentDivider'
import { useAuth } from '@/contexts/AuthContext'
import type { VeritasPost, CommunityRole } from '@/lib/community/types'

interface PersonResult {
  id: string
  name: string | null
  public_handle: string | null
  user_number: number | null
  profile_image_url: string | null
  cover_image_url: string | null
  bio_short: string | null
  community_role: CommunityRole
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

const RECENT_STORAGE_KEY = 'veritasdei:comunidade:buscar:recentes'
const RECENT_MAX = 8

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === 'string').slice(0, RECENT_MAX)
      : []
  } catch {
    return []
  }
}

function saveRecent(list: string[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(list.slice(0, RECENT_MAX)))
  } catch {
    // ignore
  }
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
  const [recent, setRecent] = useState<string[]>([])

  // Cache em memória por query+tab (evita refetch ao trocar de aba ou voltar).
  const cacheRef = useRef<Map<string, SearchResponse>>(new Map())

  useEffect(() => {
    setRecent(loadRecent())
  }, [])

  // Debounce: inputValue -> query (autosubmit após 300ms sem digitação).
  useEffect(() => {
    const trimmed = inputValue.trim()
    if (trimmed === query) return
    const timer = setTimeout(() => {
      setQuery(trimmed)
      const params = new URLSearchParams()
      if (trimmed) params.set('q', trimmed)
      if (tab !== 'top') params.set('tab', tab)
      router.replace(`/comunidade/buscar${params.toString() ? '?' + params : ''}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [inputValue, query, tab, router])

  // Fetch dos resultados — com cache por query+tab.
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      return
    }

    const cacheKey = `${query}::${tab}`
    const cached = cacheRef.current.get(cacheKey)
    if (cached) {
      setResults(cached)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const params = new URLSearchParams({ q: query, tab })
        const res = await fetch(`/api/comunidade/buscar?${params}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Falha na busca')
        const data = (await res.json()) as SearchResponse
        cacheRef.current.set(cacheKey, data)
        setResults(data)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError(e instanceof Error ? e.message : 'Erro na busca')
        }
      } finally {
        setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [query, tab])

  // Salva no "recentes" assim que há ≥2 caracteres e resposta — só uma vez por query.
  const savedQueryRef = useRef<string | null>(null)
  useEffect(() => {
    if (!results || query.length < 2) return
    if (savedQueryRef.current === query) return
    savedQueryRef.current = query
    setRecent(prev => {
      const next = [query, ...prev.filter(q => q !== query)].slice(0, RECENT_MAX)
      saveRecent(next)
      return next
    })
  }, [results, query])

  function switchTab(next: Tab) {
    setTab(next)
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (next !== 'top') params.set('tab', next)
    router.replace(`/comunidade/buscar${params.toString() ? '?' + params : ''}`)
  }

  function clearInput() {
    setInputValue('')
    setQuery('')
    router.replace('/comunidade/buscar')
  }

  function removeRecent(q: string) {
    setRecent(prev => {
      const next = prev.filter(item => item !== q)
      saveRecent(next)
      return next
    })
  }

  function applyRecent(q: string) {
    setInputValue(q)
  }

  const viewerId = user?.id ?? null

  const sections = useMemo(() => {
    if (!results) return null
    const showHashtags = (tab === 'top' || tab === 'hashtags') && results.hashtags.length > 0
    const showPeople = (tab === 'top' || tab === 'people') && results.people.length > 0
    const showPosts = (tab === 'top' || tab === 'posts') && results.posts.length > 0
    const visibleCount = [showHashtags, showPeople, showPosts].filter(Boolean).length
    return { showHashtags, showPeople, showPosts, visibleCount }
  }, [results, tab])

  return (
    <main className="min-h-screen px-4 md:px-8 py-6 relative">
      <div className="bg-glow" />

      <div className="max-w-3xl mx-auto relative z-10">
        <Link
          href="/comunidade"
          className="inline-flex items-center gap-2 mb-5 text-sm"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Voltar ao feed
        </Link>

        {/* Search input minimalista */}
        <div
          className="flex items-center gap-2 mb-1 py-2"
          style={{ borderBottom: '0.5px solid rgba(242,237,228,0.12)' }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#8A8378' }} strokeWidth={1.5} />
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Buscar Veritas, pessoas ou hashtags..."
            autoFocus
            aria-label="Buscar"
            className="flex-1 bg-transparent text-[15px]"
            style={{
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
              border: 'none',
            }}
          />
          {inputValue && (
            <button
              type="button"
              onClick={clearInput}
              aria-label="Limpar busca"
              className="p-1 rounded-full"
              style={{ color: '#8A8378' }}
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Tabs estilo underline */}
        <div className="flex items-center gap-1 mb-2 overflow-x-auto border-b" style={{ borderColor: 'rgba(242,237,228,0.08)' }}>
          {(['top', 'posts', 'people', 'hashtags'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className="relative px-4 py-3 text-[13px] uppercase tracking-[0.14em] whitespace-nowrap"
              style={{
                color: tab === t ? '#F2EDE4' : '#8A8378',
                fontFamily: 'Poppins, sans-serif',
                background: 'transparent',
                border: 'none',
              }}
            >
              {TAB_LABELS[t]}
              {tab === t && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                  style={{ background: '#C9A84C' }}
                />
              )}
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

        {/* Estado vazio: mostra recentes (se houver). */}
        {query.length < 2 && !loading && (
          <div className="py-6">
            {recent.length > 0 ? (
              <>
                <p
                  className="text-[11px] uppercase tracking-[0.14em] mb-3"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  Buscas recentes
                </p>
                <div className="flex flex-wrap gap-2">
                  {recent.map(q => (
                    <span
                      key={q}
                      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-[13px]"
                      style={{
                        background: 'rgba(201,168,76,0.06)',
                        border: '1px solid rgba(201,168,76,0.18)',
                        color: '#E7DED1',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => applyRecent(q)}
                        className="inline-flex items-center gap-1.5"
                        style={{ color: 'inherit' }}
                      >
                        <Clock className="w-3 h-3" style={{ color: '#C9A84C' }} strokeWidth={1.5} />
                        {q}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecent(q)}
                        aria-label={`Remover ${q}`}
                        className="p-0.5 rounded-full"
                        style={{ color: '#8A8378' }}
                      >
                        <X className="w-3 h-3" strokeWidth={1.75} />
                      </button>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p
                className="text-center py-8 text-[14px]"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                Digite pelo menos 2 caracteres.
              </p>
            )}
          </div>
        )}

        {/* Skeleton sutil enquanto carrega. */}
        {loading && query.length >= 2 && (
          <div className="py-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton rounded-xl"
                style={{ height: 64 }}
              />
            ))}
          </div>
        )}

        {!loading && query.length >= 2 && results && sections && (
          <div>
            {sections.showHashtags && (
              <section className="py-3">
                <h2
                  className="text-[11px] uppercase tracking-[0.14em] mb-2"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  Hashtags
                </h2>
                <div
                  style={{ borderTop: '0.5px solid rgba(242,237,228,0.06)' }}
                >
                  {results.hashtags.map(h => (
                    <Link
                      key={h.slug}
                      href={`/comunidade/hashtag/${h.slug}`}
                      className="flex items-baseline justify-between gap-3 py-3"
                      style={{ borderBottom: '0.5px solid rgba(242,237,228,0.06)' }}
                    >
                      <p
                        className="text-[15px] truncate"
                        style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
                      >
                        #{h.display}
                      </p>
                      <span
                        className="text-[12px] flex-shrink-0"
                        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {h.usage_count} {h.usage_count === 1 ? 'Veritas' : 'Veritas'}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {sections.showHashtags && sections.visibleCount > 1 && tab === 'top' && (
              <OrnamentDivider className="!py-3" />
            )}

            {sections.showPeople && (
              <section className="py-3">
                <h2
                  className="text-[11px] uppercase tracking-[0.14em] mb-2"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  Pessoas
                </h2>
                <div
                  style={{ borderTop: '0.5px solid rgba(242,237,228,0.06)' }}
                >
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
                        className="flex items-start gap-3 py-3"
                        style={{ borderBottom: '0.5px solid rgba(242,237,228,0.06)' }}
                      >
                        <div
                          className="relative rounded-full overflow-hidden flex-shrink-0"
                          style={{
                            width: 40,
                            height: 40,
                            background: p.profile_image_url ? 'transparent' : 'rgba(201,168,76,0.1)',
                            boxShadow: p.verified
                              ? '0 0 0 1.5px rgba(233,196,106,0.55)'
                              : undefined,
                          }}
                        >
                          {p.profile_image_url ? (
                            <Image
                              src={p.profile_image_url}
                              alt=""
                              width={40}
                              height={40}
                              sizes="40px"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full">
                              <CrossIcon size="sm" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="flex items-center gap-1.5 flex-wrap"
                            style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                          >
                            <span className="text-[15px] font-medium truncate">
                              {p.name ?? 'Membro Veritas'}
                            </span>
                            {p.verified && <VerifiedBadge size={14} />}
                            <RoleBadge role={p.community_role} size="sm" />
                          </div>
                          <p
                            className="text-[13px]"
                            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                          >
                            {p.public_handle ? `@${p.public_handle}` : `#${p.user_number ?? 'sem-número'}`}
                          </p>
                          {p.bio_short && (
                            <p
                              className="text-[13px] mt-1 line-clamp-2"
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

            {sections.showPeople && sections.showPosts && tab === 'top' && (
              <OrnamentDivider className="!py-3" />
            )}

            {sections.showPosts && (
              <section className="py-3 -mx-4 md:-mx-8">
                <h2
                  className="text-[11px] uppercase tracking-[0.14em] mb-2 px-4 md:px-8"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  Veritas
                </h2>
                <div style={{ borderTop: '0.5px solid rgba(242,237,228,0.08)' }}>
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

            {sections.visibleCount === 0 && (
              <div
                className="py-10 text-center"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                Nada encontrado para &quot;{query}&quot;.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
