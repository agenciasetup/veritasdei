'use client'

import { useState } from 'react'
import { Bell, Cross, Plus, Save, Search, Trash2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Card } from '@/components/ui/Card'
import Divider from '@/components/ui/Divider'
import Icon from '@/components/ui/Icon'
import { Input, Textarea } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import ThemeToggle from '@/components/theme/ThemeToggle'
import CrossIcon from '@/components/icons/CrossIcon'

/**
 * `/design-system` — vitrine interna dos primitivos (Fase 1).
 *
 * Não listada em navs, sem auth gate (mas protegida pela ausência
 * de link público). Usada pela equipe para inspecionar o estado do
 * sistema visual em ambos os temas.
 */
export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState('')
  const [hasError, setHasError] = useState(false)

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--surface-1)', color: 'var(--text-1)' }}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        <header>
          <h1
            className="text-2xl tracking-[0.14em] uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
          >
            Design System
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
          >
            Primitivos da Fase 1. Troque o tema para validar em light/dark/system.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </header>

        <Divider variant="ornament" />

        {/* ─── Buttons ─── */}
        <Section title="Button">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="gold">Gold</Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <Button size="sm" leftIcon={<Plus />}>
              Sm
            </Button>
            <Button size="md" rightIcon={<ArrowRight />}>
              Md
            </Button>
            <Button size="lg" leftIcon={<Save />}>
              Lg
            </Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <IconButton label="Sino" variant="ghost">
              <Bell className="w-5 h-5" />
            </IconButton>
            <IconButton label="Buscar" variant="solid">
              <Search className="w-5 h-5" />
            </IconButton>
            <IconButton label="Rezar" variant="accent">
              <Cross className="w-5 h-5" />
            </IconButton>
            <IconButton label="Remover" variant="ghost">
              <Trash2 className="w-5 h-5" />
            </IconButton>
          </div>
        </Section>

        {/* ─── Cards ─── */}
        <Section title="Card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card variant="flat">
              <p className="text-sm font-medium">Flat</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Superfície neutra, bordeada.
              </p>
            </Card>
            <Card variant="elevated">
              <p className="text-sm font-medium">Elevated</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Shadow + surface-3 (um degrau acima).
              </p>
            </Card>
            <Card variant="inset">
              <p className="text-sm font-medium">Inset</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Surface-inset, visual "afundado".
              </p>
            </Card>
          </div>
          <div className="mt-3">
            <Card variant="flat" interactive padding="lg">
              <p className="text-sm font-medium">Card interativo (clique pra sentir o active)</p>
            </Card>
          </div>
        </Section>

        {/* ─── Divider ─── */}
        <Section title="Divider">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Hair:</p>
          <Divider variant="hair" />
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Ornament (cruz centralizada):</p>
          <Divider variant="ornament" spacing="loose" />
        </Section>

        {/* ─── Icon ─── */}
        <Section title="Icon">
          <div className="flex items-end gap-4" style={{ color: 'var(--accent)' }}>
            <div className="flex flex-col items-center gap-1">
              <Icon as={Cross} size="xs" />
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>xs</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon as={Cross} size="sm" />
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>sm</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon as={Cross} size="md" />
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>md</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon as={Cross} size="lg" />
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>lg</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon as={Cross} size="xl" />
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>xl</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CrossIcon size="md" />
              <span className="text-[10px]" style={{ color: 'var(--text-3)' }}>custom SVG</span>
            </div>
          </div>
        </Section>

        {/* ─── Inputs ─── */}
        <Section title="Input / Textarea / Label">
          <div className="space-y-4">
            <Input
              label="Nome"
              placeholder="Digite seu nome"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required
              hint="obrigatório"
            />
            <Input
              label="Com ícones"
              leftIcon={<Search className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              placeholder="Busca"
            />
            <Input
              label="Com erro"
              placeholder="Email"
              error={hasError ? 'Email inválido.' : undefined}
              onFocus={() => setHasError(true)}
              onBlur={() => setHasError(false)}
            />
            <Input label="Sucesso" defaultValue="tudo certo" success />
            <Input label="Desabilitado" defaultValue="read-only" disabled />
            <Textarea label="Observações" placeholder="Escreva algo…" rows={3} />
            <div>
              <Label required hint="livre texto">
                Label standalone
              </Label>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                O label acima é renderizado diretamente, fora de um Input.
              </p>
            </div>
          </div>
        </Section>

        {/* ─── Surface swatches ─── */}
        <Section title="Surfaces">
          <div className="grid grid-cols-3 gap-2">
            {(['surface-1', 'surface-2', 'surface-3'] as const).map((s) => (
              <div
                key={s}
                className="h-16 rounded-xl flex items-end p-2 text-[10px]"
                style={{
                  background: `var(--${s})`,
                  border: '1px solid var(--border-2)',
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(['text-1', 'text-2', 'text-3'] as const).map((t) => (
              <div
                key={t}
                className="h-12 rounded-xl flex items-center justify-center text-xs"
                style={{
                  background: 'var(--surface-2)',
                  color: `var(--${t})`,
                  border: '1px solid var(--border-2)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <div
              className="flex-1 h-12 rounded-xl flex items-center justify-center text-xs"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                fontFamily: 'var(--font-body)',
              }}
            >
              accent
            </div>
            <div
              className="flex-1 h-12 rounded-xl flex items-center justify-center text-xs"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
              }}
            >
              accent-soft
            </div>
          </div>
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2
        className="text-xs tracking-[0.14em] uppercase mb-3"
        style={{ color: 'var(--text-2)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  )
}
