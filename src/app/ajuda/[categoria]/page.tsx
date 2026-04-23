import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import AuthGuard from '@/components/auth/AuthGuard'
import {
  CATEGORIAS,
  getCategoria,
  getFeaturesByCategoria,
  type AjudaCategoriaSlug,
} from '@/data/ajuda'
import AjudaIcon from '@/components/ajuda/AjudaIcon'

type PageProps = {
  params: Promise<{ categoria: string }>
}

export async function generateStaticParams() {
  return CATEGORIAS.map((c) => ({ categoria: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria } = await params
  const cat = getCategoria(categoria)
  if (!cat) return { title: 'Ajuda · Veritas Dei' }
  return {
    title: `Ajuda · ${cat.titulo} · Veritas Dei`,
    description: cat.descricao,
  }
}

export default async function AjudaCategoriaPage({ params }: PageProps) {
  const { categoria } = await params
  const cat = getCategoria(categoria)
  if (!cat) notFound()
  const features = getFeaturesByCategoria(categoria as AjudaCategoriaSlug)

  return (
    <AuthGuard>
      <main className="min-h-screen pb-24">
        <div className="px-4 pt-4 max-w-2xl mx-auto">
          <Link
            href="/ajuda"
            className="inline-flex items-center gap-1.5 text-sm py-2 -ml-1 active:scale-[0.98]"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Ajuda
          </Link>

          <div className="mt-3 mb-5 flex items-center gap-3">
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
              <AjudaIcon name={cat.icone} className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl"
                style={{
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {cat.titulo}
              </h1>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
              >
                {cat.descricao}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {features.map((f) => (
              <Link
                key={f.slug}
                href={`/ajuda/${cat.slug}/${f.slug}`}
                className="flex items-center gap-3 p-3 rounded-2xl transition-transform duration-150 ease-out active:scale-[0.985]"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-1)',
                  minHeight: '64px',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--surface-3)',
                    color: 'var(--text-2)',
                  }}
                >
                  <AjudaIcon name={f.icone} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14.5px] truncate"
                    style={{
                      color: 'var(--text-1)',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {f.titulo}
                  </p>
                  <p
                    className="text-[12.5px] mt-0.5 truncate"
                    style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                  >
                    {f.resumo}
                  </p>
                </div>
                <ChevronRight
                  className="w-[18px] h-[18px] flex-shrink-0"
                  strokeWidth={2}
                  style={{ color: 'var(--text-3)' }}
                />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
