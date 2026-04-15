import { HeartHandshake, Sparkles } from 'lucide-react'

import { DONATION_COPY } from '../copy'
import { EyebrowTag } from '../components/EyebrowTag'
import { GothicCross } from '../components/GothicOrnaments'

export function DonationSection() {
  return (
    <section className="surface-wine relative py-24 md:py-32 overflow-hidden">
      <GothicCross
        className="absolute top-10 left-[12%] w-16 hidden lg:block float-slow"
        opacity={0.35}
      />
      <GothicCross
        className="absolute bottom-10 right-[12%] w-16 hidden lg:block float-slow"
        opacity={0.35}
      />

      <div className="relative max-w-5xl mx-auto px-5 md:px-8">
        <div className="card-noble-dark p-8 md:p-14 text-center">
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(90,22,37,0.22))',
                border: '1px solid rgba(201,168,76,0.4)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 30px rgba(201,168,76,0.2)',
              }}
            >
              <HeartHandshake className="w-7 h-7" style={{ color: '#E6D9B5' }} />
            </div>
          </div>

          <EyebrowTag tone="gold" className="mb-6">
            {DONATION_COPY.eyebrow}
          </EyebrowTag>

          <h2
            className="display-cormorant text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6"
            style={{ color: '#F5EFE6', textWrap: 'balance' }}
          >
            {DONATION_COPY.title}{' '}
            <span className="italic block md:inline" style={{ color: '#E6D9B5' }}>
              {DONATION_COPY.titleEm}
            </span>
          </h2>

          <div className="flex items-center justify-center gap-3 mb-6">
            <span
              className="w-16 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.6))' }}
            />
            <Sparkles className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
            <span
              className="w-16 h-px"
              style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.6))' }}
            />
          </div>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{
              color: 'rgba(242,237,228,0.75)',
              fontFamily: 'Cormorant Garamond, serif',
              lineHeight: 1.55,
            }}
          >
            {DONATION_COPY.lead}
          </p>

          {/* Methods preview */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-8">
            {DONATION_COPY.methods.map((m, i) => (
              <div key={m} className="flex items-center gap-3">
                {i > 0 && (
                  <span
                    className="w-px h-4 hidden md:inline-block"
                    style={{ background: 'rgba(201,168,76,0.3)' }}
                  />
                )}
                <span
                  className="eyebrow-label"
                  style={{ color: '#D9C077', letterSpacing: '0.22em' }}
                >
                  {m}
                </span>
              </div>
            ))}
          </div>

          {/* Soon badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px dashed rgba(201,168,76,0.45)',
              color: '#E6D9B5',
              fontFamily: 'Cinzel, serif',
              fontSize: '11px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full glow-pulse"
              style={{ background: '#C9A84C' }}
            />
            {DONATION_COPY.soon}
          </div>
        </div>
      </div>
    </section>
  )
}
