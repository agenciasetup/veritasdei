'use client'

/**
 * BannerSlider — slider full-width auto-play do topo de /educa/estudo.
 *
 * Carrega banners ativos de `educa_banners` (ordem ASC), troca a cada
 * `INTERVAL_MS`, permite swipe horizontal mobile (via scroll snap) e
 * mostra dots na base. Estilo cinematográfico, paleta sacra.
 *
 * Performance:
 *  - Aceita `banners` via prop (preferido) — quando o consumidor faz
 *    fetch no servidor, eliminamos um round-trip client e o slider
 *    renderiza imediatamente.
 *  - Quando chamado sem props, faz fetch client com cache em
 *    sessionStorage (TTL curto) pra evitar refetch entre navegações
 *    soft do app router.
 *
 * Não renderiza nada quando:
 *  - Loading inicial (evita layout shift)
 *  - Sem banners ativos (admin não cadastrou ainda)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const INTERVAL_MS = 5500
const BANNERS_CACHE_KEY = 'vd.educa.banners.v2'
const BANNERS_CACHE_TTL_MS = 5 * 60_000 // 5 min

export type Banner = {
  id: string
  image_url: string
  image_url_mobile: string | null
  image_position: string | null
  image_position_mobile: string | null
  link_url: string | null
  title: string | null
  subtitle: string | null
}

interface CachedBanners {
  at: number
  banners: Banner[]
}

function readBannersCache(): Banner[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(BANNERS_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedBanners
    if (!parsed?.banners || !Array.isArray(parsed.banners)) return null
    if (Date.now() - parsed.at > BANNERS_CACHE_TTL_MS) return null
    return parsed.banners
  } catch {
    return null
  }
}

function writeBannersCache(banners: Banner[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      BANNERS_CACHE_KEY,
      JSON.stringify({ at: Date.now(), banners } satisfies CachedBanners),
    )
  } catch {
    /* sessionStorage cheio em modo privado — ignorar */
  }
}

/** Hook compartilhado pra puxar banners ativos com cache leve em
 *  sessionStorage. Reutilizado pelo EducaEstudoView pra decidir entre
 *  BannerSlider e CinematicHero. */
export function useActiveBanners(): { banners: Banner[]; loading: boolean } {
  const [banners, setBanners] = useState<Banner[]>(() => readBannersCache() ?? [])
  const [loading, setLoading] = useState<boolean>(() => readBannersCache() === null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      if (!supabase) {
        if (!cancelled) setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('educa_banners')
        .select(
          'id, image_url, image_url_mobile, image_position, image_position_mobile, link_url, title, subtitle',
        )
        .eq('ativo', true)
        .order('ordem', { ascending: true })
      if (cancelled) return
      if (!error && Array.isArray(data)) {
        const list = data as Banner[]
        setBanners(list)
        writeBannersCache(list)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { banners, loading }
}

export default function BannerSlider({
  banners: bannersProp,
}: {
  banners?: Banner[]
}) {
  // Compatibilidade: se for chamado sem props (uso antigo), busca sozinho.
  const fallback = useActiveBanners()
  const banners = bannersProp ?? fallback.banners
  const loading = bannersProp ? false : fallback.loading
  const [active, setActive] = useState(0)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userInteractedRef = useRef(false)

  // Auto-play
  const goTo = useCallback(
    (i: number) => {
      const el = scrollerRef.current
      if (!el || banners.length === 0) return
      const idx = ((i % banners.length) + banners.length) % banners.length
      el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
      setActive(idx)
    },
    [banners.length],
  )

  useEffect(() => {
    if (banners.length <= 1) return
    timerRef.current = setInterval(() => {
      if (userInteractedRef.current) return
      goTo(active + 1)
    }, INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [active, banners.length, goTo])

  const onScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || banners.length === 0) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    setActive(idx)
  }, [banners.length])

  function handlePointerDown() {
    userInteractedRef.current = true
  }
  function handlePointerUp() {
    setTimeout(() => {
      userInteractedRef.current = false
    }, 8000)
  }

  if (loading || banners.length === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      className="relative w-full overflow-hidden"
      style={{
        borderBottom: '1px solid var(--border-1)',
      }}
    >
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        style={{
          scrollbarWidth: 'none',
        }}
      >
        {banners.map((b, i) => (
          <div key={b.id} className="contents">
            <BannerSlide banner={b} eager={i === 0} />
          </div>
        ))}
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 md:bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Ir para banner ${i + 1}`}
              onClick={() => {
                userInteractedRef.current = true
                goTo(i)
              }}
              className="pointer-events-auto rounded-full transition-all duration-300"
              style={{
                width: i === active ? 22 : 7,
                height: 7,
                background:
                  i === active
                    ? 'var(--accent)'
                    : 'rgba(255,255,255,0.4)',
                boxShadow:
                  i === active
                    ? '0 0 8px color-mix(in srgb, var(--accent) 60%, transparent)'
                    : 'none',
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function BannerSlide({ banner, eager }: { banner: Banner; eager?: boolean }) {
  // Renderiza duas <img> e troca a visibilidade via CSS — evita layout shift
  // ao alternar entre mobile/desktop e mantém o snap-scroll fluido.
  const desktop = banner.image_url
  const mobile = banner.image_url_mobile || banner.image_url
  const inner = (
    <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden">
      {/* MOBILE */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mobile}
        alt={banner.title ?? ''}
        className="absolute inset-0 w-full h-full md:hidden"
        style={{
          objectFit: 'cover',
          objectPosition: banner.image_position_mobile ?? banner.image_position ?? '50% 50%',
        }}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
      />
      {/* DESKTOP */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={desktop}
        alt={banner.title ?? ''}
        className="absolute inset-0 w-full h-full hidden md:block"
        style={{
          objectFit: 'cover',
          objectPosition: banner.image_position ?? '50% 50%',
        }}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
      />
      {/* Vinheta sacra: escurece bordas + gradiente lateral pra texto legível */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(15,14,12,0.85) 0%, rgba(15,14,12,0.35) 45%, transparent 70%), linear-gradient(180deg, transparent 60%, rgba(15,14,12,0.6) 100%)',
        }}
      />
      {(banner.title || banner.subtitle) && (
        <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-10">
          <div className="max-w-xl">
            {banner.subtitle && (
              <p
                className="text-[10px] md:text-xs tracking-[0.25em] uppercase mb-2"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {banner.subtitle}
              </p>
            )}
            {banner.title && (
              <h2
                className="text-2xl md:text-5xl leading-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text-1)',
                  textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                }}
              >
                {banner.title}
              </h2>
            )}
            {banner.link_url && (
              <div className="mt-4">
                <span
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--accent-contrast)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                  }}
                >
                  Saiba mais
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full flex-shrink-0 snap-start">
      {banner.link_url ? (
        <Link
          href={banner.link_url}
          className="block active:opacity-90 transition-opacity"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  )
}
