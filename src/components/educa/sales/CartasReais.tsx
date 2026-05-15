'use client'

/**
 * CartasReais — renderiza até 3 cartas da coleção real usando o
 * componente `<CartaView>` da página /colecao. Mesma estética visual:
 * moldura, brilho, holográfico — sem reinventar.
 *
 * Escolha pelo admin via `cartas.landing_featured`. Sem nenhuma marcada,
 * fallback automático (3 mais raras) já vem do server.
 */

import { motion } from 'framer-motion'
import CartaView from '@/components/colecao/CartaView'
import type { Carta } from '@/types/colecao'

const GOLD = '#C9A84C'

type Props = {
  cartas: Carta[]
}

export default function CartasReais({ cartas }: Props) {
  const shown = cartas.slice(0, 3)

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

  return (
    <div
      className="relative w-full overflow-visible rounded-3xl"
      style={{
        background: '#14100B',
        border: '1px solid rgba(201,168,76,0.35)',
        padding: '32px 12px 32px',
      }}
    >
      {/* Header */}
      <p
        className="text-center text-[10px] uppercase tracking-[0.32em] mb-6"
        style={{ color: GOLD, fontFamily: 'Cinzel, serif' }}
      >
        Coleção · suas conquistas
      </p>

      {/* Cartas — flex centralizado, centro maior e elevado */}
      <div className="flex items-end justify-center gap-1.5 sm:gap-3 md:gap-4 px-1">
        {shown.map((carta, i) => {
          const isCenter = i === centerIdx
          const rotate = i === centerIdx ? 0 : i < centerIdx ? -6 : 6
          return (
            <motion.div
              key={carta.id}
              className="flex-shrink-0"
              style={{
                transformOrigin: 'bottom center',
                transform: `translateY(${isCenter ? '-12px' : '0px'}) rotate(${rotate}deg)`,
                zIndex: isCenter ? 10 : 1,
              }}
              animate={isCenter ? { y: [0, -6, 0] } : undefined}
              transition={isCenter ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              <ResponsiveCarta carta={carta} isCenter={isCenter} />
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <p
        className="text-center text-[9px] uppercase tracking-[0.22em] mt-8"
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

/**
 * CartaView usa width em px e escala internamente.
 * Aqui ajustamos o tamanho conforme o slot (centro maior) e o viewport.
 * Em mobile, cartas laterais menores pra todas caberem.
 */
function ResponsiveCarta({ carta, isCenter }: { carta: Carta; isCenter: boolean }) {
  // Mobile (< sm): laterais ~95px, centro ~120px
  // Tablet / desktop: laterais ~145px, centro ~180px
  const baseClass = isCenter
    ? 'w-[120px] sm:w-[160px] md:w-[180px]'
    : 'w-[95px] sm:w-[140px] md:w-[145px]'

  // Width que o CartaView usa internamente pra escalar — corresponde
  // ao tamanho final desejado. Como CartaView aplica `transform: scale()`
  // ela precisa do width em px. Fixamos no maior breakpoint e o CSS
  // de width acima cuida do scaling final no container.
  const designWidth = isCenter ? 180 : 145

  return (
    <div className={baseClass}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <CartaView carta={carta} width={designWidth} />
      </div>
    </div>
  )
}
