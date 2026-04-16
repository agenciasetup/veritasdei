'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronLeft, ChevronRight, NotebookPen } from 'lucide-react'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { COMMANDMENTS } from '../data/commandments'
import { SINS } from '../data/sins'
import type { LifeState } from '../data/types'
import { loadNotes, saveNoteFor, type ExameNotes } from '../notesStorage'
import BottomSheet from '@/components/mobile/BottomSheet'
import { useHaptic } from '@/hooks/useHaptic'

interface ExamineStepperProps {
  selectedSins: Set<number>
  onToggleSin: (id: number) => void
  lifeState: LifeState
}

export default function ExamineStepper({
  selectedSins,
  onToggleSin,
  lifeState,
}: ExamineStepperProps) {
  const haptic = useHaptic()
  const [index, setIndex] = useState(0)
  const [notesOpen, setNotesOpen] = useState(false)
  const [notes, setNotes] = useState<ExameNotes>(() => loadNotes())

  const cmd = COMMANDMENTS[index]

  const sins = useMemo(() => {
    return SINS.filter((sin) => {
      if (sin.commandmentId !== cmd.id) return false
      if (lifeState === 'jovem' && !sin.teen) return false
      if (lifeState === 'casado' && !sin.married) return false
      return true
    })
  }, [cmd.id, lifeState])

  const checkedCount = sins.filter((s) => selectedSins.has(s.id)).length
  const noteText = notes.byCommandment[cmd.id] ?? ''

  function go(target: number) {
    if (target < 0 || target >= COMMANDMENTS.length) return
    if (target === index) return
    haptic.pulse('selection')
    setIndex(target)
  }

  function handleSwipe(_e: unknown, info: PanInfo) {
    const dx = info.offset.x
    const dy = info.offset.y
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
    if (dx < 0) go(index + 1)
    else go(index - 1)
  }

  return (
    <div>
      {/* Stepper dots */}
      <nav
        aria-label={`Mandamento ${index + 1} de ${COMMANDMENTS.length}`}
        className="flex items-center justify-center gap-1.5 mb-4"
      >
        {COMMANDMENTS.map((c, i) => {
          const cmdSins = SINS.filter((s) => s.commandmentId === c.id)
          const hasSelection = cmdSins.some((s) => selectedSins.has(s.id))
          const isActive = i === index
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ir para mandamento ${i + 1}`}
              aria-current={isActive ? 'step' : undefined}
              className="touch-target flex items-center justify-center"
              style={{ padding: 6 }}
            >
              <span
                className="block rounded-full transition-all"
                style={{
                  width: isActive ? 24 : hasSelection ? 8 : 6,
                  height: 6,
                  background: isActive
                    ? '#C9A84C'
                    : hasSelection
                      ? 'rgba(217,79,92,0.6)'
                      : 'rgba(242,237,228,0.15)',
                }}
              />
            </button>
          )
        })}
      </nav>

      {/* Card swipeable */}
      <AnimatePresence mode="wait">
        <motion.article
          key={cmd.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
          onPanEnd={handleSwipe}
          className="rounded-2xl p-4"
          style={{
            background: 'rgba(20,18,14,0.6)',
            border: '1px solid rgba(201,168,76,0.12)',
            touchAction: 'pan-y',
          }}
        >
          <header className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="text-[11px] uppercase tracking-[0.18em] mb-1"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
              >
                {index + 1}º Mandamento
              </p>
              <h2
                className="text-base font-semibold leading-snug"
                style={{ color: '#C9A84C', fontFamily: 'var(--font-display)' }}
              >
                {cmd.title}
              </h2>
              <p
                className="text-xs mt-1 italic"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-elegant)' }}
              >
                {cmd.scripture}
              </p>
            </div>
            {checkedCount > 0 && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                style={{
                  background: 'rgba(107,29,42,0.3)',
                  color: '#E08090',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {checkedCount}
              </span>
            )}
          </header>

          <p
            className="text-xs leading-relaxed mb-3 p-3 rounded-lg"
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              background: 'rgba(15,14,12,0.5)',
              borderLeft: '3px solid rgba(201,168,76,0.2)',
            }}
          >
            {cmd.description}
          </p>

          <ul className="space-y-1.5">
            {sins.map((sin) => {
              const checked = selectedSins.has(sin.id)
              return (
                <li key={sin.id}>
                  <label
                    className="flex items-start gap-3 p-3 rounded-xl cursor-pointer touch-target"
                    style={{
                      background: checked ? 'rgba(107,29,42,0.1)' : 'transparent',
                      border: `1px solid ${
                        checked ? 'rgba(107,29,42,0.2)' : 'transparent'
                      }`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (!checked) haptic.pulse('selection')
                        onToggleSin(sin.id)
                      }}
                      className="mt-0.5 flex-shrink-0 w-4 h-4 rounded"
                      style={{ accentColor: '#C9A84C' }}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm leading-relaxed block"
                        style={{
                          color: checked ? '#F2EDE4' : 'var(--text-secondary)',
                          fontFamily: 'var(--font-body)',
                          fontWeight: checked ? 400 : 300,
                        }}
                      >
                        {sin.text}
                      </span>
                      {sin.mortal && (
                        <span className="inline-flex items-center gap-1 mt-1">
                          <AlertTriangle
                            className="w-3 h-3"
                            style={{ color: '#E08090' }}
                          />
                          <span
                            className="text-[10px] tracking-wider uppercase"
                            style={{
                              color: '#E08090',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            Matéria grave
                          </span>
                        </span>
                      )}
                    </div>
                  </label>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.98] touch-target"
            style={{
              background: noteText
                ? 'rgba(201,168,76,0.1)'
                : 'rgba(255,255,255,0.02)',
              border: `1px solid ${
                noteText ? 'rgba(201,168,76,0.25)' : 'rgba(201,168,76,0.1)'
              }`,
              color: noteText ? '#C9A84C' : 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <NotebookPen className="w-4 h-4" />
            <span className="text-xs">
              {noteText ? 'Editar nota privada' : 'Adicionar nota privada'}
            </span>
          </button>
        </motion.article>
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="flex items-center justify-between mt-4 px-1">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Mandamento anterior"
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg active:scale-95 disabled:opacity-30"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          {index + 1} / {COMMANDMENTS.length}
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === COMMANDMENTS.length - 1}
          aria-label="Próximo mandamento"
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg active:scale-95 disabled:opacity-30"
          style={{ color: 'var(--text-secondary)' }}
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <NotesSheet
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        commandmentTitle={cmd.title}
        initialText={noteText}
        onSave={(text) => {
          const next = saveNoteFor(cmd.id, text)
          setNotes(next)
          setNotesOpen(false)
        }}
      />
    </div>
  )
}

interface NotesSheetProps {
  open: boolean
  onClose: () => void
  commandmentTitle: string
  initialText: string
  onSave: (text: string) => void
}

function NotesSheet({ open, onClose, commandmentTitle, initialText, onSave }: NotesSheetProps) {
  const [text, setText] = useState(initialText)
  // Reset quando o sheet (re)abre — padrão "store previous" do React.
  const [wasOpen, setWasOpen] = useState(open)
  if (wasOpen !== open) {
    if (open && text !== initialText) setText(initialText)
    setWasOpen(open)
  }

  return (
    <BottomSheet
      open={open}
      onDismiss={onClose}
      detents={[0.55, 0.92]}
      initialDetent={0}
      label="Nota privada"
    >
      <div className="pt-2 pb-6">
        <p
          className="text-[11px] uppercase tracking-[0.18em] mb-1"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Nota privada
        </p>
        <h3
          className="text-base font-semibold mb-2"
          style={{ color: '#C9A84C', fontFamily: 'var(--font-display)' }}
        >
          {commandmentTitle}
        </h3>
        <p
          className="text-xs mb-3"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Apenas neste dispositivo. Apagada automaticamente em 30 dias.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          autoFocus
          placeholder="Reflexões pessoais para a confissão…"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
          style={{
            background: 'rgba(15,14,12,0.7)',
            border: '1px solid rgba(201,168,76,0.18)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            minHeight: 180,
          }}
        />
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm touch-target-lg active:scale-[0.98]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(text)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold touch-target-lg active:scale-[0.98]"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
              fontFamily: 'var(--font-body)',
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
