import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { resolvePrayerIcon } from './icon-map'
import MyPrayersStrip from './MyPrayersStrip'
import PrayerSearch from './PrayerSearch'
import { fetchLibraryTree } from './queries'

/**
 * Index de /oracoes — Server Component.
 *
 * Layout:
 *  1. Hero compacto (título "Orações" + subtítulo + ornament)
 *  2. Busca (client)
 *  3. "Minhas orações" (só se logado & tiver favoritos)
 *  4. Grid 2×2 com os 4 topics (Essenciais, Dia a dia, Missa, Ocasiões)
 *     → linka pra /oracoes/categoria/[topicSlug]
 */
export default async function PrayerLibraryView() {
  const tree = await fetchLibraryTree()

  return (
    <main className="min-h-screen pb-24">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-8 pb-4 flex flex-col items-center text-center gap-3">
        <h1
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          Orações
        </h1>
        <p
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            fontWeight: 300,
            maxWidth: '34ch',
          }}
        >
          Para cada momento da vida cristã
        </p>
        <div className="ornament-divider w-full max-w-sm" aria-hidden />
      </section>

      <div className="max-w-3xl mx-auto px-5 flex flex-col gap-7">
        <PrayerSearch />

        <MyPrayersStrip />

        {/* Grid de categorias */}
        <section className="flex flex-col gap-3">
          <h2
            className="px-1"
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.75rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              fontWeight: 600,
            }}
          >
            Explore por categoria
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {tree.map((topic) => {
              const Icon = resolvePrayerIcon(topic.icon)
              const itemCount = topic.subtopics.reduce(
                (acc, s) => acc + s.items.length,
                0
              )
              return (
                <li key={topic.slug}>
                  <Link
                    href={`/oracoes/categoria/${topic.slug}`}
                    className="flex flex-col justify-between h-full rounded-2xl p-4 gap-4 transition-transform active:scale-[0.98]"
                    style={{
                      background: 'rgba(20,18,14,0.55)',
                      border: '1px solid rgba(201,168,76,0.18)',
                      backdropFilter: 'blur(8px)',
                      minHeight: 140,
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl"
                      style={{
                        width: 44,
                        height: 44,
                        background: 'rgba(201,168,76,0.1)',
                        border: '1px solid rgba(201,168,76,0.22)',
                        color: 'var(--gold)',
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3
                        style={{
                          fontFamily: 'Cinzel, serif',
                          fontSize: '1.05rem',
                          color: 'var(--text-primary)',
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {topic.title}
                      </h3>
                      {topic.subtitle && (
                        <p
                          className="text-xs leading-snug"
                          style={{
                            fontFamily: 'Poppins, sans-serif',
                            color: 'var(--text-muted)',
                            fontWeight: 300,
                          }}
                        >
                          {topic.subtitle}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex items-center justify-between mt-auto pt-1"
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span>
                        {itemCount} {itemCount === 1 ? 'oração' : 'orações'}
                      </span>
                      <ChevronRight
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--gold)' }}
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </main>
  )
}
