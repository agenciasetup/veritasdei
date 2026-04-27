/**
 * /sobre — página institucional pública.
 *
 * Server component. Mostra versão do app, contato, links legais e
 * créditos. Necessária para Play Store (review espera "About app"
 * acessível).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { Sparkles, Mail, Shield, FileText, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sobre — Veritas Dei',
  description:
    'Versão, contato, créditos e políticas do Veritas Dei — app católico com terço, liturgia, novenas, doutrina e comunidade.',
}

const APP_VERSION = process.env.npm_package_version ?? '0.1.0'

export default function SobrePage() {
  return (
    <main className="min-h-screen px-4 py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-1)',
            }}
          >
            <Sparkles className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h1
            className="text-3xl md:text-4xl mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)',
            }}
          >
            Veritas Dei
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
          >
            Terço, liturgia do dia, orações, paróquias e formação católica —
            num só lugar.
          </p>
        </header>

        <Section title="App">
          <Row label="Versão" value={APP_VERSION} />
          <Row
            label="Plataforma"
            value="Web (PWA) + Android (Capacitor) + iOS em breve"
          />
        </Section>

        <Section title="Contato">
          <Row label="Suporte" value="suporte@veritasdei.com.br" />
          <Row
            label="Sugestões e bugs"
            value="contato@agenciasetup.com.br"
          />
        </Section>

        <Section title="Legal e privacidade">
          <LinkRow icon={Shield} href="/privacidade" label="Política de privacidade" />
          <LinkRow icon={FileText} href="/termos" label="Termos de uso" />
          <LinkRow icon={FileText} href="/cookies" label="Política de cookies" />
          <LinkRow icon={Mail} href="/diretrizes" label="Diretrizes da comunidade" />
          <LinkRow icon={FileText} href="/dmca" label="DMCA / Direitos autorais" />
        </Section>

        <Section title="Créditos">
          <p
            className="text-sm leading-relaxed"
            style={{
              color: 'var(--text-2)',
              fontFamily: 'var(--font-body)',
              padding: '0 1rem',
            }}
          >
            Liturgia diária via Vatican.va e CNBB. Imagens dos santos via{' '}
            <a
              href="https://gcatholic.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              gcatholic.org
            </a>{' '}
            sob Creative Commons. Catecismo de Pio X em domínio público.
            Tradução das Escrituras: Ave-Maria. Tipografia: Cinzel,
            Cormorant Garamond, Poppins.
          </p>
        </Section>

        <div
          className="mt-12 text-center text-xs"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          <p className="mb-1">
            Feito com{' '}
            <Heart
              className="w-3 h-3 inline-block"
              style={{ color: 'var(--accent)' }}
            />{' '}
            por{' '}
            <a
              href="https://agenciasetup.com.br"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)' }}
            >
              Agência Setup
            </a>
          </p>
          <p>Ad maiorem Dei gloriam.</p>
        </div>
      </div>
    </main>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      className="mb-6 rounded-2xl overflow-hidden"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-1)',
      }}
    >
      <div
        className="px-4 py-3 text-xs uppercase tracking-wider"
        style={{
          color: 'var(--text-3)',
          fontFamily: 'var(--font-body)',
          borderBottom: '1px solid var(--border-1)',
        }}
      >
        {title}
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--border-1)' }}>
        {children}
      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 text-sm"
      style={{ borderColor: 'var(--border-1)' }}
    >
      <span
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
      <span
        style={{
          color: 'var(--text-1)',
          fontFamily: 'var(--font-body)',
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function LinkRow({
  icon: Icon,
  href,
  label,
}: {
  icon: typeof Shield
  href: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm active:opacity-70"
      style={{ borderColor: 'var(--border-1)' }}
    >
      <Icon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
      <span
        style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </span>
      <span
        className="ml-auto"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
      >
        →
      </span>
    </Link>
  )
}
