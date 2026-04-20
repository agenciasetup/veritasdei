import Link from 'next/link'
import { NOVENAS_CATALOG } from '@/features/novenas/data/catalog'
import Divider from '@/components/ui/Divider'

export const metadata = {
  title: 'Novenas — Veritas Dei',
  description: 'Reze novenas tradicionais da Igreja Católica. Escolha entre 7 novenas e acompanhe seu progresso diário.',
}

export default function NovenasPage() {
  return (
    <main
      className="relative min-h-screen w-full px-4 py-10 md:py-14"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      <div className="relative z-10 mx-auto max-w-2xl fade-in">
        <header className="mb-8 text-center">
          <h1
            className="text-3xl md:text-4xl tracking-[0.1em] uppercase"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Novenas
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Nove dias de oração, confiança e entrega
          </p>
          <Divider variant="ornament" className="max-w-[180px] mx-auto" spacing="default" />
        </header>

        <section aria-label="Catálogo de novenas" className="grid gap-3 stagger-in">
          {NOVENAS_CATALOG.map((novena) => (
            <Link
              key={novena.slug}
              href={`/novenas/${novena.slug}`}
              aria-label={`${novena.titulo} — ${novena.subtitulo}`}
              className="block rounded-2xl p-5 transition-transform duration-150 ease-out active:scale-[0.99]"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-1)',
              }}
            >
              <h2
                className="text-lg md:text-xl tracking-[0.04em]"
                style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)', fontWeight: 600 }}
              >
                {novena.titulo}
              </h2>
              <p
                className="mt-1 text-sm"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
              >
                {novena.subtitulo}
              </p>
              <p
                className="mt-2 text-xs leading-relaxed line-clamp-2"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                {novena.descricao}
              </p>
              <p
                className="mt-2 text-xs"
                style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
              >
                {novena.periodoSugerido}
              </p>
            </Link>
          ))}
        </section>

        <nav aria-label="Navegação de novenas" className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/novenas/minhas"
            className="rounded-xl px-5 py-2.5 text-sm transition-colors"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-soft)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            Minhas novenas em curso
          </Link>
          <Link
            href="/novenas/custom"
            className="rounded-xl px-5 py-2.5 text-sm transition-colors"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-1)',
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            Criar novena personalizada
          </Link>
        </nav>
      </div>
    </main>
  )
}
