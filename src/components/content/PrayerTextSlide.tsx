'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function PrayerTextSlide({ name, text }: { name: string; text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try { await navigator.clipboard.writeText(`${name}\n\n${text}`) } catch { /* ok */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col justify-center min-h-[58vh] py-8">
      <h3
        className="text-sm tracking-[0.15em] uppercase mb-8 flex items-center gap-3"
        style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
      >
        Texto da Oração
      </h3>
      <div
        className="text-xl md:text-2xl leading-[2.2] whitespace-pre-line"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: '#E8E2D8', fontWeight: 500 }}
      >
        {text}
      </div>
      <button
        onClick={handleCopy}
        className="mt-8 self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm tracking-wider transition-all duration-200"
        style={{
          background: copied ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.15)',
          color: copied ? '#C9A84C' : '#7A7368',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado!' : 'Copiar oração'}
      </button>
    </div>
  )
}
