import { ArrowLeft, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { resolvePrayerIcon } from '@/features/prayers/icon-map'
import { fetchTopic } from '@/features/prayers/queries'

// Dynamic: queries.ts usa cookies() (supabase SSR) e não podemos pré-gerar
// no build. ISR de 1h cobre cache na borda pós-render.
export const revalidate = 3600

type PageProps = {
  params: Promise<{ topicSlug: string }>
}

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.veritasdei.com.br'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { topicSlug } = await params
  const topic = await fetchTopic(topicSlug)
  if (!topic) return { title: 'Categoria não encontrada · Veritas Dei' }

  const description =
    topic.subtitle ??
    `Orações da categoria ${topic.title} — textos tradicionais católicos em português e latim.`

  return {
    title: `${topic.title} · Orações · Veritas Dei`,
    description,
    alternates: { canonical: `/oracoes/categoria/${topic.slug}` },
    openGraph: {
      type: 'website',
      title: `${topic.title} · Orações`,
      description,
      url: `${SITE}/oracoes/categoria/${topic.slug}`,
      siteName: 'Veritas Dei',
      locale: 'pt_BR',
    },
  }
}

export default async function TopicPage({ params }: PageProps) {
  const { topicSlug } = await params
  const topic = await fetchTopic(topicSlug)
  if (!topic) notFound()

  const TopicIcon = resolvePrayerIcon(topic.icon)

  return (
    <main className="min-h-screen pb-24">
      {/* Sticky header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{
          background: 'rgba(10,10,10,0.78)',
          borderBottom: '1px solid rgba(201,168,76,0.08)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-2 px-3 py-2">
          <Link
            href="/oracoes"
            aria-label="Voltar para Orações"
            className="inline-flex items-center justify-center rounded-full w-9 h-9 transition-colors active:scale-90"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(201,168,76,0.15)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <p
            className="flex-1 truncate text-xs"
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            Orações
          </p>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-8 pb-4 flex flex-col items-center text-center gap-3">
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            width: 56,
            height: 56,
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.22)',
            color: 'var(--gold)',
          }}
        >
          <TopicIcon className="w-6 h-6" />
        </div>
        <h1
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
            fontWeight: 700,
            letterSpacing: '0.03em',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
          }}
        >
          {topic.title}
        </h1>
        {topic.subtitle && (
          <p
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              fontWeight: 300,
              maxWidth: '32ch',
            }}
          >
            {topic.subtitle}
          </p>
        )}
        <div className="ornament-divider w-full max-w-sm" aria-hidden />
      </section>

      {/* Subtopics + items */}
      <div className="max-w-3xl mx-auto px-5 flex flex-col gap-8">
        {topic.subtopics.map((sub) => (
          <section key={sub.slug}>
            <header className="mb-3">
              <h2
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.8rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  fontWeight: 600,
                }}
              >
                {sub.title}
              </h2>
              {sub.subtitle && (
                <p
                  className="mt-1"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    fontWeight: 300,
                  }}
                >
                  {sub.subtitle}
                </p>
              )}
            </header>

            {sub.items.length === 0 ? (
              <p
                className="text-center py-6 rounded-xl"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(201,168,76,0.12)',
                }}
              >
                Em breve.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {sub.items.map((item) => {
                  const Icon = resolvePrayerIcon(item.iconName)
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/oracoes/${item.slug}`}
                        className="flex items-center gap-3 rounded-2xl p-3 pr-4 transition-colors active:scale-[0.985]"
                        style={{
                          background: 'rgba(20,18,14,0.5)',
                          border: '1px solid rgba(201,168,76,0.15)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <div
                          className="flex items-center justify-center rounded-xl shrink-0"
                          style={{
                            width: 44,
                            height: 44,
                            background: 'rgba(201,168,76,0.08)',
                            border: '1px solid rgba(201,168,76,0.15)',
                            color: 'var(--gold)',
                          }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="truncate"
                            style={{
                              fontFamily: 'Cinzel, serif',
                              fontSize: '0.95rem',
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                              letterSpacing: '0.02em',
                            }}
                          >
                            {item.title}
                          </p>
                          {item.latinTitle && (
                            <p
                              className="truncate mt-0.5"
                              style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontStyle: 'italic',
                                fontSize: '0.85rem',
                                color: 'var(--gold)',
                                opacity: 0.8,
                              }}
                            >
                              {item.latinTitle}
                            </p>
                          )}
                        </div>
                        <ChevronRight
                          className="w-4 h-4 shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
