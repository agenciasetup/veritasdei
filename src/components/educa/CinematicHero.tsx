'use client'

/**
 * CinematicHero — banner cinematográfico full-bleed estilo Netflix.
 *
 * Quando não há banner cadastrado pelo admin, este hero ocupa o topo
 * de /educa/estudo com:
 *  - Imagem de fundo (ou gradient sacro como placeholder cinematográfico)
 *  - Headline grande sobre o lado esquerdo
 *  - Subtítulo curto
 *  - 2 CTAs (primary dourado + ghost)
 *  - Fade infinito pra base (gradient pra o restante da página)
 *
 * Variantes:
 *  - `continue`: usa "Continue de onde parou" (último subtópico)
 *  - `welcome` : pitch de boas-vindas pra quem ainda não estudou
 */

import Link from 'next/link'
import { Play, Info } from 'lucide-react'

type ContinueData = {
  href: string
  eyebrow: string
  title: string
  subtitle: string
}

export default function CinematicHero({
  variant,
  data,
  imageUrl,
}: {
  variant: 'continue' | 'welcome'
  data?: ContinueData
  /** Imagem de fundo opcional. Sem ela, usamos um gradient sacro
   *  cinematográfico (dourado + vinho profundo + glow). */
  imageUrl?: string | null
}) {
  const eyebrow =
    variant === 'continue' ? data?.eyebrow ?? 'Continue de onde parou' : 'Veritas Educa'
  const title =
    variant === 'continue'
      ? data?.title ?? 'Continue a estudar'
      : 'Aprofunde sua fé católica com método.'
  const subtitle =
    variant === 'continue'
      ? data?.subtitle ?? ''
      : 'Trilhas, IA católica, debate apologético e mais.'
  const primaryHref =
    variant === 'continue' ? data?.href ?? '#' : '/educa/trilhas'
  const primaryLabel = variant === 'continue' ? 'Continuar' : 'Começar agora'

  return (
    <section
      aria-label={eyebrow}
      className="relative w-full overflow-hidden"
      style={{
        // Aspect 25:9 cinematográfico no desktop; mobile fica mais alto
        // pra texto + CTAs respirarem.
        minHeight: 'clamp(360px, 56vw, 540px)',
      }}
    >
      {/* Fundo: imagem ou gradient sacro placeholder */}
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 1100px 700px at 80% 50%, color-mix(in srgb, var(--accent) 22%, #14080b) 0%, #0f0e0c 60%, #0a0908 100%)',
          }}
        />
      )}

      {/* Vinheta esquerda — gradient escuro pro texto ficar legível */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(15,14,12,0.92) 0%, rgba(15,14,12,0.6) 40%, rgba(15,14,12,0.15) 70%, transparent 100%)',
        }}
      />

      {/* Glow dourado sutil (canto superior direito) e vinho (inferior direito) */}
      {!imageUrl && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle 280px at 92% 18%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%), radial-gradient(circle 240px at 95% 90%, color-mix(in srgb, var(--wine-light) 22%, transparent), transparent 70%)',
          }}
        />
      )}

      {/* FADE INFINITO pra base — blend com o restante da página */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32 md:h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, var(--surface-1) 100%)',
        }}
      />

      {/* Conteúdo */}
      <div className="relative max-w-6xl mx-auto px-4 md:px-8 h-full">
        <div className="flex flex-col justify-end h-full pb-12 md:pb-16 pt-16 md:pt-20 min-h-[inherit]">
          <p
            className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-3 md:mb-4"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {eyebrow}
          </p>
          <h1
            className="text-3xl sm:text-4xl md:text-6xl leading-[1.05] max-w-3xl"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
              textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-sm md:text-base mt-3 max-w-xl"
              style={{
                color: 'var(--text-2)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {subtitle}
            </p>
          )}

          <div className="flex items-center gap-3 mt-5 md:mt-6">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-xl text-sm md:text-base"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                boxShadow:
                  '0 8px 24px -8px color-mix(in srgb, var(--accent) 50%, transparent)',
              }}
            >
              <Play className="w-4 h-4 fill-current" />
              {primaryLabel}
            </Link>
            <Link
              href="/educa/trilhas"
              className="inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-xl text-sm md:text-base"
              style={{
                background: 'rgba(20,18,16,0.65)',
                border:
                  '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Info className="w-4 h-4" />
              Ver detalhes
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
