'use client'

import { BookOpenCheck, Landmark, Sparkles, Users, Library, ExternalLink } from 'lucide-react'
import type { StudyDeepdive as Deepdive, StudyDeepdiveSection } from '@/lib/study/types'

const SECTION_META: Record<string, { icon: typeof BookOpenCheck; label: string }> = {
  contexto_historico: { icon: Landmark, label: 'Contexto histórico' },
  padres_da_igreja: { icon: Users, label: 'Padres da Igreja' },
  magisterio: { icon: BookOpenCheck, label: 'Magistério' },
  aplicacao: { icon: Sparkles, label: 'Aplicação na vida' },
  referencias: { icon: Library, label: 'Referências' },
}

function meta(slug: string) {
  return SECTION_META[slug] || { icon: BookOpenCheck, label: slug.replace(/_/g, ' ') }
}

export default function StudyDeepdive({ deepdive }: { deepdive: Deepdive }) {
  const sections = [...deepdive.sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <section className="mt-12 space-y-10 fade-in">
      <div className="text-center">
        <span
          className="inline-block px-4 py-1.5 rounded-full text-xs tracking-[0.2em] uppercase"
          style={{
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.2)',
            color: 'var(--gold)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Aprofundamento
        </span>
      </div>

      {sections.map((section) => (
        <DeepdiveBlock key={section.slug} section={section} />
      ))}

      {deepdive.sources && deepdive.sources.length > 0 && (
        <SourcesBlock sources={deepdive.sources} />
      )}
    </section>
  )
}

function DeepdiveBlock({ section }: { section: StudyDeepdiveSection }) {
  const { icon: Icon, label } = meta(section.slug)
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className="w-4 h-4" style={{ color: 'var(--gold)' }} />
        <h3
          className="text-xs tracking-[0.15em] uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)' }}
        >
          {section.title || label}
        </h3>
      </div>
      <p
        className="text-base md:text-lg leading-[2] tracking-wide whitespace-pre-line"
        style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
      >
        {section.body}
      </p>
    </section>
  )
}

function SourcesBlock({ sources }: { sources: Deepdive['sources'] }) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-4">
        <Library className="w-4 h-4" style={{ color: 'var(--wine-light)' }} />
        <h3
          className="text-xs tracking-[0.15em] uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--wine-light)' }}
        >
          Fontes
        </h3>
      </div>
      <ul className="space-y-2">
        {sources.map((src, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span
              className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: 'var(--wine-light)' }}
            />
            <span
              className="text-sm leading-relaxed"
              style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif', fontWeight: 300 }}
            >
              {src.label}
              {src.page ? <span style={{ color: 'var(--text-muted)' }}>, {src.page}</span> : null}
              {src.url ? (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 underline-offset-4 hover:underline"
                  style={{ color: 'var(--gold)' }}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
