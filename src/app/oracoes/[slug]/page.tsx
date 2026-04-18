import { ArrowLeft, ChevronLeft, ChevronRight, BookMarked } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import AudioPlayer from '@/features/prayers/AudioPlayer'
import BilingualWrapper from '@/features/prayers/BilingualWrapper'
import FavoriteButton from '@/features/prayers/FavoriteButton'
import { LatinProvider } from '@/features/prayers/LatinContext'
import LatinToggle from '@/features/prayers/LatinToggle'
import PrayerRenderer from '@/features/prayers/PrayerRenderer'
import ShareButton from '@/features/prayers/ShareButton'
import YoutubeLazyEmbed from '@/features/prayers/YoutubeLazyEmbed'
import { parseLatinBody, parsePrayerBody } from '@/features/prayers/parser'
import { fetchPrayerBySlug, fetchSiblings, isFavorited } from '@/features/prayers/queries'

export const revalidate = 3600

type PageProps = {
  params: Promise<{ slug: string }>
}

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.veritasdei.com.br'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const prayer = await fetchPrayerBySlug(slug)
  if (!prayer) return { title: 'Oração não encontrada · Veritas Dei' }

  const description =
    prayer.metaDescription ||
    `${prayer.title}: oração católica tradicional em português${prayer.latinBody ? ' e latim' : ''}.`
  const url = `${SITE}/oracoes/${prayer.slug}`

  return {
    title: `${prayer.title} · Veritas Dei`,
    description,
    keywords: prayer.keywords.length ? prayer.keywords.join(', ') : undefined,
    alternates: { canonical: `/oracoes/${prayer.slug}` },
    openGraph: {
      type: 'article',
      title: prayer.title,
      description,
      url,
      siteName: 'Veritas Dei',
      locale: 'pt_BR',
      images: prayer.imageUrl ? [{ url: prayer.imageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: prayer.title,
      description,
      images: prayer.imageUrl ? [prayer.imageUrl] : undefined,
    },
  }
}

export default async function PrayerPage({ params }: PageProps) {
  const { slug } = await params
  const prayer = await fetchPrayerBySlug(slug)
  if (!prayer) notFound()

  const [initiallyFav, { prev, next }] = await Promise.all([
    isFavorited(prayer.id),
    fetchSiblings(prayer.slug),
  ])

  const ptBlocks = parsePrayerBody(prayer.body)
  const laBlocks = prayer.latinBody ? parseLatinBody(prayer.latinBody) : null
  const hasLatin = !!(laBlocks && laBlocks.length > 0)
  const shareUrl = `${SITE}/oracoes/${prayer.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: prayer.title,
    name: prayer.title,
    description: prayer.metaDescription || prayer.title,
    inLanguage: 'pt-BR',
    about: { '@type': 'Thing', name: 'Catholic prayer' },
    keywords: prayer.keywords.join(', '),
    url: shareUrl,
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      name: 'Veritas Dei',
      url: SITE,
    },
  }

  return (
    <LatinProvider>
      <main className="min-h-screen pb-20">
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
              href={`/oracoes/categoria/${prayer.topic.slug}`}
              aria-label={`Voltar para ${prayer.topic.title}`}
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
              {prayer.topic.title} · {prayer.subtopic.title}
            </p>
            <LatinToggle hasLatin={hasLatin} />
            <FavoriteButton itemId={prayer.id} initiallyFavorited={initiallyFav} />
            <ShareButton title={prayer.title} text={prayer.metaDescription || undefined} url={shareUrl} />
          </div>
        </header>

        {/* Article */}
        <article className="max-w-3xl mx-auto px-5 pt-8 flex flex-col gap-5">
          <header className="flex flex-col items-center text-center gap-3">
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
              {prayer.title}
            </h1>
            {prayer.latinTitle && (
              <span
                className="inline-flex rounded-full px-3 py-1"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  color: 'var(--gold)',
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.2)',
                }}
              >
                {prayer.latinTitle}
              </span>
            )}
          </header>

          <div className="ornament-divider" aria-hidden />

          {prayer.audioUrl && (
            <AudioPlayer src={prayer.audioUrl} title={`Áudio · ${prayer.title}`} />
          )}

          <BilingualWrapper
            hasLatin={hasLatin}
            pt={<PrayerRenderer blocks={ptBlocks} />}
            la={hasLatin ? <PrayerRenderer blocks={laBlocks!} /> : null}
          />

          {prayer.videoUrl && (
            <div className="mt-2">
              <YoutubeLazyEmbed url={prayer.videoUrl} title={prayer.title} />
            </div>
          )}

          {prayer.indulgenceNote && (
            <aside
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(107,29,42,0.18)',
                border: '1px solid rgba(139,49,69,0.35)',
                color: '#F2EDE4',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.875rem',
                lineHeight: 1.55,
              }}
            >
              <p
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.7rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                  marginBottom: '0.5rem',
                }}
              >
                Indulgência
              </p>
              {prayer.indulgenceNote}
            </aside>
          )}

          {prayer.scriptureRefs.length > 0 && (
            <section
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(201,168,76,0.15)',
              }}
            >
              <div
                className="flex items-center gap-2 mb-2"
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: '0.75rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--gold)',
                }}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>Raízes bíblicas</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {prayer.scriptureRefs.map((ref) => (
                  <span
                    key={ref}
                    className="inline-flex rounded-full px-3 py-1 text-xs"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      color: 'var(--text-primary)',
                      background: 'rgba(201,168,76,0.06)',
                      border: '1px solid rgba(201,168,76,0.18)',
                    }}
                  >
                    {ref}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Siblings nav */}
          {(prev || next) && (
            <nav
              className="grid grid-cols-2 gap-3 mt-4"
              aria-label="Navegação entre orações"
            >
              {prev ? (
                <Link
                  href={`/oracoes/${prev.slug}`}
                  className="flex flex-col gap-1 rounded-xl p-3 transition-colors active:scale-[0.985]"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(201,168,76,0.12)',
                  }}
                >
                  <span
                    className="inline-flex items-center gap-1 text-[11px]"
                    style={{
                      fontFamily: 'Cinzel, serif',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--gold)',
                    }}
                  >
                    <ChevronLeft className="w-3 h-3" /> Anterior
                  </span>
                  <span
                    className="truncate"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/oracoes/${next.slug}`}
                  className="flex flex-col gap-1 rounded-xl p-3 text-right transition-colors active:scale-[0.985]"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(201,168,76,0.12)',
                  }}
                >
                  <span
                    className="inline-flex items-center gap-1 justify-end text-[11px]"
                    style={{
                      fontFamily: 'Cinzel, serif',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--gold)',
                    }}
                  >
                    Próxima <ChevronRight className="w-3 h-3" />
                  </span>
                  <span
                    className="truncate"
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {next.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </nav>
          )}
        </article>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </main>
    </LatinProvider>
  )
}
