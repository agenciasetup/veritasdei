'use client'

/**
 * CartasReais — renderiza até 3 cartas da coleção real usando o
 * componente `<CartaView>` da página /colecao. Mesma estética visual:
 * moldura, brilho, holográfico — sem reinventar.
 *
 * Escolha pelo admin via `cartas.landing_featured`. Sem nenhuma marcada,
 * fallback automático (3 mais raras) já vem do server.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import CartaView from '@/components/colecao/CartaView'
import type { Carta } from '@/types/colecao'

const GOLD = '#C9A84C'

type Props = {
  cartas: Carta[]
}

type Breakpoint = 'mobile' | 'sm' | 'md'

/**
 * Hook que reage ao breakpoint do Tailwind (sm=640, md=768) pra que o
 * CartaView receba a largura correta em px — sem ela, ele renderiza
 * no design size (145/180) e vaza pra fora do wrapper visual.
 */
function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('mobile')
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mqMd = window.matchMedia('(min-width: 768px)')
    const mqSm = window.matchMedia('(min-width: 640px)')
    function update() {
      setBp(mqMd.matches ? 'md' : mqSm.matches ? 'sm' : 'mobile')
    }
    update()
    mqSm.addEventListener('change', update)
    mqMd.addEventListener('change', update)
    return () => {
      mqSm.removeEventListener('change', update)
      mqMd.removeEventListener('change', update)
    }
  }, [])
  return bp
}

export default function CartasReais({ cartas }: Props) {
  const shown = cartas.slice(0, 3)
  const bp = useBreakpoint()

  if (shown.length === 0) {
    return (
      <div
        className="relative w-full rounded-2xl flex items-center justify-center text-center px-8 py-12"
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
    )
  }

  const centerIdx = shown.length === 3 ? 1 : shown.length - 1

  // Tamanho real (em px) que cada slot vai ter, por breakpoint. Mantemos
  // o total + gaps + rotação dentro do container em qualquer largura.
  const SIZES: Record<Breakpoint, { center: number; side: number; gap: number }> = {
    mobile: { center: 92, side: 72, gap: 0 },
    sm:     { center: 150, side: 130, gap: 10 },
    md:     { center: 180, side: 145, gap: 14 },
  }
  const size = SIZES[bp]

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{
        background: '#14100B',
        border: '1px solid rgba(201,168,76,0.35)',
        padding: '32px 8px 28px',
      }}
    >
      {/* Header */}
      <p
        className="text-center text-[10px] uppercase tracking-[0.28em] mb-6 px-2"
        style={{ color: GOLD, fontFamily: 'Cinzel, serif' }}
      >
        Coleção · suas conquistas
      </p>

      {/* Cartas: flex centralizado, centro maior e elevado. */}
      <div className="flex items-end justify-center" style={{ gap: size.gap }}>
        {shown.map((carta, i) => {
          const isCenter = i === centerIdx
          const rotate = i === centerIdx ? 0 : i < centerIdx ? -3 : 3
          const width = isCenter ? size.center : size.side
          return (
            <motion.div
              key={carta.id}
              className="flex-shrink-0"
              style={{
                transformOrigin: 'bottom center',
                transform: `translateY(${isCenter ? '-10px' : '0px'}) rotate(${rotate}deg)`,
                zIndex: isCenter ? 10 : 1,
                width,
              }}
              animate={isCenter ? { y: [0, -6, 0] } : undefined}
              transition={isCenter ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              <CartaView carta={carta} width={width} />
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <p
        className="text-center text-[9px] uppercase tracking-[0.2em] mt-8 px-2"
        style={{
          color: 'rgba(242,237,228,0.5)',
          fontFamily: 'Cinzel, serif',
        }}
      >
        Suprema · Lendária · Épica · Rara · Comum
      </p>
    </div>
  )
}
