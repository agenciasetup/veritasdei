import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import {
  THEMATIC_ROSARIES,
  evaluateThematicUnlock,
} from '@/features/rosario/data/thematicRosaries'

export const metadata = {
  title: 'Terços Temáticos — Veritas Dei',
  description:
    'Reze terços meditando a vida de santos e os dogmas da fé. São Bento, Padre Pio, Dogmas Marianos e mais.',
}

/**
 * Catálogo de terços temáticos.
 *
 * Server component — renderiza estaticamente os cards. A avaliação de
 * unlock por enquanto é estática (lista vazia de tópicos concluídos);
 * quando integrarmos com tracking de trilhas, substituir pela consulta
 * real ao progresso do usuário.
 */
export default async function ThematicCatalogPage() {
  // TODO: quando wired-up, buscar `completedStudyTopics` do user logado.
  const completedTopics: string[] = []

  return (
    <main
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      <div className="bg-glow" aria-hidden />

      <Link
        href="/rosario"
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 text-sm transition md:left-8 md:top-6"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div
        className="
          relative z-10 mx-auto flex w-full max-w-7xl flex-col px-4 py-16
          md:px-8 md:py-20 lg:py-24
        "
      >
        <header className="mb-12 text-center md:mb-16">
          <p
            className="mb-4 text-[10px] uppercase tracking-[0.4em] md:text-[11px]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
          >
            Devocional · Doutrina · Santos
          </p>
          <h1
            className="text-4xl leading-[1.05] md:text-5xl lg:text-6xl"
            style={{
              color: 'var(--text-1)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.01em',
            }}
          >
            Terços Temáticos
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed md:text-base lg:text-lg"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-elegant)',
            }}
          >
            Reze o terço meditando a vida dos santos, os dogmas da fé e as
            devoções da Tradição. A estrutura é a mesma — Pai Nosso, Ave
            Marias, Glória — mas o que você medita muda.
          </p>
          <div
            className="mx-auto mt-7 h-px max-w-md"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--accent-soft) 20%, var(--accent-soft) 80%, transparent)',
            }}
            aria-hidden
          />
        </header>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {THEMATIC_ROSARIES.map((rosary) => {
            const status = evaluateThematicUnlock(rosary, completedTopics)
            return (
              <li key={rosary.slug}>
                <ThematicCard
                  slug={rosary.slug}
                  name={rosary.name}
                  subtitle={rosary.subtitle}
                  description={rosary.description}
                  epigraph={rosary.epigraph}
                  glyph={rosary.glyph}
                  category={rosary.category}
                  available={status.available}
                  lockReason={status.reason}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}

function ThematicCard({
  slug,
  name,
  subtitle,
  description,
  epigraph,
  glyph,
  category,
  available,
  lockReason,
}: {
  slug: string
  name: string
  subtitle: string
  description: string
  epigraph?: string
  glyph: string
  category: 'devocional' | 'doutrina' | 'santo'
  available: boolean
  lockReason?: string
}) {
  const categoryLabel =
    category === 'santo'
      ? 'Santo'
      : category === 'doutrina'
        ? 'Doutrina'
        : 'Devocional'

  const Content = (
    <div
      className="relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border p-6 transition lg:p-7"
      style={{
        borderColor: 'var(--border-1)',
        background: 'var(--surface-2)',
        opacity: available ? 1 : 0.6,
      }}
    >
      {/* Glyph corner ornament */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 text-[140px] leading-none opacity-[0.06]"
        style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
      >
        {glyph}
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <span
          className="text-[10px] uppercase tracking-[0.25em]"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
        >
          {categoryLabel}
        </span>
        {!available && (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.18em]"
            style={{
              borderColor: 'var(--border-1)',
              color: 'var(--text-3)',
            }}
          >
            <Lock className="h-3 w-3" /> Bloqueado
          </span>
        )}
      </div>

      <div className="relative">
        <h2
          className="text-2xl leading-tight md:text-[1.7rem]"
          style={{
            color: 'var(--text-1)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.005em',
          }}
        >
          {name}
        </h2>
        <p
          className="mt-1 text-xs italic md:text-sm"
          style={{ color: 'var(--text-3)' }}
        >
          {subtitle}
        </p>
      </div>

      <p
        className="relative text-sm leading-relaxed"
        style={{ color: 'var(--text-2)' }}
      >
        {description}
      </p>

      {epigraph && (
        <p
          className="relative border-l-2 pl-3 text-xs italic leading-relaxed"
          style={{
            color: 'var(--text-3)',
            borderColor: 'var(--accent-soft)',
            fontFamily: 'var(--font-elegant)',
          }}
        >
          {epigraph}
        </p>
      )}

      <div className="relative mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          5 dezenas · ~20 min
        </span>
        {available ? (
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '0.05em',
            }}
          >
            Rezar →
          </span>
        ) : (
          <span
            className="text-[11px] italic"
            style={{ color: 'var(--text-3)' }}
          >
            {lockReason}
          </span>
        )}
      </div>
    </div>
  )

  if (available) {
    return (
      <Link
        href={`/rosario/tematicos/${slug}`}
        className="block h-full transition active:scale-[0.985] hover:opacity-100"
      >
        {Content}
      </Link>
    )
  }

  return <div className="h-full">{Content}</div>
}
