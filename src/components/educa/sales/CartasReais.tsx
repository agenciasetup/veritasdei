'use client'

/**
 * CartasReais — 3 cartas reais (vindas de `public.cartas`) renderizadas
 * empilhadas no estilo do mockup antigo, mas usando `ilustracao_url`,
 * `nome`, `subtitulo`, `raridade` e `frase_central` do banco.
 *
 * Substitui o SVG CartasMockup pra cumprir o pedido do admin: "ter umas
 * 3 cartas reais ali". A escolha de quais cartas aparecem é controlada
 * por `cartas.landing_featured = true` (toggle no CartaEditor).
 */

import { motion } from 'framer-motion'
import { RARIDADE_META, type CartaRaridade } from '@/types/colecao'
import type { EducaSalesCarta } from '@/lib/educa/server-data'

const GOLD = '#C9A84C'

type Props = {
  cartas: EducaSalesCarta[]
}

const ROTATIONS = [-8, 0, 7]
const X_OFFSETS = [-40, 0, 40]
const Z_INDEX = [1, 3, 2]

export default function CartasReais({ cartas }: Props) {
  // O componente sempre renderiza um quadro 420x520 (mesmo viewBox dos
  // outros mockups SVG) pra encaixar no .mockup-frame-dark.
  const shown = cartas.slice(0, 3)

  if (shown.length === 0) {
    // Fallback honesto: nenhuma carta visível no banco.
    return (
      <div
        className="relative w-full"
        style={{ aspectRatio: '420 / 520' }}
      >
        <div
          className="absolute inset-0 rounded-2xl flex items-center justify-center text-center px-8"
          style={{
            background: '#14100B',
            border: '1px solid rgba(201,168,76,0.35)',
            color: 'rgba(242,237,228,0.65)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
          }}
        >
          Cartas em produção. Em breve, novos santos e doutores.
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: '420 / 520' }}>
      {/* Background do mockup */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: '#14100B',
          border: '1px solid rgba(201,168,76,0.35)',
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 text-center pt-6 px-5">
        <p
          className="text-[10px] uppercase tracking-[0.32em]"
          style={{ color: GOLD, fontFamily: 'Cinzel, serif' }}
        >
          Códex · suas conquistas
        </p>
        <p
          className="mt-1 text-lg"
          style={{
            color: '#E6D9B5',
            fontFamily: 'Cormorant Garamond, serif',
            fontWeight: 600,
          }}
        >
          Cada lição revela uma carta
        </p>
      </div>

      {/* Cartas empilhadas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: '70%', height: '70%' }}>
          {shown.map((carta, i) => {
            const slot = shown.length === 1 ? 1 : shown.length === 2 ? (i === 0 ? 0 : 2) : i
            const rot = ROTATIONS[slot] ?? 0
            const xOff = X_OFFSETS[slot] ?? 0
            const z = Z_INDEX[slot] ?? 1
            return (
              <CartaCard
                key={carta.id}
                carta={carta}
                rotate={rot}
                xOffset={xOff}
                zIndex={z}
                isCenter={slot === 1}
              />
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 pb-5 text-center">
        <p
          className="text-[10px] uppercase tracking-[0.24em]"
          style={{
            color: 'rgba(242,237,228,0.55)',
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
  rotate,
  xOffset,
  zIndex,
  isCenter,
}: {
  carta: EducaSalesCarta
  rotate: number
  xOffset: number
  zIndex: number
  isCenter: boolean
}) {
  const meta = RARIDADE_META[carta.raridade as CartaRaridade] ?? RARIDADE_META.comum
  const accent = carta.corAccent || meta.cor

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 rounded-xl overflow-hidden"
      style={{
        width: isCenter ? '60%' : '54%',
        aspectRatio: '5 / 7',
        translate: `-50% -50%`,
        transform: `translate(calc(-50% + ${xOffset}px), -50%) rotate(${rotate}deg)`,
        zIndex,
        background: 'linear-gradient(160deg, #1F1810 0%, #0F0E0C 100%)',
        border: `2px solid ${meta.borda}`,
        boxShadow: isCenter
          ? `0 30px 60px rgba(0,0,0,0.55)${meta.glow ? `, ${meta.glow}` : ''}`
          : '0 18px 40px rgba(0,0,0,0.45)',
      }}
      animate={isCenter ? { y: [0, -4, 0] } : undefined}
      transition={isCenter ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {/* Ilustração */}
      {carta.ilustracaoUrl ? (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={carta.ilustracaoUrl}
            alt={carta.nome}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(15,14,12,0) 30%, rgba(15,14,12,0.92) 78%, #0F0E0C 100%)',
            }}
          />
        </div>
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

      {/* Conteúdo overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
        <p
          className="text-[8px] sm:text-[9px] uppercase mb-1"
          style={{
            color: accent,
            fontFamily: 'Cinzel, serif',
            letterSpacing: '0.22em',
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
            fontSize: isCenter ? 17 : 14,
          }}
        >
          {carta.nome}
        </h3>
        {carta.subtitulo && (
          <p
            className="mt-0.5 italic"
            style={{
              color: 'rgba(242,237,228,0.68)',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: isCenter ? 11 : 9.5,
              lineHeight: 1.3,
            }}
          >
            {carta.subtitulo}
          </p>
        )}
        {isCenter && carta.fraseCentral && (
          <p
            className="mt-2 pt-2 border-t italic"
            style={{
              borderColor: `${accent}40`,
              color: 'rgba(242,237,228,0.78)',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 10,
              lineHeight: 1.4,
            }}
          >
            &ldquo;{carta.fraseCentral}&rdquo;
          </p>
        )}
      </div>
    </motion.div>
  )
}
