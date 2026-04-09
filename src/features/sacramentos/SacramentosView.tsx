'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SACRAMENTOS } from './data'
import SacramentoCard from './components/SacramentoCard'

export default function SacramentosView() {
  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="bg-glow" />

      {/* Header */}
      <header className="relative z-10 w-full pt-8 pb-4 px-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="theme-chip inline-flex items-center gap-2 !px-4 !py-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Início</span>
          </Link>
        </div>
      </header>

      {/* Title */}
      <section className="relative z-10 text-center px-4 pt-4 pb-8">
        <h1
          className="text-3xl md:text-4xl font-bold tracking-wider uppercase mb-3"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          Os Sete Sacramentos
        </h1>
        <p
          className="text-sm max-w-2xl mx-auto"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Sinais eficazes da graça, instituídos por Cristo e confiados à Igreja, pelos quais nos é dispensada a vida divina.
        </p>
        <div className="ornament-divider max-w-xs mx-auto mt-4">
          <span>&#10022;</span>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 flex-1 pb-16 max-w-3xl mx-auto px-4 w-full space-y-6">
        {SACRAMENTOS.map((sac, i) => (
          <div key={sac.id} className="fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
            <SacramentoCard sacramento={sac} />
          </div>
        ))}
      </main>

      <footer className="relative z-10 py-6 text-center">
        <p
          className="text-xs tracking-wider"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.1em' }}
        >
          Veritas Dei — Fonte: Catecismo da Igreja Católica
        </p>
      </footer>
    </div>
  )
}
