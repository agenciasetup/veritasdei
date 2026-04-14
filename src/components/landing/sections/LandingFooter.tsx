import Link from 'next/link'

import { FOOTER_COPY } from '../copy'

export function LandingFooter() {
  return (
    <footer className="relative py-16" style={{ background: '#0A0806' }}>
      <div className="max-w-5xl mx-auto px-5 md:px-8 text-center">
        {/* Tagline */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span
            className="w-16 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.45))' }}
          />
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <circle cx="5" cy="5" r="2" fill="#C9A84C" opacity="0.7" />
          </svg>
          <span
            className="w-16 h-px"
            style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.45))' }}
          />
        </div>

        <p
          className="italic text-xl md:text-2xl mb-8"
          style={{
            color: '#E6D9B5',
            fontFamily: 'Cormorant Garamond, serif',
            letterSpacing: '0.02em',
          }}
        >
          {FOOTER_COPY.tagline}
        </p>

        <div className="flex items-center justify-center gap-5 mb-4">
          <Link
            href="/privacidade"
            className="text-xs underline underline-offset-4"
            style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}
          >
            {FOOTER_COPY.privacy}
          </Link>
          <span style={{ color: 'rgba(201,168,76,0.3)' }}>|</span>
          <Link
            href="/termos"
            className="text-xs underline underline-offset-4"
            style={{ color: '#8E867A', fontFamily: 'Poppins, sans-serif' }}
          >
            {FOOTER_COPY.terms}
          </Link>
        </div>

        <p
          className="text-[11px] uppercase tracking-[0.22em]"
          style={{ color: '#6B6459', fontFamily: 'Cinzel, serif' }}
        >
          {FOOTER_COPY.fidelity}
        </p>
      </div>
    </footer>
  )
}
