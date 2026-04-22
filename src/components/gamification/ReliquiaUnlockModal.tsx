'use client'

import Image from 'next/image'
import { Sparkles, X } from 'lucide-react'

export interface ReliquiaUnlockData {
  id: string
  slug: string
  name: string
  description: string
  lore: string | null
  image_url: string | null
  rarity: 'comum' | 'rara' | 'epica' | 'lendaria'
}

const RARITY_STYLE: Record<ReliquiaUnlockData['rarity'], { color: string; glow: string; label: string }> = {
  comum: { color: '#B8A488', glow: 'rgba(184,164,136,0.4)', label: 'Comum' },
  rara: { color: '#7BA5C9', glow: 'rgba(123,165,201,0.5)', label: 'Rara' },
  epica: { color: '#B97BC9', glow: 'rgba(185,123,201,0.5)', label: 'Épica' },
  lendaria: { color: '#C9A84C', glow: 'rgba(201,168,76,0.6)', label: 'Lendária' },
}

export default function ReliquiaUnlockModal({
  reliquia,
  onClose,
}: {
  reliquia: ReliquiaUnlockData
  onClose: () => void
}) {
  const style = RARITY_STYLE[reliquia.rarity]

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        className="relative w-full max-w-md p-8 rounded-2xl text-center fade-in"
        style={{
          background: 'rgba(15,14,12,0.98)',
          border: `1px solid ${style.color}`,
          boxShadow: `0 0 80px ${style.glow}`,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-white/5"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        <div className="flex justify-center mb-2">
          <Sparkles className="w-5 h-5" style={{ color: style.color }} />
        </div>
        <p
          className="text-xs tracking-[0.25em] uppercase mb-5"
          style={{ color: style.color, fontFamily: 'Cinzel, serif' }}
        >
          Selo conquistado · {style.label}
        </p>

        {reliquia.image_url ? (
          <div className="flex justify-center mb-5">
            <div
              className="relative w-28 h-28 rounded-full overflow-hidden"
              style={{
                border: `2px solid ${style.color}`,
                boxShadow: `0 0 40px ${style.glow}`,
              }}
            >
              <Image
                src={reliquia.image_url}
                alt={reliquia.name}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}

        <h2
          className="text-2xl mb-3"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}
        >
          {reliquia.name}
        </h2>
        <p
          className="text-sm leading-relaxed mb-3"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
        >
          {reliquia.description}
        </p>
        {reliquia.lore ? (
          <p
            className="text-xs italic leading-relaxed px-2"
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'Cormorant Garamond, serif',
            }}
          >
            “{reliquia.lore}”
          </p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
            color: '#0F0E0C',
            fontFamily: 'Cinzel, serif',
            fontWeight: 600,
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
