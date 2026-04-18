'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

import TagInput from './TagInput'
import { useAutosizeTextarea } from './useAutosizeTextarea'

export type PrayerMetaDraft = {
  latinTitle: string
  latinBody: string
  audioUrl: string
  videoUrl: string
  keywords: string[]
  scriptureRefs: string[]
  metaDescription: string
  indulgenceNote: string
  iconName: string
}

const ICON_CHOICES = [
  'Heart',
  'Shield',
  'ShieldCheck',
  'Cross',
  'Sunrise',
  'Moon',
  'Bell',
  'Flame',
  'Sparkles',
  'Church',
  'Crown',
  'Droplets',
  'Compass',
  'HandHeart',
  'Lightbulb',
  'BookOpenText',
]

/**
 * Drawer lateral (right sheet no desktop, bottom sheet no mobile)
 * com todos os metadados não-body da oração: latin, áudio/vídeo,
 * keywords, scripture_refs, indulgence, meta_description, icon.
 *
 * Controlado pelo parent via `open` + callbacks.
 */
export default function MetaPanel({
  open,
  meta,
  onChange,
  onClose,
}: {
  open: boolean
  meta: PrayerMetaDraft
  onChange: (next: PrayerMetaDraft) => void
  onClose: () => void
}) {
  const latinRef = useAutosizeTextarea(meta.latinBody)
  const descRef = useAutosizeTextarea(meta.metaDescription)
  const indRef = useAutosizeTextarea(meta.indulgenceNote)

  // Esc fecha
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[150]"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-full md:w-[420px] overflow-y-auto"
        style={{
          background: '#141210',
          borderLeft: '1px solid rgba(201,168,76,0.22)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '-16px 0 40px rgba(0,0,0,0.5)',
        }}
      >
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
          style={{
            background: 'rgba(20,18,14,0.95)',
            borderBottom: '1px solid rgba(201,168,76,0.15)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <h2
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: '0.9rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#C9A84C',
              fontWeight: 600,
            }}
          >
            Metadados
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex items-center justify-center rounded-lg w-8 h-8 active:scale-90"
            style={{ color: '#8A8378' }}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex flex-col gap-4 p-5">
          <Section title="Latim">
            <Field label="Título em latim">
              <input
                value={meta.latinTitle}
                onChange={(e) =>
                  onChange({ ...meta, latinTitle: e.target.value })
                }
                placeholder="Pater Noster"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </Field>
            <Field label="Texto em latim">
              <textarea
                ref={latinRef}
                value={meta.latinBody}
                onChange={(e) =>
                  onChange({ ...meta, latinBody: e.target.value })
                }
                placeholder="Pater noster, qui es in caelis…"
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                style={{
                  ...inputStyle,
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: 'italic',
                  fontSize: '1rem',
                  lineHeight: 1.5,
                }}
              />
            </Field>
          </Section>

          <Section title="Mídia">
            <Field label="URL do áudio (MP3/M4A)">
              <input
                value={meta.audioUrl}
                onChange={(e) => onChange({ ...meta, audioUrl: e.target.value })}
                placeholder="https://… (upload inline vem no sprint 5)"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </Field>
            <Field label="Link do YouTube">
              <input
                value={meta.videoUrl}
                onChange={(e) => onChange({ ...meta, videoUrl: e.target.value })}
                placeholder="https://youtu.be/…"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={inputStyle}
              />
            </Field>
          </Section>

          <Section title="Busca e SEO">
            <Field label="Meta description (aparece no Google)">
              <textarea
                ref={descRef}
                value={meta.metaDescription}
                onChange={(e) =>
                  onChange({ ...meta, metaDescription: e.target.value })
                }
                placeholder="Resumo curto em 1–2 linhas"
                rows={2}
                maxLength={200}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                style={inputStyle}
              />
              <p
                className="text-[10px] mt-1"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                {meta.metaDescription.length}/200
              </p>
            </Field>
            <Field label="Palavras-chave">
              <TagInput
                value={meta.keywords}
                onChange={(next) => onChange({ ...meta, keywords: next })}
                placeholder="Enter ou vírgula para adicionar"
              />
            </Field>
            <Field label="Referências bíblicas">
              <TagInput
                value={meta.scriptureRefs}
                onChange={(next) => onChange({ ...meta, scriptureRefs: next })}
                placeholder="Ex: Mt 6:9-13"
              />
            </Field>
          </Section>

          <Section title="Tradição católica">
            <Field label="Nota de indulgência (opcional)">
              <textarea
                ref={indRef}
                value={meta.indulgenceNote}
                onChange={(e) =>
                  onChange({ ...meta, indulgenceNote: e.target.value })
                }
                placeholder="Ex: Indulgência parcial concedida a quem reza devotamente…"
                rows={2}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                style={inputStyle}
              />
            </Field>
          </Section>

          <Section title="Aparência">
            <Field label="Ícone">
              <div className="grid grid-cols-4 gap-2">
                {ICON_CHOICES.map((name) => {
                  const selected = meta.iconName === name
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onChange({ ...meta, iconName: name })}
                      className="flex items-center justify-center rounded-lg py-2 text-[10px]"
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        background: selected
                          ? 'rgba(201,168,76,0.18)'
                          : 'rgba(20,18,14,0.55)',
                        border: `1px solid ${selected ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.1)'}`,
                        color: selected ? '#C9A84C' : '#8A8378',
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            </Field>
          </Section>
        </div>
      </aside>
    </div>
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
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: 'rgba(20,18,14,0.5)',
        border: '1px solid rgba(201,168,76,0.12)',
      }}
    >
      <h3
        style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '0.7rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#C9A84C',
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[11px]"
        style={{
          fontFamily: 'Poppins, sans-serif',
          color: '#8A8378',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'Poppins, sans-serif',
  background: '#0A0A0A',
  border: '1px solid rgba(201,168,76,0.15)',
  color: '#F2EDE4',
}
