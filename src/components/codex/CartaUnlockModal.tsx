'use client'

import { motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import CartaView from './CartaView'
import { RARIDADE_META, type Carta } from '@/types/codex'

// Momento da recompensa: a carta surge, gira e brilha. Quanto mais rara, mais
// intensa a celebração (glow puxado de RARIDADE_META).

export default function CartaUnlockModal({
  carta,
  onClose,
}: {
  carta: Carta
  onClose: () => void
}) {
  const meta = RARIDADE_META[carta.raridade]
  const accent = carta.cor_accent || meta.cor

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/88 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotateY: -90 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        className="relative flex flex-col items-center gap-5"
        style={{ perspective: 1000 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 rounded-lg"
          style={{ background: 'rgba(15,14,12,0.9)', color: '#8A8378' }}
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-xs tracking-[0.28em] uppercase flex items-center gap-2"
          style={{ color: accent, fontFamily: 'Cinzel, serif' }}
        >
          <Sparkles className="w-4 h-4" />
          Nova carta · {meta.label}
        </motion.p>

        <CartaView carta={carta} width={300} />

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
            color: '#0F0E0C',
            fontFamily: 'Cinzel, serif',
            fontWeight: 600,
          }}
        >
          Adicionar à coleção
        </motion.button>
      </motion.div>
    </div>
  )
}
