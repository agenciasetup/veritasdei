'use client'

import { useState } from 'react'
import {
  NotebookPen,
  Type,
  Lock,
  Users,
  Globe,
  Highlighter,
} from 'lucide-react'
import type { HighlightVisibility } from '@/lib/study/useLessonHighlights'
import type { FontScale } from '@/components/content/ReaderToolbar'

interface Props {
  /** Abre o painel de anotações da lição. */
  onOpenNotes: () => void
  /** Escopo (visibility) padrão para novos marcadores criados nesta lição. */
  defaultVisibility: HighlightVisibility
  onChangeVisibility: (v: HighlightVisibility) => void
  /** Indica se há um grupo associado (vindo de /estudo/grupos/[id]). */
  hasGroupContext?: boolean
  /** Tamanho de fonte (gerido pelo ImmersiveReader). */
  fontScale: FontScale
  onCycleFont: () => void
  /** Quando true, oculta o seletor de visibilidade (anônimo / sem auth). */
  hideVisibility?: boolean
}

const VISIBILITY_OPTIONS: Array<{
  value: HighlightVisibility
  label: string
  Icon: typeof Lock
}> = [
  { value: 'private', label: 'Privado', Icon: Lock },
  { value: 'group', label: 'Grupo', Icon: Users },
  { value: 'public', label: 'Público', Icon: Globe },
]

/**
 * Toolbar lateral flutuante (lg+) ou bottom sheet (mobile) que dá acesso
 * rápido a anotações, escopo padrão de marcadores, e tamanho de fonte.
 *
 * Não persiste em DB — só coordena UI. Marcadores em si são criados via
 * SelectionPopover (que usa `defaultVisibility` daqui).
 */
export default function StudyFloatingToolbar({
  onOpenNotes,
  defaultVisibility,
  onChangeVisibility,
  hasGroupContext = false,
  fontScale,
  onCycleFont,
  hideVisibility = false,
}: Props) {
  const [visMenuOpen, setVisMenuOpen] = useState(false)
  const currentVis =
    VISIBILITY_OPTIONS.find((o) => o.value === defaultVisibility) ??
    VISIBILITY_OPTIONS[0]
  const VisIcon = currentVis.Icon

  return (
    <>
      {/* Desktop (lg+): fixa na lateral esquerda da viewport, no gutter
       *  entre o rail do AppShell (64px) e o início da coluna de leitura. */}
      <aside
        aria-label="Ferramentas de estudo"
        className="hidden lg:flex fixed z-30 flex-col items-center gap-1.5 p-1.5 rounded-2xl"
        style={{
          top: '40vh',
          left: '80px',
          background: 'rgba(20,18,16,0.92)',
          border: '1px solid rgba(201,168,76,0.18)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.5)',
        }}
      >
        <ToolButton label="Minhas anotações" onClick={onOpenNotes}>
          <NotebookPen className="w-4 h-4" />
        </ToolButton>

        {!hideVisibility ? (
          <div className="relative">
            <ToolButton
              label={`Escopo dos marcadores: ${currentVis.label}`}
              onClick={() => setVisMenuOpen((o) => !o)}
              active={visMenuOpen}
            >
              <VisIcon className="w-4 h-4" />
            </ToolButton>
            {visMenuOpen ? (
              <div
                className="absolute left-full ml-2 top-0 min-w-[160px] rounded-xl py-1.5"
                style={{
                  background: 'rgba(20,18,16,0.98)',
                  border: '1px solid rgba(201,168,76,0.22)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 24px -8px rgba(0,0,0,0.55)',
                }}
              >
                {VISIBILITY_OPTIONS.map((o) => {
                  const disabled = o.value === 'group' && !hasGroupContext
                  const Icon = o.Icon
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return
                        onChangeVisibility(o.value)
                        setVisMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5"
                      style={{
                        color:
                          o.value === defaultVisibility
                            ? 'var(--accent)'
                            : 'var(--text-2)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="flex-1">{o.label}</span>
                      {disabled ? (
                        <span
                          className="text-[10px]"
                          style={{ color: 'var(--text-3)' }}
                        >
                          sem grupo
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <ToolButton
          label={`Tamanho da fonte: ${fontScale === 'sm' ? 'pequeno' : fontScale === 'md' ? 'médio' : 'grande'}`}
          onClick={onCycleFont}
        >
          <Type
            className={
              fontScale === 'sm'
                ? 'w-3 h-3'
                : fontScale === 'md'
                  ? 'w-4 h-4'
                  : 'w-5 h-5'
            }
          />
        </ToolButton>

        <ToolButton
          label="Selecione texto para marcar"
          onClick={() => {
            /* hint: o usuário marca via selection popover */
          }}
          subtle
        >
          <Highlighter className="w-4 h-4" />
        </ToolButton>
      </aside>

      {/* Mobile (<lg): faixa horizontal fixa, logo acima do StudyNavBar. */}
      <div
        className="lg:hidden fixed left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-full"
        style={{
          bottom:
            'calc(var(--bottom-nav-h, 72px) + env(safe-area-inset-bottom, 0px) + 96px)',
          background: 'rgba(20,18,16,0.92)',
          border: '1px solid rgba(201,168,76,0.22)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 20px -8px rgba(0,0,0,0.55)',
        }}
      >
        <ToolButton label="Minhas anotações" onClick={onOpenNotes}>
          <NotebookPen className="w-4 h-4" />
        </ToolButton>
        {!hideVisibility ? (
          <ToolButton
            label={`Escopo: ${currentVis.label}`}
            onClick={() => {
              const order: HighlightVisibility[] = hasGroupContext
                ? ['private', 'group', 'public']
                : ['private', 'public']
              const idx = order.indexOf(defaultVisibility)
              const next = order[(idx + 1) % order.length]
              onChangeVisibility(next)
            }}
          >
            <VisIcon className="w-4 h-4" />
          </ToolButton>
        ) : null}
        <ToolButton
          label={`Fonte: ${fontScale}`}
          onClick={onCycleFont}
        >
          <Type className="w-4 h-4" />
        </ToolButton>
      </div>
    </>
  )
}

function ToolButton({
  label,
  onClick,
  children,
  active,
  subtle,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  active?: boolean
  subtle?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
      style={{
        background: active
          ? 'rgba(201,168,76,0.18)'
          : subtle
            ? 'transparent'
            : 'rgba(201,168,76,0.06)',
        border: subtle
          ? '1px solid transparent'
          : '1px solid rgba(201,168,76,0.18)',
        color: subtle ? 'var(--text-3)' : 'var(--accent)',
      }}
    >
      {children}
    </button>
  )
}
