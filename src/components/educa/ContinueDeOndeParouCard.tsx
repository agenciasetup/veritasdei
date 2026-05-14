'use client'

/**
 * ContinueDeOndeParouCard — card de retomada da última trilha estudada.
 *
 * Fontes de imagem (ordem de preferência):
 *  1. `content_groups.cover_url(_mobile)` — campo dedicado, já preenchido
 *     pelo admin no /admin/educa/trilhas.
 *  2. `educa_banners` cujo `link_url ILIKE` aponte pra essa trilha
 *     (fallback de compatibilidade — banners genéricos do slider).
 *  3. Card só-ícone — quando nenhum dos dois retornar.
 *
 * O JOIN do `useLastStudied` já traz a cover_url pronta, então no caminho
 * feliz não temos round-trip extra. O fallback de banners só dispara
 * quando cover_url é null.
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, NotebookPen, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LastStudied } from '@/lib/content/useLastStudied'
import GlassCard from './GlassCard'

interface CoverImage {
  desktop: string
  mobile: string | null
}

interface BannerHit {
  image_url: string
  image_url_mobile: string | null
}

function useBannerFallback(
  groupSlug: string | undefined,
  enabled: boolean,
): BannerHit | null {
  const [hit, setHit] = useState<BannerHit | null>(null)
  useEffect(() => {
    if (!enabled || !groupSlug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHit(null)
      return
    }
    const supabase = createClient()
    if (!supabase) return
    let cancelled = false
    void supabase
      .from('educa_banners')
      .select('image_url, image_url_mobile')
      .eq('ativo', true)
      .ilike('link_url', `%${groupSlug}%`)
      .order('ordem', { ascending: true })
      .limit(1)
      .then((res: { data: BannerHit[] | null }) => {
        if (cancelled) return
        const row = res.data?.[0]
        setHit(row ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [groupSlug, enabled])
  return hit
}

interface Props {
  lastStudied: LastStudied
}

export default function ContinueDeOndeParouCard({ lastStudied }: Props) {
  const directCover = lastStudied.groupCoverUrl
  const bannerFallback = useBannerFallback(
    lastStudied.groupSlug,
    !directCover,
  )

  const cover: CoverImage | null = directCover
    ? { desktop: directCover, mobile: lastStudied.groupCoverUrlMobile }
    : bannerFallback
      ? {
          desktop: bannerFallback.image_url,
          mobile: bannerFallback.image_url_mobile,
        }
      : null

  if (cover) {
    return (
      <Link
        href={`/estudo/${lastStudied.groupSlug}`}
        className="block h-full"
      >
        <GlassCard variant="flat" interactive className="h-full">
          <div className="relative h-full flex flex-col md:flex-row md:items-stretch overflow-hidden">
            <div
              className="relative w-full h-40 md:w-[40%] md:h-auto md:min-h-[160px] flex-shrink-0 overflow-hidden"
              style={{
                backgroundImage: `url(${cover.mobile || cover.desktop})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(15,14,12,0.85) 100%)',
                }}
              />
              <span
                aria-hidden
                className="hidden md:block absolute inset-y-0 right-0 w-12"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(15,14,12,0.85) 100%)',
                }}
              />
              <div
                className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                  border:
                    '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
                }}
              >
                <Play
                  className="w-3 h-3"
                  style={{ color: 'var(--accent)' }}
                  strokeWidth={2.5}
                />
                <span
                  className="text-[10px] tracking-[0.15em] uppercase"
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Continue
                </span>
              </div>
            </div>

            <div className="flex-1 p-5 md:p-6 flex flex-col justify-center min-w-0">
              <p
                className="text-[10px] tracking-[0.2em] uppercase mb-1"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-display)',
                  opacity: 0.85,
                }}
              >
                {lastStudied.groupTitle}
              </p>
              <p
                className="text-base md:text-lg font-medium leading-tight mb-2"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {lastStudied.subtopicTitle}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className="text-[12px]"
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Retomar
                </span>
                <ArrowRight
                  className="w-3.5 h-3.5"
                  style={{ color: 'var(--accent)' }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </Link>
    )
  }

  return (
    <Link href={`/estudo/${lastStudied.groupSlug}`} className="block h-full">
      <GlassCard variant="flat" padded interactive className="h-full">
        <div className="flex items-start gap-3 md:gap-4 h-full">
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--accent) 28%, rgba(0,0,0,0.4)) 0%, rgba(0,0,0,0.5) 100%)',
              border:
                '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
            }}
          >
            <NotebookPen
              className="w-5 h-5 md:w-6 md:h-6"
              style={{ color: 'var(--accent)' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] tracking-[0.2em] uppercase mb-1"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
                opacity: 0.85,
              }}
            >
              Continue de onde parou
            </p>
            <p
              className="text-sm md:text-base font-medium truncate"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {lastStudied.subtopicTitle}
            </p>
            <p
              className="text-[11px] mt-0.5 truncate"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {lastStudied.groupTitle}
            </p>
          </div>
          <ArrowRight
            className="w-4 h-4 flex-shrink-0 self-center"
            style={{ color: 'var(--accent)' }}
          />
        </div>
      </GlassCard>
    </Link>
  )
}
