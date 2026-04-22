import type { Metadata } from 'next'
import PedidosOracaoFeed from './PedidosOracaoFeed'

export const metadata: Metadata = {
  title: 'Pedidos de oração · Veritas Dei',
  description: 'Orai uns pelos outros. Peça oração ou reze pela intenção de um irmão.',
  alternates: { canonical: '/pedidos-oracao' },
}

export default function PedidosOracaoPage() {
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
            Pedidos de Oração
          </h1>
          <p
            className="italic"
            style={{
              color: 'rgba(242,237,228,0.65)',
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '0.95rem',
            }}
          >
            &ldquo;Orai uns pelos outros, para serdes salvos.&rdquo; <span style={{ opacity: 0.75 }}>— Tg 5,16</span>
          </p>
        </header>

        <PedidosOracaoFeed />
      </div>
    </div>
  )
}
