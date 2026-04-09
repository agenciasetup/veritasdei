'use client'

import { Info } from 'lucide-react'

interface DisclaimerBannerProps {
  visible: boolean
}

export default function DisclaimerBanner({ visible }: DisclaimerBannerProps) {
  if (!visible) return null

  return (
    <div className="disclaimer-banner w-full max-w-7xl mx-auto mt-8 px-6 py-5 flex items-start gap-4 fade-in">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
        style={{
          background: 'rgba(107, 29, 42, 0.2)',
          border: '1px solid rgba(107, 29, 42, 0.3)',
        }}
      >
        <Info className="w-5 h-5" style={{ color: '#8B3145' }} />
      </div>
      <div>
        <p
          className="text-base leading-relaxed"
          style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}
        >
          Este tema pode envolver questões pessoais de fé. Para orientação pastoral, procure um pároco.
        </p>
        <a
          href="https://paroquias.org.br"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-sm font-medium underline underline-offset-4 transition-colors duration-200"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          Encontrar paróquia
        </a>
      </div>
    </div>
  )
}
