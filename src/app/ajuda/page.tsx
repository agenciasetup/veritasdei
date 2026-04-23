'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import HubHeader from '@/components/hubs/HubHeader'
import AuthGuard from '@/components/auth/AuthGuard'
import PullToRefresh from '@/components/mobile/PullToRefresh'
import { CATEGORIAS, getFeaturesByCategoria } from '@/data/ajuda'
import AjudaIcon from '@/components/ajuda/AjudaIcon'
import AjudaSearch from '@/components/ajuda/AjudaSearch'

/**
 * `/ajuda` — central de ajuda. Lista as 6 categorias e expõe busca
 * por palavra-chave. Cada card leva pra `/ajuda/[categoria]`.
 */
export default function AjudaPage() {
  const router = useRouter()
  return (
    <AuthGuard>
      <main className="min-h-screen pb-24">
        <HubHeader
          title="Ajuda"
          subtitle="Aprenda a usar cada parte do app."
        />

        <PullToRefresh onRefresh={() => router.refresh()}>
          <div className="px-4 flex flex-col gap-4 max-w-2xl mx-auto stagger-in">
            <AjudaSearch />

            <div className="flex flex-col gap-3">
              {CATEGORIAS.map((cat) => {
                const count = getFeaturesByCategoria(cat.slug).length
                return (
                  <Link
                    key={cat.slug}
                    href={`/ajuda/${cat.slug}`}
                    className="flex items-center gap-4 p-4 rounded-2xl transition-transform duration-150 ease-out active:scale-[0.985]"
                    style={{
                      minHeight: '76px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-1)',
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-2xl flex-shrink-0"
                      style={{
                        width: '48px',
                        height: '48px',
                        background: 'var(--surface-3)',
                        border: '1px solid var(--border-2)',
                        color: 'var(--text-2)',
                      }}
                    >
                      <AjudaIcon name={cat.icone} className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[15px] truncate"
                        style={{
                          color: 'var(--text-1)',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 600,
                          letterSpacing: '-0.005em',
                        }}
                      >
                        {cat.titulo}
                      </p>
                      <p
                        className="text-[12.5px] mt-0.5 truncate"
                        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
                      >
                        {cat.descricao} · {count} {count === 1 ? 'guia' : 'guias'}
                      </p>
                    </div>
                    <ChevronRight
                      className="w-[18px] h-[18px] flex-shrink-0"
                      strokeWidth={2}
                      style={{ color: 'var(--text-3)' }}
                    />
                  </Link>
                )
              })}
            </div>
          </div>
        </PullToRefresh>
      </main>
    </AuthGuard>
  )
}
