import type { Metadata } from 'next'
import GracasFeed from './GracasFeed'

export const metadata: Metadata = {
  title: 'Graças recebidas · Veritas Dei',
  description: 'Testemunhos de graças recebidas pela comunidade. A Igreja reconhece milagres por processo canônico formal.',
  alternates: { canonical: '/gracas' },
}

export default function GracasPage() {
  return (
    <div className="min-h-screen px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 text-center">
          <h1
            className="mb-2 tracking-[0.05em]"
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: '#F2EDE4',
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              fontWeight: 600,
            }}
          >
            Graças Recebidas
          </h1>
          <p
            className="italic max-w-md mx-auto"
            style={{
              color: 'rgba(242,237,228,0.65)',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '0.95rem',
              lineHeight: 1.55,
            }}
          >
            Testemunhos pessoais dos irmãos da comunidade. A Igreja reconhece milagres
            apenas por processo canônico formal — relatos aqui são partilhas de fé,
            não pronunciamento eclesiástico.
          </p>
        </header>

        <GracasFeed />
      </div>
    </div>
  )
}
