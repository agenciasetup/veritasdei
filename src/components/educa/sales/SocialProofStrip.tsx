'use client'

/**
 * Faixa de prova social estilo "stories": círculos com iniciais e nome
 * embaixo, rolando devagar pra esquerda em loop infinito. Usada acima
 * dos planos pra reforçar autoridade sem caras estranhas em fotos
 * stock.
 *
 * Sem dados pessoais reais. Os nomes vêm de uma lista curta e neutra
 * de primeiros nomes católicos comuns no Brasil, em ordem aleatória
 * por mount. Sem testemunho, sem foto, sem floreio: só "quem está
 * estudando hoje".
 */

import { useMemo } from 'react'

const NAMES = [
  'Lucas, Recife',
  'Maria Eduarda, Belo Horizonte',
  'João Pedro, Curitiba',
  'Ana Clara, Salvador',
  'Pedro, São Paulo',
  'Beatriz, Fortaleza',
  'Rafael, Brasília',
  'Letícia, Porto Alegre',
  'Gabriel, Manaus',
  'Sofia, Florianópolis',
  'Thiago, Goiânia',
  'Helena, Vitória',
  'Matheus, Natal',
  'Júlia, Campinas',
  'Davi, Aracaju',
  'Larissa, Belém',
  'Murilo, Maringá',
  'Isabela, Ribeirão Preto',
  'Bruno, Uberlândia',
  'Camila, Niterói',
  'Felipe, Londrina',
  'Nicole, Joinville',
  'Henrique, Sorocaba',
  'Mariana, Juiz de Fora',
]

const PALETTE: Array<{ bg: string; ring: string }> = [
  { bg: 'linear-gradient(135deg, #5A1625 0%, #3D0F1A 100%)', ring: '#C9A84C' },
  { bg: 'linear-gradient(135deg, #1F2A44 0%, #0F1626 100%)', ring: '#D9C077' },
  { bg: 'linear-gradient(135deg, #3E2A1A 0%, #1A120A 100%)', ring: '#C9A84C' },
  { bg: 'linear-gradient(135deg, #4A2A55 0%, #1F1226 100%)', ring: '#D9C077' },
  { bg: 'linear-gradient(135deg, #1F3A2A 0%, #0F1F18 100%)', ring: '#C9A84C' },
  { bg: 'linear-gradient(135deg, #6B1D2A 0%, #2A0A12 100%)', ring: '#D9C077' },
]

function initials(name: string): string {
  const first = name.split(',')[0]?.trim() ?? name
  const parts = first.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]?.slice(0, 1).toUpperCase() ?? ''
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default function SocialProofStrip() {
  const items = useMemo(() => {
    return NAMES.map((name, i) => ({
      name,
      pal: PALETTE[i % PALETTE.length] ?? PALETTE[0]!,
    }))
  }, [])

  // Duplicado pra fazer scroll infinito em CSS (translateX -50% loop)
  const loop = [...items, ...items]

  return (
    <section
      aria-label="Pessoas estudando agora"
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
          Católicos do Brasil inteiro,{' '}
          <span className="italic" style={{ color: '#E6D9B5' }}>
            todo dia no app.
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
            <div
              key={`${item.name}-${idx}`}
              className="flex-shrink-0 flex flex-col items-center gap-2"
              style={{ width: 84 }}
            >
              <span
                className="relative inline-flex items-center justify-center rounded-full"
                style={{
                  width: 68,
                  height: 68,
                  background: item.pal.bg,
                  boxShadow: `0 0 0 2px #0F0E0C, 0 0 0 3px ${item.pal.ring}, 0 12px 28px rgba(0,0,0,0.45)`,
                  color: '#F5EFE6',
                  fontFamily: 'Cinzel, serif',
                  fontWeight: 600,
                  fontSize: 18,
                  letterSpacing: '0.04em',
                }}
              >
                {initials(item.name)}
              </span>
              <span
                className="text-[11px] leading-tight text-center"
                style={{
                  color: 'rgba(242,237,228,0.78)',
                  fontFamily: 'var(--font-body)',
                  maxWidth: 84,
                }}
              >
                {item.name}
              </span>
            </div>
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
