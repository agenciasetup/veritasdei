import { QUOTE_COPY } from '../copy'
import { FleurDeLis, QuatrefoilOrnament } from '../components/GothicOrnaments'

export function QuoteSection() {
  return (
    <section className="surface-parchment relative py-24 md:py-36 overflow-hidden">
      {/* Decorative ornaments */}
      <QuatrefoilOrnament
        className="absolute top-10 left-[8%] w-28 hidden lg:block"
        color="#5A1625"
        opacity={0.1}
      />
      <QuatrefoilOrnament
        className="absolute bottom-10 right-[8%] w-28 hidden lg:block"
        color="#5A1625"
        opacity={0.1}
      />

      <div className="relative max-w-4xl mx-auto px-6 md:px-8 text-center">
        {/* Top ornament */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span
            className="w-20 md:w-32 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(90,22,37,0.45))' }}
          />
          <FleurDeLis className="w-10" color="#5A1625" opacity={0.8} />
          <span
            className="w-20 md:w-32 h-px"
            style={{ background: 'linear-gradient(to left, transparent, rgba(90,22,37,0.45))' }}
          />
        </div>

        {/* Eyebrow */}
        <p
          className="eyebrow-label mb-8"
          style={{ color: '#5A1625', letterSpacing: '0.32em' }}
        >
          {QUOTE_COPY.eyebrow}
        </p>

        {/* Large decorative quote mark */}
        <div
          className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[320px] md:text-[420px] pointer-events-none"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            color: 'rgba(90,22,37,0.055)',
            lineHeight: 0.7,
            fontWeight: 700,
          }}
          aria-hidden
        >
          &ldquo;
        </div>

        {/* Quote text */}
        <blockquote
          className="relative display-cormorant italic text-3xl md:text-[42px] lg:text-[48px] leading-[1.25] mb-10"
          style={{ color: 'var(--ink)', textWrap: 'balance', fontWeight: 500 }}
        >
          <span
            className="inline-block text-5xl md:text-7xl align-top leading-none mr-2"
            style={{ color: '#5A1625', opacity: 0.6 }}
            aria-hidden
          >
            &ldquo;
          </span>
          {QUOTE_COPY.text}
          <span
            className="inline-block text-5xl md:text-7xl align-bottom leading-none ml-2"
            style={{ color: '#5A1625', opacity: 0.6 }}
            aria-hidden
          >
            &rdquo;
          </span>
        </blockquote>

        {/* Attribution */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="w-10 h-px" style={{ background: 'rgba(90,22,37,0.5)' }} />
            <span
              className="eyebrow-label"
              style={{ color: '#5A1625', letterSpacing: '0.28em' }}
            >
              {QUOTE_COPY.author}
            </span>
            <span className="w-10 h-px" style={{ background: 'rgba(90,22,37,0.5)' }} />
          </div>
          <p
            className="text-sm italic"
            style={{
              color: 'var(--ink-muted)',
              fontFamily: 'Cormorant Garamond, serif',
            }}
          >
            {QUOTE_COPY.source}
          </p>
        </div>

        {/* Bottom ornament */}
        <div className="flex items-center justify-center gap-4 mt-14">
          <span
            className="w-20 md:w-32 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(90,22,37,0.35))' }}
          />
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <g stroke="#5A1625" fill="none" strokeWidth="1">
              <circle cx="7" cy="7" r="5" />
              <circle cx="7" cy="7" r="1.5" fill="#5A1625" />
            </g>
          </svg>
          <span
            className="w-20 md:w-32 h-px"
            style={{ background: 'linear-gradient(to left, transparent, rgba(90,22,37,0.35))' }}
          />
        </div>
      </div>
    </section>
  )
}
