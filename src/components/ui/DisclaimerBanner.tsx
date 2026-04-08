'use client'

import { Info } from 'lucide-react'

interface DisclaimerBannerProps {
  visible: boolean
}

export default function DisclaimerBanner({ visible }: DisclaimerBannerProps) {
  if (!visible) return null

  return (
    <div
      className="w-full max-w-4xl mx-auto mt-6 rounded-lg border px-4 py-3 flex items-start gap-3"
      style={{ backgroundColor: '#FFF8F0', borderColor: '#D4A96A' }}
    >
      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#5C2D0E' }} />
      <div className="text-sm text-gray-700">
        <p>
          Este tema pode envolver questões pessoais de fé. Para orientação pastoral, procure um pároco.
        </p>
        <a
          href="https://paroquias.org.br"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-1 text-sm font-medium underline"
          style={{ color: '#5C2D0E' }}
        >
          Encontrar paróquia
        </a>
      </div>
    </div>
  )
}
