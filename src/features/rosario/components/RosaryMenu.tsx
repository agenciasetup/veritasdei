'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { Heart, Vibrate, Volume2, HelpCircle, Clock, Users, RotateCcw } from 'lucide-react'
import type { MysteryGroup, MysterySet } from '@/features/rosario/data/types'
import { MYSTERY_GROUPS, getMysteryForToday } from '@/features/rosario/data/mysteries'
import { ROSARY_THEMES, type RosaryTheme } from '@/features/rosario/data/theme'
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
  theme?: RosaryTheme
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
  theme = ROSARY_THEMES.pt,
}: RosaryMenuProps) {
  const todayId = getMysteryForToday().id
  const latin = theme.language === 'la'

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
          style={{ color: theme.textMuted, fontFamily: 'var(--font-body)' }}
        >
          Mistérios{' '}
          {mysteryLocked && <span style={{ color: theme.textMuted, opacity: 0.7 }}>(Rosário completo)</span>}
        </h3>
        <div
          className="grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label="Escolha os mistérios"
        >
          {MYSTERY_GROUPS.map((g) => {
            const active = g.id === mysterySetId
            const isToday = g.id === todayId
            const displayName = latin && g.latinName ? g.latinName : g.name.replace('Mistérios ', '')
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
                  background: active ? theme.cardBg : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${active ? theme.borderStrong : theme.border}`,
                }}
              >
                <span
                  className="block text-sm font-medium"
                  style={{
                    color: active ? theme.accent : theme.textSecondary,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {displayName}
                </span>
                <span
                  className="block text-[11px] mt-0.5"
                  style={{ color: isToday ? theme.accentLight : theme.textMuted }}
                >
                  {isToday ? '● Hoje' : g.days}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="h-px mb-4" style={{ background: theme.border }} />

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
            theme={theme}
          />
        )}
        {hapticSupported && (
          <MenuToggle
            label="Vibração"
            icon={<Vibrate size={18} strokeWidth={1.5} />}
            enabled={hapticEnabled}
            onToggle={onHapticToggle}
            theme={theme}
          />
        )}
        {ttsSupported && (
          <MenuToggle
            label={ttsEnabled && ttsSpeaking ? 'Voz (falando…)' : 'Voz guiada'}
            icon={<Volume2 size={18} strokeWidth={1.5} />}
            enabled={ttsEnabled}
            onToggle={onTtsToggle}
            theme={theme}
          />
        )}
      </section>

      <div className="h-px mb-4" style={{ background: theme.border }} />

      <section className="flex flex-col gap-1">
        <MenuRow
          label="Tutorial"
          icon={<HelpCircle size={18} strokeWidth={1.5} />}
          onClick={onTutorial}
          theme={theme}
        />
        <MenuLinkRow
          href="/rosario/historico"
          label="Histórico"
          icon={<Clock size={18} strokeWidth={1.5} />}
          theme={theme}
        />
        <MenuLinkRow
          href="/rosario/juntos"
          label="Rezar em grupo"
          icon={<Users size={18} strokeWidth={1.5} />}
          theme={theme}
        />
        <MenuRow
          label="Reiniciar terço"
          icon={<RotateCcw size={18} strokeWidth={1.5} />}
          onClick={() => {
            onRestart()
            onClose()
          }}
          theme={theme}
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
  theme,
}: {
  label: string
  icon: ReactNode
  active?: boolean
  onClick?: () => void
  theme: RosaryTheme
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98] touch-target"
      style={{
        background: active ? theme.cardBg : 'transparent',
        color: active ? theme.accentLight : theme.textSecondary,
      }}
    >
      <span className="w-6 flex items-center justify-center" style={{ color: theme.textMuted }}>
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
  theme,
}: {
  label: string
  icon: ReactNode
  enabled: boolean
  onToggle: () => void
  theme: RosaryTheme
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98] touch-target"
      style={{ color: enabled ? theme.accentLight : theme.textSecondary }}
      aria-pressed={enabled}
    >
      <span className="w-6 flex items-center justify-center" style={{ color: theme.textMuted }}>
        {icon}
      </span>
      <span className="flex-1 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </span>
      <span
        className="w-11 h-6 rounded-full relative transition-colors"
        style={{
          background: enabled ? theme.borderStrong : 'rgba(122, 115, 104, 0.25)',
        }}
        aria-hidden
      >
        <span
          className="absolute top-1 h-4 w-4 rounded-full transition-all"
          style={{
            left: enabled ? '24px' : '4px',
            background: enabled ? theme.accent : theme.textMuted,
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
  theme,
}: {
  href: string
  label: string
  icon: ReactNode
  theme: RosaryTheme
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition active:scale-[0.98] touch-target"
      style={{ color: theme.textSecondary, textDecoration: 'none' }}
    >
      <span className="w-6 flex items-center justify-center" style={{ color: theme.textMuted }}>
        {icon}
      </span>
      <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </span>
    </Link>
  )
}
