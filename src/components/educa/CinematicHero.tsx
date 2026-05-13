'use client'

/**
 * CinematicHero — banner cinematográfico full-bleed estilo Netflix.
 *
 * Reusável em qualquer página do Veritas Dei/Educa. API flexível:
 *  - `eyebrow`  : texto pequeno acima do título (font display dourada)
 *  - `title`    : headline grande
 *  - `subtitle` : descrição curta (1-2 linhas)
 *  - `imageUrl` : imagem de fundo. Sem ela, usa gradient sacro placeholder.
 *  - `primary`  : CTA principal (botão dourado preenchido)
 *  - `secondary`: CTA ghost (vidro escuro)
 *
 * Fade infinito no rodapé que blenda com o restante da página
 * (gradient pra var(--surface-1)).
 */

import Link from 'next/link'
import { Play, Info, type LucideIcon } from 'lucide-react'

type Cta = {
  label: string
  href: string
  icon?: LucideIcon
}

type Props = {
  eyebrow: string
  title: string
  subtitle?: string
  imageUrl?: string | null
  primary?: Cta
  secondary?: Cta
}

export default function CinematicHero({
  eyebrow,
  title,
  subtitle,
  imageUrl,
  primary,
  secondary,
}: Props) {
  const PrimaryIcon = primary?.icon ?? Play
  const SecondaryIcon = secondary?.icon ?? Info

  return (
    <section
      aria-label={eyebrow}
      className="relative w-full overflow-hidden"
      style={{
        // Aspect cinematográfico (clamp pra escalar bem entre mobile e desktop).
        minHeight: 'clamp(360px, 56vw, 540px)',
      }}
    >
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

      {/* FADE INFINITO pra base */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32 md:h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, var(--surface-1) 100%)',
        }}
      />

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

          {(primary || secondary) && (
            <div className="flex items-center gap-3 mt-5 md:mt-6 flex-wrap">
              {primary && (
                <Link
                  href={primary.href}
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
                  <PrimaryIcon className="w-4 h-4 fill-current" />
                  {primary.label}
                </Link>
              )}
              {secondary && (
                <Link
                  href={secondary.href}
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
                  <SecondaryIcon className="w-4 h-4" />
                  {secondary.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
