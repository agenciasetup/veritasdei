import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getNovenaBySlugl, NOVENAS_CATALOG } from '@/features/novenas/data/catalog'
import { NovenaStartButton } from '@/features/novenas/components/NovenaStartButton'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return NOVENAS_CATALOG.map((n) => ({ slug: n.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const novena = getNovenaBySlugl(slug)
  if (!novena) return { title: 'Novena não encontrada — Veritas Dei' }
  return {
    title: `${novena.titulo} — Veritas Dei`,
    description: novena.descricao,
  }
}

export default async function NovenaSlugPage({ params }: Props) {
  const { slug } = await params
  const novena = getNovenaBySlugl(slug)
  if (!novena) notFound()

  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl fade-in">
        <header className="mb-8 text-center">
          <Link
            href="/novenas"
            className="inline-block mb-4 text-xs transition"
            style={{ color: '#7A7368' }}
          >
            &larr; Todas as novenas
          </Link>
          <h1
            className="text-2xl md:text-3xl tracking-wide"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            {novena.titulo}
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#D9C077' }}>
            {novena.subtitulo}
          </p>
          <div className="ornament-divider max-w-xs mx-auto mt-4">
            <span>&#10022;</span>
          </div>
        </header>

        <section
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(20, 18, 14, 0.6)',
            border: '1px solid rgba(201, 168, 76, 0.18)',
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: '#B8AFA2' }}>
            {novena.descricao}
          </p>
          <p className="mt-3 text-xs" style={{ color: '#7A7368' }}>
            Período sugerido: {novena.periodoSugerido}
          </p>
        </section>

        <section className="mb-6">
          <h2
            className="text-lg mb-4"
            style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
          >
            Os 9 dias
          </h2>
          <div className="grid gap-3">
            {novena.dias.map((dia, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(20, 18, 14, 0.4)',
                  border: '1px solid rgba(201, 168, 76, 0.1)',
                }}
              >
                <h3 className="text-sm font-medium" style={{ color: '#F2EDE4' }}>
                  {dia.titulo}
                </h3>
                <p
                  className="mt-1 text-xs leading-relaxed line-clamp-3"
                  style={{ color: '#7A7368' }}
                >
                  {dia.texto.slice(0, 150)}...
                </p>
              </div>
            ))}
          </div>
        </section>

        {novena.oracaoInicial && (
          <section
            className="rounded-2xl p-5 mb-6"
            style={{
              background: 'rgba(20, 18, 14, 0.6)',
              border: '1px solid rgba(201, 168, 76, 0.12)',
              borderLeft: '3px solid rgba(201, 168, 76, 0.4)',
            }}
          >
            <h3
              className="text-sm mb-2"
              style={{ color: '#D9C077', fontFamily: 'Cinzel, serif' }}
            >
              Oração Inicial
            </h3>
            <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: '#B8AFA2' }}>
              {novena.oracaoInicial}
            </p>
          </section>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <NovenaStartButton slug={novena.slug} titulo={novena.titulo} />
          <Link
            href="/novenas"
            className="text-xs transition"
            style={{ color: '#7A7368' }}
          >
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    </main>
  )
}
