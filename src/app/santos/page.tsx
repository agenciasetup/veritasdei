import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { getTop30Santos } from '@/lib/santos/queries'
import SantoCardImage from '@/components/devocao/SantoCardImage'
import SantosSearch from './SantosSearch'

export const revalidate = 3600

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.veritasdei.com.br'

export const metadata: Metadata = {
  title: 'Santos e Beatos · Veritas Dei',
  description:
    'Catálogo de santos e beatos da Igreja Católica — biografias, orações de devoção e patronatos em português.',
  alternates: { canonical: '/santos' },
  openGraph: {
    type: 'website',
    title: 'Santos e Beatos · Veritas Dei',
    description: 'Escolha seu santo de devoção e conheça a história dele.',
    url: `${SITE}/santos`,
    siteName: 'Veritas Dei',
    locale: 'pt_BR',
  },
}

export default async function SantosPage() {
  const top30 = await getTop30Santos()

  return (
    <div className="min-h-screen px-4 py-8 pb-24 md:pb-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <h1
            className="text-3xl md:text-4xl mb-2 tracking-[0.05em] uppercase"
            style={{ fontFamily: 'Cinzel, Georgia, serif', color: '#F2EDE4' }}
          >
            Santos e Beatos
          </h1>
          <p
            className="text-sm max-w-xl mx-auto"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Catálogo da Igreja Católica. Escolha seu santo de devoção no seu perfil
            — a capa do seu perfil vira a imagem dele.
          </p>
        </header>

        <SantosSearch />

        <section className="mt-10">
          <div
            className="mb-4"
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: 'rgba(242,237,228,0.85)',
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Em destaque
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {top30.map((santo, idx) => (
              <Link
                key={santo.id}
                href={`/santos/${santo.slug}`}
                className="group relative overflow-hidden rounded-xl active:scale-[0.98] transition-transform"
                style={{
                  aspectRatio: '1 / 1',
                  border: '1px solid rgba(242,237,228,0.12)',
                }}
              >
                <SantoCardImage
                  imagemUrl={santo.imagem_url}
                  nome={santo.nome}
                  invocacao={santo.invocacao}
                  eager={idx < 6}
                />
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 px-2 py-1.5 pt-8"
                  style={{
                    background: 'linear-gradient(to top, rgba(10,10,10,0.94) 0%, rgba(10,10,10,0.5) 65%, transparent 100%)',
                  }}
                >
                  <div
                    className="truncate"
                    style={{
                      fontFamily: 'Cinzel, Georgia, serif',
                      color: '#F2EDE4',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      lineHeight: 1.15,
                    }}
                  >
                    {santo.nome}
                  </div>
                </div>
                <div
                  className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px]"
                  style={{
                    background: 'rgba(201,168,76,0.9)',
                    color: '#0A0A0A',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  <Heart className="w-2 h-2" fill="#0A0A0A" />
                  {santo.popularidade_rank}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
