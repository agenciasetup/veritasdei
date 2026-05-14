'use client'

import { Lock } from 'lucide-react'

// Slot de carta ainda não desbloqueada. Surpresa total: a RLS nem entrega os
// dados da carta, então só mostramos a silhueta selada — sem nome, sem arte,
// sem raridade.

export default function CartaSlotBloqueada({
  width = 200,
}: {
  width?: number
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2"
      style={{
        width,
        aspectRatio: '5 / 7',
        border: '2px solid rgba(242,237,228,0.06)',
        background:
          'linear-gradient(155deg, rgba(20,19,16,0.95) 0%, rgba(11,11,11,0.98) 100%)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: width * 0.26,
          height: width * 0.26,
          background: 'rgba(242,237,228,0.03)',
          border: '1px solid rgba(242,237,228,0.06)',
        }}
      >
        <Lock
          style={{ width: width * 0.09, height: width * 0.09, color: '#3E3A33' }}
        />
      </div>
      <p
        className="text-[10px] uppercase tracking-[0.18em]"
        style={{ fontFamily: 'Cinzel, serif', color: '#4A463F' }}
      >
        Selada
      </p>
    </div>
  )
}
