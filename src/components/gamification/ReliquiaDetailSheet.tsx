'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import ReliquiaIcon from './ReliquiaIcon'
import { RARITY_META, type Reliquia } from '@/types/gamification'

interface Props {
  reliquia: Reliquia | null
  unlocked: boolean
  equipped: boolean
  onEquip: () => Promise<void> | void
  onClose: () => void
}

function unlockHint(rel: Reliquia): string {
  switch (rel.unlock_type) {
    case 'level':
      return `Alcance o nível ${rel.unlock_value ?? '?'}.`
    case 'streak':
      return `${rel.unlock_value ?? '?'} dias consecutivos de estudo.`
    case 'achievement_count':
      return `Desbloqueie ${rel.unlock_value ?? '?'} conquistas.`
    case 'pillar_complete':
      return `Complete todos os subtópicos do pilar "${rel.unlock_ref ?? '?'}".`
    case 'custom':
      if (rel.unlock_ref === 'all_pillars_complete') {
        return 'Complete todos os 7 pilares da fé católica.'
      }
      return 'Condição especial.'
    default:
      return ''
  }
}

export default function ReliquiaDetailSheet({
  reliquia,
  unlocked,
  equipped,
  onEquip,
  onClose,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (reliquia) {
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
  }, [reliquia, onClose])

  return (
    <AnimatePresence>
      {reliquia && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-labelledby="reliquia-title"
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md rounded-3xl p-6"
            style={{
              transform: 'translate(-50%, -50%)',
              background: 'rgba(20,18,14,0.92)',
              border: `1px solid ${RARITY_META[reliquia.rarity].border}`,
              boxShadow: `0 0 60px ${RARITY_META[reliquia.rarity].border}`,
              backdropFilter: 'blur(24px)',
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
              aria-label="Fechar"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)',
              }}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <ReliquiaIcon reliquia={reliquia} locked={!unlocked} size="lg" />

              <span
                className="mt-4 text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full"
                style={{
                  color: RARITY_META[reliquia.rarity].color,
                  background: RARITY_META[reliquia.rarity].bg,
                  border: `1px solid ${RARITY_META[reliquia.rarity].border}`,
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {RARITY_META[reliquia.rarity].label}
              </span>

              <h2
                id="reliquia-title"
                className="text-2xl mt-3"
                style={{
                  fontFamily: 'Cinzel, serif',
                  color: unlocked ? '#F2EDE4' : 'var(--text-secondary)',
                  letterSpacing: '0.03em',
                }}
              >
                {reliquia.name}
              </h2>

              <p
                className="text-sm mt-2 leading-relaxed"
                style={{ color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif' }}
              >
                {reliquia.description}
              </p>

              {reliquia.lore && (
                <p
                  className="text-[13px] italic mt-3 leading-relaxed"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'Cormorant Garamond, serif',
                  }}
                >
                  &ldquo;{reliquia.lore}&rdquo;
                </p>
              )}

              <div
                className="w-full mt-5 py-3 px-4 rounded-xl text-[12px]"
                style={{
                  background: 'rgba(242,237,228,0.04)',
                  border: '1px solid rgba(242,237,228,0.08)',
                  color: 'var(--text-muted)',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {unlocked ? '✓ Desbloqueado' : unlockHint(reliquia)}
              </div>

              {unlocked && (
                <button
                  type="button"
                  onClick={async () => {
                    await onEquip()
                    onClose()
                  }}
                  className="w-full mt-4 py-3 rounded-xl text-xs uppercase tracking-[0.15em] active:scale-[0.98] transition-transform"
                  style={{
                    background: equipped
                      ? 'rgba(242,237,228,0.06)'
                      : 'linear-gradient(135deg, rgba(201,168,76,0.22), rgba(201,168,76,0.1))',
                    border: `1px solid ${
                      equipped ? 'rgba(242,237,228,0.15)' : 'rgba(201,168,76,0.45)'
                    }`,
                    color: equipped ? 'var(--text-secondary)' : 'var(--gold)',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  {equipped ? 'Desequipar' : 'Equipar como selo'}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
