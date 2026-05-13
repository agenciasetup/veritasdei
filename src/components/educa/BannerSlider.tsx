'use client'

/**
 * BannerSlider — slider full-width auto-play do topo de /educa/estudo.
 *
 * Carrega banners ativos de `educa_banners` (ordem ASC), troca a cada
 * `INTERVAL_MS`, permite swipe horizontal mobile (via scroll snap) e
 * mostra dots na base. Estilo cinematográfico, paleta sacra.
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

type Banner = {
  id: string
  image_url: string
  link_url: string | null
  title: string | null
  subtitle: string | null
}

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(0)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userInteractedRef = useRef(false)

  // Fetch
  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('educa_banners')
        .select('id, image_url, link_url, title, subtitle')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
      if (cancelled) return
      if (!error && Array.isArray(data)) {
        setBanners(data as Banner[])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

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

  // Sync `active` quando user faz swipe (sem auto-play)
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
    // Retoma auto-play após 8s sem interação
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
        {banners.map((b) => (
          <div key={b.id} className="contents">
            <BannerSlide banner={b} />
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

function BannerSlide({ banner }: { banner: Banner }) {
  const inner = (
    <div
      className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.image_url}
        alt={banner.title ?? ''}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
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
