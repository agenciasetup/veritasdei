'use client'

import { Compass } from 'lucide-react'

export default function MapaHero() {
  return (
    <section className="relative z-10 pt-8 pb-4 px-4 text-center fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(217,192,119,0.06))',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          <Compass className="w-5 h-5" style={{ color: 'var(--gold)' }} />
        </div>

        <h1
          className="text-3xl md:text-4xl mb-3"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', letterSpacing: '0.04em' }}
        >
          MAPA DA FÉ
        </h1>

        <p
          className="text-sm md:text-base max-w-xl mx-auto leading-relaxed"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
        >
          Sua jornada pelos <strong style={{ color: 'var(--gold)' }}>7 pilares</strong> da fé católica.
          Estude no seu ritmo — marcamos o que você já aprendeu e mostramos o próximo passo.
        </p>

        <div className="ornament-divider max-w-[200px] mx-auto mt-5">
          <span>&#10022;</span>
        </div>
      </div>
    </section>
  )
}
