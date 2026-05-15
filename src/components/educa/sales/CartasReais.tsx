'use client'

/**
 * CartasReais — até 3 cartas reais (de `public.cartas`) renderizadas
 * lado a lado, com a do meio em destaque (maior + elevada).
 *
 * Substitui o SVG CartasMockup anterior. Mostra ilustracao_url + nome +
 * subtitulo + raridade + frase_central reais. Escolha das cartas vem do
 * admin via `landing_featured` (com fallback automático).
 */

import { motion } from 'framer-motion'
import { RARIDADE_META, type CartaRaridade } from '@/types/colecao'
import type { EducaSalesCarta } from '@/lib/educa/server-data'

const GOLD = '#C9A84C'

type Props = {
  cartas: EducaSalesCarta[]
}

export default function CartasReais({ cartas }: Props) {
  const shown = cartas.slice(0, 3)

  if (shown.length === 0) {
    return (
      <div
        className="relative w-full rounded-2xl flex items-center justify-center text-center px-8"
        style={{
          aspectRatio: '420 / 520',
          background: '#14100B',
          border: '1px solid rgba(201,168,76,0.35)',
          color: 'rgba(242,237,228,0.65)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
        }}
      >
        Cartas em produção. Em breve, novos santos e doutores.
      </div>
    )
  }

  // Slot do "destaque" = o do meio quando há 3; quando 1 ou 2, o último.
  const centerIdx = shown.length === 3 ? 1 : shown.length - 1

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        aspectRatio: '420 / 520',
        background: '#14100B',
        border: '1px solid rgba(201,168,76,0.35)',
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 text-center pt-6 px-5 z-20 pointer-events-none">
        <p
          className="text-[10px] uppercase tracking-[0.32em]"
          style={{ color: GOLD, fontFamily: 'Cinzel, serif' }}
        >
          Códex · suas conquistas
        </p>
      </div>

      {/* Grid de cartas: 3 colunas, centro elevado */}
      <div className="absolute inset-0 grid grid-cols-3 gap-1 items-center px-2 sm:px-3 pt-12 pb-10">
        {shown.map((carta, i) => (
          <div key={carta.id} className="flex items-center justify-center">
            <CartaCard carta={carta} isCenter={i === centerIdx} position={i - centerIdx} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 pb-4 text-center z-20 pointer-events-none">
        <p
          className="text-[9px] uppercase tracking-[0.22em]"
          style={{
            color: 'rgba(242,237,228,0.5)',
            fontFamily: 'Cinzel, serif',
          }}
        >
          Suprema · Lendária · Épica · Rara · Comum
        </p>
      </div>
    </div>
  )
}

function CartaCard({
  carta,
  isCenter,
  position,
}: {
  carta: EducaSalesCarta
  isCenter: boolean
  /** -1 = esquerda, 0 = centro, 1 = direita */
  position: number
}) {
  const meta = RARIDADE_META[carta.raridade as CartaRaridade] ?? RARIDADE_META.comum
  const accent = carta.corAccent || meta.cor

  // Rotação leve nos laterais; centro reto. Centro também é maior e fica
  // por cima (z-index) sem cobrir nome/estrelas das outras.
  const rotate = position === 0 ? 0 : position < 0 ? -6 : 6
  const yOffset = isCenter ? -10 : 0

  return (
    <motion.div
      className="relative rounded-xl overflow-hidden"
      style={{
        width: isCenter ? '108%' : '92%',
        aspectRatio: '5 / 7',
        transform: `translateY(${yOffset}px) rotate(${rotate}deg)`,
        zIndex: isCenter ? 10 : 1,
        background: 'linear-gradient(160deg, #1F1810 0%, #0F0E0C 100%)',
        border: `2px solid ${meta.borda}`,
        boxShadow: isCenter
          ? `0 22px 50px rgba(0,0,0,0.55)${meta.glow ? `, ${meta.glow}` : ''}`
          : '0 14px 30px rgba(0,0,0,0.4)',
      }}
      animate={isCenter ? { y: [yOffset, yOffset - 4, yOffset] } : undefined}
      transition={isCenter ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {/* Ilustração */}
      {carta.ilustracaoUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={carta.ilustracaoUrl}
            alt={carta.nome}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(15,14,12,0) 35%, rgba(15,14,12,0.92) 80%, #0F0E0C 100%)',
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `radial-gradient(60% 60% at 50% 40%, ${accent}25, transparent)` }}
        >
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: accent, fontFamily: 'Cinzel, serif' }}
          >
            {meta.label}
          </span>
        </div>
      )}

      {/* Conteúdo overlay (parte inferior) */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
        <p
          className="uppercase mb-0.5"
          style={{
            color: accent,
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.18em',
            fontSize: isCenter ? 8.5 : 7.5,
          }}
        >
          {meta.label} · {'★'.repeat(carta.estrelas)}
        </p>
        <h3
          className="leading-tight"
          style={{
            color: '#F2EDE4',
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 600,
            fontSize: isCenter ? 15 : 12,
            textWrap: 'balance',
          }}
        >
          {carta.nome}
        </h3>
        {carta.subtitulo && (
          <p
            className="mt-0.5 italic line-clamp-1"
            style={{
              color: 'rgba(242,237,228,0.65)',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: isCenter ? 10.5 : 9,
              lineHeight: 1.3,
            }}
          >
            {carta.subtitulo}
          </p>
        )}
      </div>
    </motion.div>
  )
}
