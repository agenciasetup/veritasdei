'use client'

/**
 * ContinueHeroCard — card grande de retomada da última trilha. Pareado com
 * o hero do perfil em altura (row 1 da dashboard /educa).
 *
 * 3 estados:
 *   1. Tem `lastStudied` + cover_url   → banner 16:9 + título + CTA
 *   2. Tem `lastStudied` sem cover     → ilustração discreta + título + CTA
 *   3. Sem `lastStudied` (user novo)   → CTA "Comece sua jornada" → /educa/estudo
 *
 * Mesmo card usado em mobile (full width) e desktop (col-span-8).
 * Mobile: imagem fica em cima, texto embaixo. Desktop: idem (mais limpo).
 */

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Compass, Play } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLastStudied } from '@/lib/content/useLastStudied'
import { createClient } from '@/lib/supabase/client'

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

const SHELL_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid rgba(255,255,255,0.05)',
}

export default function ContinueHeroCard() {
  const { user } = useAuth()
  const { last: lastStudied } = useLastStudied(user?.id)
  // Cover prefere subtopic > topic > group (mais específico → mais geral).
  // Cada nível pode ter web + mobile separados. Fallback final: banner da
  // tabela educa_banners cujo link aponte pra essa trilha.
  const directCover =
    lastStudied?.subtopicCoverUrl
    ?? lastStudied?.topicCoverUrl
    ?? lastStudied?.groupCoverUrl
    ?? null
  const directCoverMobile =
    lastStudied?.subtopicCoverUrlMobile
    ?? lastStudied?.topicCoverUrlMobile
    ?? lastStudied?.groupCoverUrlMobile
    ?? null
  const bannerFallback = useBannerFallback(
    lastStudied?.groupSlug,
    !!lastStudied && !directCover,
  )

  // Estado 3: usuário novo, sem progresso → CTA editorial
  if (!lastStudied) {
    return (
      <Link
        href="/educa/estudo"
        className="block h-full rounded-[24px] overflow-hidden p-6 lg:p-8 transition-colors hover:bg-white/[0.01]"
        style={{ ...SHELL_STYLE, minHeight: 220 }}
      >
        <div className="h-full flex flex-col">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Compass
              className="w-5 h-5"
              style={{ color: 'var(--accent)' }}
              strokeWidth={1.6}
            />
          </div>
          <div className="mt-4 flex-1 flex flex-col">
            <p
              className="text-2xl lg:text-[28px] leading-tight"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-elegant)',
                fontWeight: 500,
              }}
            >
              Comece sua jornada
            </p>
            <p
              className="text-sm mt-2 max-w-md"
              style={{
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.55,
              }}
            >
              Os pilares da fé católica te esperam. Escolha um pilar e comece
              a estudar — sua jornada doutrinal começa hoje.
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 text-sm mt-6 self-start"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
          >
            Começar a estudar
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    )
  }

  const cover = directCover
    ? { desktop: directCover, mobile: directCoverMobile }
    : bannerFallback
      ? {
          desktop: bannerFallback.image_url,
          mobile: bannerFallback.image_url_mobile,
        }
      : null

  return (
    <Link
      href={`/estudo/${lastStudied.groupSlug}`}
      className="block h-full rounded-[24px] overflow-hidden transition-colors hover:bg-white/[0.01]"
      style={SHELL_STYLE}
    >
      <div className="h-full flex flex-col">
        {cover ? (
          <div
            className="relative w-full aspect-[16/9] flex-shrink-0"
            style={{
              backgroundImage: `url(${cover.desktop})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* mobile usa imagem mobile quando existir */}
            {cover.mobile && cover.mobile !== cover.desktop && (
              <div
                className="absolute inset-0 lg:hidden"
                style={{
                  backgroundImage: `url(${cover.mobile})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/3"
              style={{
                background:
                  'linear-gradient(180deg, transparent 0%, var(--surface-2) 100%)',
              }}
            />
            <div
              className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Play
                className="w-3 h-3"
                style={{ color: 'var(--accent)' }}
                strokeWidth={2.5}
              />
              <span
                className="text-[10px]"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Continue de onde parou
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 lg:p-8 flex items-start gap-4 flex-shrink-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <BookOpen
                className="w-5 h-5"
                style={{ color: 'var(--accent)' }}
                strokeWidth={1.6}
              />
            </div>
            <p
              className="text-xs mt-2"
              style={{
                color: 'var(--text-3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Continue de onde parou
            </p>
          </div>
        )}

        <div className="flex-1 flex flex-col p-6 lg:p-8 lg:pt-4">
          <p
            className="text-[11px]"
            style={{
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {lastStudied.groupTitle}
          </p>
          <p
            className="text-2xl lg:text-[28px] leading-tight mt-1"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-elegant)',
              fontWeight: 500,
            }}
          >
            {lastStudied.subtopicTitle}
          </p>
          <p
            className="text-xs mt-3"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Você parou aqui. Continue de onde estava — leva alguns minutos.
          </p>
          <div className="mt-auto pt-6">
            <span
              className="inline-flex items-center gap-1.5 text-sm"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Continuar estudo
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
