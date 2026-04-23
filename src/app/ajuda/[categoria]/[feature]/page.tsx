import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Lightbulb } from 'lucide-react'
import type { Metadata } from 'next'
import AuthGuard from '@/components/auth/AuthGuard'
import {
  CATEGORIAS,
  FEATURES,
  getCategoria,
  getFeature,
} from '@/data/ajuda'
import AjudaIcon from '@/components/ajuda/AjudaIcon'

type PageProps = {
  params: Promise<{ categoria: string; feature: string }>
}

export async function generateStaticParams() {
  return FEATURES.map((f) => ({ categoria: f.categoria, feature: f.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria, feature } = await params
  const f = getFeature(categoria, feature)
  if (!f) return { title: 'Ajuda · Veritas Dei' }
  return {
    title: `${f.titulo} · Ajuda · Veritas Dei`,
    description: f.resumo,
  }
}

export default async function AjudaFeaturePage({ params }: PageProps) {
  const { categoria, feature } = await params
  const f = getFeature(categoria, feature)
  if (!f) notFound()
  const cat = getCategoria(f.categoria)!

  return (
    <AuthGuard>
      <main className="min-h-screen pb-24">
        <div className="px-4 pt-4 max-w-2xl mx-auto">
          <Link
            href={`/ajuda/${cat.slug}`}
            className="inline-flex items-center gap-1.5 text-sm py-2 -ml-1 active:scale-[0.98]"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            {cat.titulo}
          </Link>

          <div className="mt-3 mb-5 flex items-start gap-3">
            <div
              className="flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{
                width: '52px',
                height: '52px',
                background: 'var(--surface-3)',
                border: '1px solid var(--border-2)',
                color: 'var(--text-2)',
              }}
            >
              <AjudaIcon name={f.icone} className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-[22px] leading-tight"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {f.titulo}
              </h1>
              <p
                className="text-[14px] mt-1"
                style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
              >
                {f.resumo}
              </p>
            </div>
          </div>

          <Section title="Como acessar">
            <p
              className="text-[14.5px] leading-relaxed"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            >
              {f.comoAcessar}
            </p>
            {f.rota && (
              <Link
                href={f.rota}
                className="mt-3 inline-flex items-center gap-1.5 text-sm py-2 px-3 rounded-xl active:scale-[0.98]"
                style={{
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                }}
              >
                Abrir agora
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            )}
          </Section>

          <Section title="Passo a passo">
            <ol className="flex flex-col gap-3">
              {f.passos.map((passo, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex-shrink-0 flex items-center justify-center text-[12px] font-semibold rounded-full"
                    style={{
                      width: '22px',
                      height: '22px',
                      background: 'var(--surface-3)',
                      color: 'var(--text-2)',
                      fontFamily: 'var(--font-body)',
                      marginTop: '1px',
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    className="text-[14.5px] leading-relaxed flex-1"
                    style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
                  >
                    {passo}
                  </p>
                </li>
              ))}
            </ol>
          </Section>

          {f.dicas && f.dicas.length > 0 && (
            <Section title="Dicas">
              <ul className="flex flex-col gap-2.5">
                {f.dicas.map((dica, i) => (
                  <li key={i} className="flex gap-2.5 items-start">
                    <Lightbulb
                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                      style={{ color: 'var(--accent)' }}
                    />
                    <p
                      className="text-[14px] leading-relaxed flex-1"
                      style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
                    >
                      {dica}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <RelacionadosNav categoriaSlug={cat.slug} currentSlug={f.slug} />
        </div>
      </main>
    </AuthGuard>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="mb-4 p-4 rounded-2xl"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      <h2
        className="text-[11px] uppercase tracking-[0.12em] mb-2.5"
        style={{
          color: 'var(--text-3)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function RelacionadosNav({
  categoriaSlug,
  currentSlug,
}: {
  categoriaSlug: string
  currentSlug: string
}) {
  const irmaos = FEATURES.filter(
    (f) => f.categoria === categoriaSlug && f.slug !== currentSlug,
  ).slice(0, 3)
  if (irmaos.length === 0) return null
  const cat = getCategoria(categoriaSlug)!
  return (
    <section className="mt-2">
      <h2
        className="text-[11px] uppercase tracking-[0.12em] mb-2 px-1"
        style={{
          color: 'var(--text-3)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
        }}
      >
        Veja também em {cat.titulo}
      </h2>
      <div className="flex flex-col gap-1.5">
        {irmaos.map((f) => (
          <Link
            key={f.slug}
            href={`/ajuda/${cat.slug}/${f.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl active:scale-[0.985]"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border-1)',
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{
                width: '34px',
                height: '34px',
                background: 'var(--surface-3)',
                color: 'var(--text-2)',
              }}
            >
              <AjudaIcon name={f.icone} className="w-4 h-4" />
            </div>
            <p
              className="text-[14px] flex-1 truncate"
              style={{
                color: 'var(--text-1)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
              }}
            >
              {f.titulo}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
