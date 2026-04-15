import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import type { ReactNode } from 'react'

import { EyebrowTag } from '../components/EyebrowTag'

interface DevotionSectionProps {
  tone: 'dark' | 'light'
  eyebrow: string
  title: string
  titleEm: string
  description: string
  href: string
  features: readonly string[]
  mockup: ReactNode
  reverse?: boolean
}

export function DevotionSection({
  tone,
  eyebrow,
  title,
  titleEm,
  description,
  href,
  features,
  mockup,
  reverse = false,
}: DevotionSectionProps) {
  const isDark = tone === 'dark'
  const surface = isDark ? 'surface-velvet' : 'surface-parchment'
  const headingColor = isDark ? '#F5EFE6' : 'var(--ink)'
  const emColor = isDark ? '#E6D9B5' : '#5A1625'
  const bodyColor = isDark ? 'rgba(242,237,228,0.72)' : 'var(--ink-soft)'
  const ruleColor = isDark ? 'rgba(201,168,76,0.5)' : 'rgba(90,22,37,0.4)'
  const checkColor = isDark ? '#C9A84C' : '#5A1625'

  return (
    <section className={`${surface} relative py-24 md:py-32 overflow-hidden`}>
      <div className="relative max-w-6xl mx-auto px-5 md:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Text column */}
        <div className={reverse ? 'lg:order-2' : ''}>
          <EyebrowTag tone={isDark ? 'gold' : 'light'} className="mb-6">
            {eyebrow}
          </EyebrowTag>

          <h2
            className="display-cormorant text-4xl md:text-5xl lg:text-[56px] leading-[1.05] mb-5"
            style={{ color: headingColor, textWrap: 'balance' }}
          >
            {title}{' '}
            <span className="italic block md:inline" style={{ color: emColor }}>
              {titleEm}
            </span>
          </h2>

          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-px" style={{ background: ruleColor }} />
            <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden>
              <circle cx="3" cy="3" r="2" fill={isDark ? '#C9A84C' : '#5A1625'} />
            </svg>
          </div>

          <p
            className="text-lg md:text-xl mb-8 max-w-xl"
            style={{
              color: bodyColor,
              fontFamily: 'Cormorant Garamond, serif',
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>

          {/* Features list */}
          <ul className="space-y-3 mb-10">
            {features.map(item => (
              <li
                key={item}
                className="flex items-start gap-3 text-base"
                style={{
                  color: bodyColor,
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '17px',
                }}
              >
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                  style={{
                    background: isDark ? 'rgba(201,168,76,0.12)' : 'rgba(90,22,37,0.08)',
                    border: `1px solid ${isDark ? 'rgba(201,168,76,0.35)' : 'rgba(90,22,37,0.28)'}`,
                  }}
                >
                  <Check className="w-3 h-3" style={{ color: checkColor }} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/login?tab=registro&next=${encodeURIComponent(href)}`}
              className={
                isDark
                  ? 'btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-[12px]'
                  : 'inline-flex items-center gap-2 rounded-full px-6 py-3 text-[12px] font-semibold'
              }
              style={
                isDark
                  ? undefined
                  : {
                      background: 'linear-gradient(135deg, #5A1625 0%, #3D0F1A 100%)',
                      color: '#F5EFE6',
                      fontFamily: 'Cinzel, serif',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      boxShadow: '0 14px 34px rgba(90,22,37,0.3)',
                    }
              }
            >
              Criar conta gratuita
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href={`/login?tab=login&next=${encodeURIComponent(href)}`}
              className="text-sm underline underline-offset-4"
              style={{
                color: isDark ? '#D9C077' : '#5A1625',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* Mockup column */}
        <div className={`relative ${reverse ? 'lg:order-1' : ''}`}>
          <div
            className={`relative ${isDark ? 'mockup-frame-dark' : 'mockup-frame-light'} p-3 md:p-4 max-w-md mx-auto`}
          >
            {/* Top dots (fake window chrome) */}
            <div className="flex items-center gap-1.5 px-2 pb-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: isDark ? 'rgba(201,168,76,0.35)' : 'rgba(90,22,37,0.3)' }}
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: isDark ? 'rgba(201,168,76,0.22)' : 'rgba(90,22,37,0.2)' }}
              />
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: isDark ? 'rgba(201,168,76,0.15)' : 'rgba(90,22,37,0.15)' }}
              />
              <div className="flex-1 h-px ml-2" style={{ background: ruleColor, opacity: 0.3 }} />
            </div>

            {mockup}
          </div>

          {/* Glow behind mockup */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: isDark
                ? 'radial-gradient(60% 60% at 50% 50%, rgba(201,168,76,0.14), transparent 70%)'
                : 'radial-gradient(60% 60% at 50% 50%, rgba(90,22,37,0.12), transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
        </div>
      </div>
    </section>
  )
}
