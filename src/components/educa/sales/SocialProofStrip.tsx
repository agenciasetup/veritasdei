'use client'

/**
 * Faixa de prova social estilo "stories": fotos circulares com nome
 * embaixo, rolando devagar pra esquerda em loop infinito. Acima dos
 * planos pra reforçar autoridade.
 *
 * Os destaques vêm de `educa_landing_destaques` (curados pelo admin) —
 * tipicamente padres, influenciadores católicos e alunos referência.
 * Quando o admin ainda não cadastrou nada, a faixa não renderiza, pra
 * não exibir avatares falsos.
 */

import Image from 'next/image'
import Link from 'next/link'
import type { EducaLandingDestaque } from '@/lib/educa/server-data'

type Props = {
  destaques: EducaLandingDestaque[]
}

export default function SocialProofStrip({ destaques }: Props) {
  if (destaques.length === 0) return null

  // Duplicado pra simular scroll infinito em CSS (translateX -50% loop).
  const loop = [...destaques, ...destaques]

  return (
    <section
      aria-label="Pessoas estudando no Veritas Educa"
      className="relative py-12 md:py-16 overflow-hidden"
      style={{ background: 'var(--surface-1)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 50%, rgba(201,168,76,0.08), transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 mb-7 text-center">
        <p
          className="eyebrow-label inline-flex items-center gap-2"
          style={{ color: '#D9C077' }}
        >
          <span className="inline-block w-1 h-1 rounded-full" style={{ background: '#C9A84C' }} />
          Quem já está estudando
          <span className="inline-block w-1 h-1 rounded-full" style={{ background: '#C9A84C' }} />
        </p>
        <h2
          className="display-cormorant text-2xl sm:text-3xl md:text-4xl leading-[1.1] mt-3"
          style={{ color: '#F5EFE6', textWrap: 'balance' }}
        >
          Padres, formadores e alunos{' '}
          <span className="italic" style={{ color: '#E6D9B5' }}>
            que confiam no Veritas.
          </span>
        </h2>
      </div>

      <div
        className="relative"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
        }}
      >
        <div className="lp-stories-track flex items-start gap-6 sm:gap-8 px-5 md:px-8 will-change-transform">
          {loop.map((item, idx) => (
            <DestaqueAvatar key={`${item.id}-${idx}`} item={item} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes lp-stories-scroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        .lp-stories-track {
          width: max-content;
          animation: lp-stories-scroll 60s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-stories-track { animation-duration: 180s; }
        }
      `}</style>
    </section>
  )
}

function DestaqueAvatar({ item }: { item: EducaLandingDestaque }) {
  const content = (
    <div
      className="flex-shrink-0 flex flex-col items-center gap-2"
      style={{ width: 96 }}
    >
      <span
        className="relative inline-flex items-center justify-center rounded-full overflow-hidden"
        style={{
          width: 78,
          height: 78,
          background: '#1C1610',
          boxShadow:
            '0 0 0 2px #0F0E0C, 0 0 0 3px #C9A84C, 0 12px 28px rgba(0,0,0,0.45)',
        }}
      >
        <Image
          src={item.photoUrl}
          alt={item.nome}
          fill
          sizes="78px"
          className="object-cover"
          loading="lazy"
        />
      </span>
      <span
        className="text-[11px] leading-tight text-center"
        style={{
          color: '#F5EFE6',
          fontFamily: 'var(--font-body)',
          maxWidth: 96,
          fontWeight: 500,
        }}
      >
        {item.nome}
      </span>
      {item.subtitulo && (
        <span
          className="text-[10px] leading-tight text-center"
          style={{
            color: 'rgba(242,237,228,0.55)',
            fontFamily: 'var(--font-body)',
            maxWidth: 96,
            marginTop: -4,
          }}
        >
          {item.subtitulo}
        </span>
      )}
    </div>
  )

  if (item.linkUrl) {
    return (
      <Link
        href={item.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        {content}
      </Link>
    )
  }

  return content
}
