'use client'

import { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { MysteryGroup, MysterySet } from '@/features/rosario/data/types'
import { MYSTERY_GROUPS, getMysteryForToday } from '@/features/rosario/data/mysteries'

interface RosaryMenuProps {
  open: boolean
  onClose: () => void
  mysterySetId: MysterySet
  onMysteryChange: (id: MysterySet) => void
  hapticSupported: boolean
  hapticEnabled: boolean
  onHapticToggle: () => void
  ttsSupported: boolean
  ttsEnabled: boolean
  ttsSpeaking: boolean
  onTtsToggle: () => void
  intentionAvailable: boolean
  intentionLabel: string | null
  onIntentionOpen: () => void
  onRestart: () => void
  onTutorial: () => void
}

export function RosaryMenu({
  open,
  onClose,
  mysterySetId,
  onMysteryChange,
  hapticSupported,
  hapticEnabled,
  onHapticToggle,
  ttsSupported,
  ttsEnabled,
  ttsSpeaking,
  onTtsToggle,
  intentionAvailable,
  intentionLabel,
  onIntentionOpen,
  onRestart,
  onTutorial,
}: RosaryMenuProps) {
  const todayId = getMysteryForToday().id
  const panelRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  // Focus trap: focus the panel when opened
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Bottom sheet */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Opções do terço"
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg rounded-t-2xl px-5 pb-8 pt-3 outline-none animate-slide-up"
        style={{
          background: 'rgba(15, 14, 12, 0.97)',
          border: '1px solid rgba(201, 168, 76, 0.15)',
          borderBottom: 'none',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-4">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'rgba(201, 168, 76, 0.3)' }}
          />
        </div>

        {/* Mystery selector */}
        <section className="mb-5">
          <h3
            className="text-[10px] uppercase tracking-[0.2em] mb-3"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            Mistérios
          </h3>
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="Escolha os mistérios"
          >
            {MYSTERY_GROUPS.map((g) => {
              const active = g.id === mysterySetId
              const isToday = g.id === todayId
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    onMysteryChange(g.id)
                    onClose()
                  }}
                  className="rounded-xl px-3 py-2.5 text-left transition active:scale-[0.97]"
                  style={{
                    background: active
                      ? 'rgba(201, 168, 76, 0.12)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${active ? 'rgba(201, 168, 76, 0.3)' : 'rgba(201, 168, 76, 0.08)'}`,
                  }}
                >
                  <span
                    className="block text-sm font-medium"
                    style={{
                      color: active ? '#C9A84C' : '#B8AFA2',
                      fontFamily: 'Cinzel, serif',
                    }}
                  >
                    {g.name.replace('Mistérios ', '')}
                  </span>
                  <span
                    className="block text-[10px] mt-0.5"
                    style={{ color: isToday ? '#D9C077' : '#5A5348' }}
                  >
                    {isToday ? '● Hoje' : g.days}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Divider */}
        <div className="h-px mb-4" style={{ background: 'rgba(201, 168, 76, 0.1)' }} />

        {/* Toggle options */}
        <section className="flex flex-col gap-1 mb-4">
          {intentionAvailable && (
            <MenuRow
              label={intentionLabel ? `Rezando por: ${intentionLabel}` : 'Escolher intenção'}
              icon="✦"
              active={!!intentionLabel}
              onClick={() => {
                onIntentionOpen()
                onClose()
              }}
            />
          )}
          {hapticSupported && (
            <MenuToggle
              label="Vibração"
              icon="◉"
              enabled={hapticEnabled}
              onToggle={onHapticToggle}
            />
          )}
          {ttsSupported && (
            <MenuToggle
              label={ttsEnabled && ttsSpeaking ? 'Voz (falando…)' : 'Voz guiada'}
              icon="♪"
              enabled={ttsEnabled}
              onToggle={onTtsToggle}
            />
          )}
        </section>

        {/* Divider */}
        <div className="h-px mb-4" style={{ background: 'rgba(201, 168, 76, 0.1)' }} />

        {/* Navigation links */}
        <section className="flex flex-col gap-1">
          <MenuRow label="Tutorial" icon="?" onClick={onTutorial} />
          <MenuLinkRow href="/rosario/historico" label="Histórico" icon="◎" />
          <MenuLinkRow href="/rosario/juntos" label="Rezar em grupo" icon="❖" />
          <MenuRow
            label="Reiniciar terço"
            icon="↺"
            onClick={() => {
              onRestart()
              onClose()
            }}
          />
        </section>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0.5; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 280ms ease-out;
        }
      `}</style>
    </div>
  )
}

/* ── Reusable menu items ── */

function MenuRow({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98]"
      style={{
        background: active ? 'rgba(201, 168, 76, 0.06)' : 'transparent',
        color: active ? '#D9C077' : '#B8AFA2',
      }}
    >
      <span className="w-5 text-center text-sm" style={{ color: '#7A7368' }}>
        {icon}
      </span>
      <span className="text-sm truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </span>
    </button>
  )
}

function MenuToggle({
  label,
  icon,
  enabled,
  onToggle,
}: {
  label: string
  icon: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98]"
      style={{ color: enabled ? '#D9C077' : '#B8AFA2' }}
      aria-pressed={enabled}
    >
      <span className="w-5 text-center text-sm" style={{ color: '#7A7368' }}>
        {icon}
      </span>
      <span className="flex-1 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </span>
      <span
        className="w-10 h-6 rounded-full relative transition-colors"
        style={{
          background: enabled
            ? 'rgba(201, 168, 76, 0.35)'
            : 'rgba(122, 115, 104, 0.25)',
        }}
        aria-hidden
      >
        <span
          className="absolute top-1 h-4 w-4 rounded-full transition-all"
          style={{
            left: enabled ? '22px' : '2px',
            background: enabled ? '#C9A84C' : '#7A7368',
          }}
        />
      </span>
    </button>
  )
}

function MenuLinkRow({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98]"
      style={{ color: '#B8AFA2', textDecoration: 'none' }}
    >
      <span className="w-5 text-center text-sm" style={{ color: '#7A7368' }}>
        {icon}
      </span>
      <span className="text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </span>
    </Link>
  )
}
