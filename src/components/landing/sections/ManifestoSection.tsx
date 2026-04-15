import { Church, HandHeart, Sparkles } from 'lucide-react'

import { MANIFESTO_COPY } from '../copy'
import { EyebrowTag } from '../components/EyebrowTag'
import { FleurDeLis } from '../components/GothicOrnaments'

const ICONS = [Church, Sparkles, HandHeart]

export function ManifestoSection() {
  return (
    <section className="surface-parchment relative py-24 md:py-32 overflow-hidden">
      {/* Decorative ornaments */}
      <FleurDeLis
        className="absolute top-10 right-10 w-20 hidden md:block"
        color="#5A1625"
        opacity={0.12}
      />
      <FleurDeLis
        className="absolute bottom-10 left-10 w-20 hidden md:block"
        color="#5A1625"
        opacity={0.12}
      />

      <div className="relative max-w-6xl mx-auto px-5 md:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <EyebrowTag tone="light" className="mb-6">
            {MANIFESTO_COPY.eyebrow}
          </EyebrowTag>

          <h2
            className="display-cormorant text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6"
            style={{ color: 'var(--ink)', textWrap: 'balance' }}
          >
            {MANIFESTO_COPY.title}
          </h2>

          <div className="flex items-center justify-center gap-3 mb-6">
            <span
              className="w-16 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(90,22,37,0.5))' }}
            />
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <circle cx="5" cy="5" r="2.5" fill="#5A1625" />
            </svg>
            <span
              className="w-16 h-px"
              style={{ background: 'linear-gradient(to left, transparent, rgba(90,22,37,0.5))' }}
            />
          </div>

          <p
            className="text-lg md:text-xl"
            style={{
              color: 'var(--ink-soft)',
              fontFamily: 'Cormorant Garamond, serif',
              lineHeight: 1.55,
            }}
          >
            {MANIFESTO_COPY.lead}
          </p>
        </div>

        {/* Pillars */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-10">
          {MANIFESTO_COPY.pillars.map((pillar, i) => {
            const Icon = ICONS[i]
            return (
              <article
                key={pillar.key}
                className="relative flex flex-col items-center text-center px-6 py-10 rounded-2xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,253,245,0.6), rgba(255,253,245,0.25))',
                  border: '1px solid rgba(90,22,37,0.14)',
                  boxShadow: '0 20px 50px rgba(90,22,37,0.08)',
                }}
              >
                {/* Roman numeral */}
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full"
                  style={{
                    background: 'var(--paper)',
                    border: '1px solid rgba(90,22,37,0.3)',
                    fontFamily: 'Cinzel, serif',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    color: '#5A1625',
                  }}
                >
                  {['I', 'II', 'III'][i]}
                </div>

                {/* Icon frame */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mt-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.14), rgba(90,22,37,0.08))',
                    border: '1px solid rgba(90,22,37,0.22)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: '#5A1625' }} />
                </div>

                <h3
                  className="display-cinzel text-lg mb-3 uppercase"
                  style={{ color: 'var(--ink)', fontWeight: 600, letterSpacing: '0.18em' }}
                >
                  {pillar.title}
                </h3>

                <div
                  className="w-10 h-px mb-4"
                  style={{ background: 'rgba(90,22,37,0.35)' }}
                />

                <p
                  className="text-base"
                  style={{
                    color: 'var(--ink-soft)',
                    fontFamily: 'Cormorant Garamond, serif',
                    lineHeight: 1.6,
                  }}
                >
                  {pillar.body}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
