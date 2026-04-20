import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { resolvePrayerIcon } from './icon-map'
import MyPrayersStrip from './MyPrayersStrip'
import PrayerSearch from './PrayerSearch'
import { fetchLibraryTree } from './queries'
import Divider from '@/components/ui/Divider'

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
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-1)',
            lineHeight: 1.1,
          }}
        >
          Orações
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            color: 'var(--text-3)',
            maxWidth: '34ch',
          }}
        >
          Para cada momento da vida cristã
        </p>
        <Divider variant="ornament" className="max-w-[180px] w-full" spacing="default" />
      </section>

      <div className="max-w-3xl mx-auto px-5 flex flex-col gap-7">
        <PrayerSearch />

        <MyPrayersStrip />

        {/* Grid de categorias */}
        <section className="flex flex-col gap-3">
          <h2
            className="px-1"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.75rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
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
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-1)',
                      minHeight: 140,
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl"
                      style={{
                        width: 44,
                        height: 44,
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent-soft)',
                        color: 'var(--accent)',
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.05rem',
                          color: 'var(--text-1)',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {topic.title}
                      </h3>
                      {topic.subtitle && (
                        <p
                          className="text-xs leading-snug"
                          style={{
                            fontFamily: 'var(--font-body)',
                            color: 'var(--text-3)',
                          }}
                        >
                          {topic.subtitle}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex items-center justify-between mt-auto pt-1"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.7rem',
                        color: 'var(--text-3)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span>
                        {itemCount} {itemCount === 1 ? 'oração' : 'orações'}
                      </span>
                      <ChevronRight
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--accent)' }}
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
