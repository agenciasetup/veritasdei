import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { getTop30Santos } from '@/lib/santos/queries'
import SantoCoverFallback from '@/components/devocao/SantoCoverFallback'
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {top30.map(santo => (
              <Link
                key={santo.id}
                href={`/santos/${santo.slug}`}
                className="group relative overflow-hidden rounded-xl active:scale-[0.98] transition-transform"
                style={{
                  aspectRatio: '3 / 4',
                  border: '1px solid rgba(242,237,228,0.12)',
                }}
              >
                {santo.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={santo.imagem_url}
                    alt={santo.nome}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : (
                  <SantoCoverFallback nome={santo.nome} invocacao={santo.invocacao} />
                )}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 p-2.5 pt-10"
                  style={{
                    background: 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.55) 60%, transparent 100%)',
                  }}
                >
                  <div
                    className="truncate"
                    style={{
                      fontFamily: 'Cinzel, Georgia, serif',
                      color: '#F2EDE4',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      lineHeight: 1.15,
                    }}
                  >
                    {santo.nome}
                  </div>
                  {santo.patronatos && santo.patronatos.length > 0 && (
                    <div
                      className="truncate mt-0.5"
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        color: 'rgba(242,237,228,0.6)',
                        fontSize: '0.62rem',
                      }}
                    >
                      {santo.patronatos.slice(0, 2).join(' · ')}
                    </div>
                  )}
                </div>
                <div
                  className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    background: 'rgba(201,168,76,0.9)',
                    color: '#0A0A0A',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  <Heart className="w-2.5 h-2.5" fill="#0A0A0A" />
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
