import { Heart } from 'lucide-react'
import Link from 'next/link'

import { resolvePrayerIcon } from './icon-map'
import { fetchUserFavorites } from './queries'

/**
 * Faixa horizontal "Minhas orações" — as favoritadas do usuário
 * logado. Server-only: usa fetchUserFavorites, que já retorna []
 * se anônimo. Se vazio, não renderiza nada.
 *
 * Cards compactos com scroll-snap horizontal (até 10 orações).
 */
export default async function MyPrayersStrip() {
  const favs = await fetchUserFavorites(10)
  if (favs.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2 px-1">
        <Heart
          className="w-3.5 h-3.5"
          fill="var(--gold)"
          style={{ color: 'var(--gold)' }}
          strokeWidth={0}
        />
        <h2
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '0.75rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            fontWeight: 600,
          }}
        >
          Minhas orações
        </h2>
      </header>

      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar"
        style={{
          scrollPaddingLeft: 'env(safe-area-inset-left, 0px)',
          scrollPaddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        {favs.map((item) => {
          const Icon = resolvePrayerIcon(item.iconName)
          return (
            <Link
              key={item.id}
              href={`/oracoes/${item.slug}`}
              className="shrink-0 flex flex-col gap-2 rounded-2xl p-3 snap-start transition-transform active:scale-[0.97]"
              style={{
                width: 160,
                background: 'rgba(20,18,14,0.55)',
                border: '1px solid rgba(201,168,76,0.18)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.2)',
                  color: 'var(--gold)',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p
                className="line-clamp-2 leading-tight"
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                {item.title}
              </p>
              <p
                className="truncate text-[11px]"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {item.topicTitle}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
