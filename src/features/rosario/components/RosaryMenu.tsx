'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { Heart, Vibrate, Volume2, HelpCircle, Clock, Users, RotateCcw } from 'lucide-react'
import type { MysteryGroup, MysterySet } from '@/features/rosario/data/types'
import { MYSTERY_GROUPS, getMysteryForToday } from '@/features/rosario/data/mysteries'
import BottomSheet from '@/components/mobile/BottomSheet'

// Mantemos o import de tipo para garantir que a fonte canonica não some.
void ({} as MysteryGroup)

interface RosaryMenuProps {
  open: boolean
  onClose: () => void
  mysterySetId: MysterySet
  onMysteryChange: (id: MysterySet) => void
  mysteryLocked?: boolean
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
  mysteryLocked = false,
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

  return (
    <BottomSheet
      open={open}
      onDismiss={onClose}
      detents={[0.55, 0.88]}
      initialDetent={0}
      label="Opções do terço"
    >
      {/* Mystery selector */}
      <section className="mb-4">
        <h3
          className="text-[11px] uppercase tracking-[0.2em] mb-3"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Mistérios{' '}
          {mysteryLocked && <span style={{ color: '#5A5348' }}>(Rosário completo)</span>}
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
                disabled={mysteryLocked}
                onClick={() => {
                  if (!mysteryLocked) {
                    onMysteryChange(g.id)
                    onClose()
                  }
                }}
                className="rounded-xl px-3 py-3 text-left transition active:scale-[0.97] disabled:opacity-50 touch-target"
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
                    color: active ? 'var(--gold)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {g.name.replace('Mistérios ', '')}
                </span>
                <span
                  className="block text-[11px] mt-0.5"
                  style={{ color: isToday ? '#D9C077' : '#5A5348' }}
                >
                  {isToday ? '● Hoje' : g.days}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="h-px mb-4" style={{ background: 'rgba(201, 168, 76, 0.1)' }} />

      <section className="flex flex-col gap-1 mb-4">
        {intentionAvailable && (
          <MenuRow
            label={intentionLabel ? `Rezando por: ${intentionLabel}` : 'Escolher intenção'}
            icon={<Heart size={18} strokeWidth={1.5} />}
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
            icon={<Vibrate size={18} strokeWidth={1.5} />}
            enabled={hapticEnabled}
            onToggle={onHapticToggle}
          />
        )}
        {ttsSupported && (
          <MenuToggle
            label={ttsEnabled && ttsSpeaking ? 'Voz (falando…)' : 'Voz guiada'}
            icon={<Volume2 size={18} strokeWidth={1.5} />}
            enabled={ttsEnabled}
            onToggle={onTtsToggle}
          />
        )}
      </section>

      <div className="h-px mb-4" style={{ background: 'rgba(201, 168, 76, 0.1)' }} />

      <section className="flex flex-col gap-1">
        <MenuRow
          label="Tutorial"
          icon={<HelpCircle size={18} strokeWidth={1.5} />}
          onClick={onTutorial}
        />
        <MenuLinkRow
          href="/rosario/historico"
          label="Histórico"
          icon={<Clock size={18} strokeWidth={1.5} />}
        />
        <MenuLinkRow
          href="/rosario/juntos"
          label="Rezar em grupo"
          icon={<Users size={18} strokeWidth={1.5} />}
        />
        <MenuRow
          label="Reiniciar terço"
          icon={<RotateCcw size={18} strokeWidth={1.5} />}
          onClick={() => {
            onRestart()
            onClose()
          }}
        />
      </section>
    </BottomSheet>
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
  icon: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98] touch-target"
      style={{
        background: active ? 'rgba(201, 168, 76, 0.06)' : 'transparent',
        color: active ? '#D9C077' : 'var(--text-secondary)',
      }}
    >
      <span className="w-6 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        {icon}
      </span>
      <span className="text-sm truncate" style={{ fontFamily: 'var(--font-body)' }}>
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
  icon: ReactNode
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98] touch-target"
      style={{ color: enabled ? '#D9C077' : 'var(--text-secondary)' }}
      aria-pressed={enabled}
    >
      <span className="w-6 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        {icon}
      </span>
      <span className="flex-1 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </span>
      <span
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{
          background: enabled
            ? 'rgba(201, 168, 76, 0.4)'
            : 'rgba(122, 115, 104, 0.25)',
        }}
        aria-hidden
      >
        <span
          className="absolute top-1 h-4 w-4 rounded-full transition-all"
          style={{
            left: enabled ? '24px' : '4px',
            background: enabled ? 'var(--gold)' : 'var(--text-muted)',
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
  icon: ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98] touch-target"
      style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
    >
      <span className="w-6 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
        {icon}
      </span>
      <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </span>
    </Link>
  )
}
