import Link from 'next/link'
import { NOVENAS_CATALOG } from '@/features/novenas/data/catalog'

export const metadata = {
  title: 'Novenas — Veritas Dei',
  description: 'Reze novenas tradicionais da Igreja Católica. Escolha entre 7 novenas e acompanhe seu progresso diário.',
}

export default function NovenasPage() {
  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: '#0F0E0C', color: '#F2EDE4' }}
    >
      <div className="bg-glow" aria-hidden />

      <div className="relative z-10 mx-auto max-w-2xl fade-in">
        <header className="mb-10 text-center">
          <h1
            className="text-3xl md:text-4xl tracking-wide"
            style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
          >
            Novenas
          </h1>
          <p className="mt-2 text-sm" style={{ color: '#7A7368' }}>
            Nove dias de oração, confiança e entrega
          </p>
          <div className="ornament-divider max-w-xs mx-auto mt-4">
            <span>&#10022;</span>
          </div>
        </header>

        <section aria-label="Catálogo de novenas" className="grid gap-4 stagger-in">
          {NOVENAS_CATALOG.map((novena) => (
            <Link
              key={novena.slug}
              href={`/novenas/${novena.slug}`}
              aria-label={`${novena.titulo} — ${novena.subtitulo}`}
              className="block rounded-2xl p-5 transition-all hover:scale-[1.01]"
              style={{
                background: 'rgba(20, 18, 14, 0.6)',
                border: '1px solid rgba(201, 168, 76, 0.18)',
              }}
            >
              <h2
                className="text-lg md:text-xl"
                style={{ color: '#F2EDE4', fontFamily: 'Cinzel, serif' }}
              >
                {novena.titulo}
              </h2>
              <p className="mt-1 text-sm" style={{ color: '#D9C077' }}>
                {novena.subtitulo}
              </p>
              <p className="mt-2 text-xs leading-relaxed line-clamp-2" style={{ color: '#7A7368' }}>
                {novena.descricao}
              </p>
              <p className="mt-2 text-xs" style={{ color: '#B8AFA2' }}>
                {novena.periodoSugerido}
              </p>
            </Link>
          ))}
        </section>

        <nav aria-label="Navegação de novenas" className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/novenas/minhas"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.35)',
              color: '#D9C077',
            }}
          >
            Minhas novenas em curso
          </Link>
          <Link
            href="/novenas/custom"
            className="rounded-lg border px-5 py-2.5 text-sm transition"
            style={{
              borderColor: 'rgba(201, 168, 76, 0.15)',
              color: '#7A7368',
            }}
          >
            Criar novena personalizada
          </Link>
        </nav>
      </div>
    </main>
  )
}
