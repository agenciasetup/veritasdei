import Link from 'next/link'
import type { ReactNode } from 'react'
import { formatBrDate, LEGAL_DATES, LEGAL_VERSIONS, type LegalDocumentKey } from '@/lib/legal/versions'

type Props = {
  documentKey: LegalDocumentKey
  title: string
  children: ReactNode
}

export function LegalDocumentShell({ documentKey, title, children }: Props) {
  const version = LEGAL_VERSIONS[documentKey]
  const date = formatBrDate(LEGAL_DATES[documentKey])
  return (
    <div className="min-h-screen px-4 py-16 flex justify-center" style={{ background: '#0A0A0A' }}>
      <article className="max-w-3xl w-full">
        <Link
          href="/"
          className="inline-block mb-8 text-sm transition-colors hover:opacity-80"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          &larr; Voltar ao início
        </Link>

        <h1
          className="text-3xl md:text-4xl font-bold tracking-widest uppercase mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
        >
          {title}
        </h1>
        <p className="text-sm mb-10" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Versão {version} — última atualização: {date}
        </p>

        <div
          className="space-y-8"
          style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif', lineHeight: 1.8 }}
        >
          {children}
        </div>

        <div className="mt-16 pt-8" style={{ borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          <p
            className="text-xs text-center"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            &copy; 2026 Veritas Dei. Todos os direitos reservados.
          </p>
        </div>
      </article>
    </div>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2
        className="text-lg font-bold tracking-wider uppercase mb-4"
        style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
      >
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function LegalSubheading({ children }: { children: ReactNode }) {
  return (
    <h4 className="font-semibold mt-4 mb-2" style={{ color: '#F2EDE4' }}>
      {children}
    </h4>
  )
}

export function LegalHighlight({ children }: { children: ReactNode }) {
  return (
    <strong style={{ color: '#C9A84C' }}>{children}</strong>
  )
}

export function LegalCallout({ children }: { children: ReactNode }) {
  return (
    <div
      className="mt-3 p-4 rounded-xl"
      style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)' }}
    >
      {children}
    </div>
  )
}
