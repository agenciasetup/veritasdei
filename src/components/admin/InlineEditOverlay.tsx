'use client'

/**
 * InlineEditOverlay — botão "lápis" flutuante que aparece pra admin
 * em conteúdos personalizáveis (banners de pilares, tópicos, lições, etc.).
 *
 * Uso típico:
 *   <InlineEditOverlay
 *     table="content_topics"
 *     id={topic.id}
 *     fields={['cover_url']}
 *     label="Editar capa"
 *   >
 *     <CinematicHero ... />
 *   </InlineEditOverlay>
 *
 * O wrapper renderiza children normalmente e — só se `profile.role==='admin'`
 * — posiciona um botão lápis no canto superior direito que abre o drawer
 * de edição. RLS no banco garante que apenas admin consegue salvar
 * (mesmo se alguém tentar burlar o front).
 *
 * Quando `cover_url` está entre os campos, o drawer abre o <ImageUploader>
 * unificado (web+mobile, drag&drop, specs, crop por reposicionamento,
 * upload direto pro R2) e salva também as colunas `cover_url_mobile`,
 * `cover_position` e `cover_position_mobile` na mesma operação.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Pencil, Save, X, Loader2, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import ImageUploader, { type ImageSpec } from '@/components/admin/ImageUploader'

export type EditableField = 'cover_url' | 'video_url' | 'title' | 'description'

type EditableTable =
  | 'content_groups'
  | 'content_topics'
  | 'content_subtopics'
  | 'trails'

type Props = {
  table: EditableTable
  id: string
  fields: EditableField[]
  /** Label do botão (default "Editar"). */
  label?: string
  /** Position default top-right. Mantém estável em diferentes hosts. */
  position?: 'top-right' | 'top-left' | 'bottom-right'
  children: ReactNode
  /** Callback opcional após salvar (ex.: refresh manual). Quando omitido,
   *  a página é recarregada via window.location.reload() pra refletir
   *  o novo estado sem refator do hook que carregou os dados. */
  onSaved?: () => void
}

// Spec por tabela — escolhemos as proporções de cada superfície do app.
// Pilar/Grupo/Tópico aparecem como poster 16:10; trilhas como poster 3:4.
const COVER_SPECS_WEB: Record<EditableTable, ImageSpec> = {
  content_groups: {
    recommendedWidth: 1600,
    recommendedHeight: 1000,
    aspectRatio: '16 / 10',
    maxMb: 3,
    formats: 'JPG, PNG, WebP',
    hint: 'Capa do pilar no card poster (16:10). O título sobrepõe o canto inferior — deixe o foco visual em cima ou no centro.',
  },
  content_topics: {
    recommendedWidth: 1600,
    recommendedHeight: 1000,
    aspectRatio: '16 / 10',
    maxMb: 3,
    formats: 'JPG, PNG, WebP',
    hint: 'Capa do tópico (16:10).',
  },
  content_subtopics: {
    recommendedWidth: 1600,
    recommendedHeight: 1000,
    aspectRatio: '16 / 10',
    maxMb: 3,
    formats: 'JPG, PNG, WebP',
    hint: 'Capa do subtópico (16:10).',
  },
  trails: {
    recommendedWidth: 1200,
    recommendedHeight: 1600,
    aspectRatio: '3 / 4',
    maxMb: 3,
    formats: 'JPG, PNG, WebP',
    hint: 'Poster da trilha (3:4). Componha como um pôster de filme.',
  },
}

const COVER_SPECS_MOBILE: Record<EditableTable, ImageSpec> = {
  content_groups: {
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    aspectRatio: '1 / 1',
    maxMb: 2,
    formats: 'JPG, PNG, WebP',
    hint: 'Variante mobile quadrada — mais legível em telas estreitas. Vazio = usa a web com reposicionamento.',
  },
  content_topics: {
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    aspectRatio: '1 / 1',
    maxMb: 2,
    formats: 'JPG, PNG, WebP',
    hint: 'Variante mobile do tópico. Vazio = usa a web.',
  },
  content_subtopics: {
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    aspectRatio: '1 / 1',
    maxMb: 2,
    formats: 'JPG, PNG, WebP',
    hint: 'Variante mobile do subtópico. Vazio = usa a web.',
  },
  trails: {
    recommendedWidth: 1080,
    recommendedHeight: 1350,
    aspectRatio: '4 / 5',
    maxMb: 2,
    formats: 'JPG, PNG, WebP',
    hint: 'Poster mobile da trilha (4:5). Vazio = usa a web.',
  },
}

const PREFIX_BY_TABLE: Record<EditableTable, string> = {
  content_groups: 'educa/covers/groups',
  content_topics: 'educa/covers/topics',
  content_subtopics: 'educa/covers/subtopics',
  trails: 'educa/covers/trails',
}

export default function InlineEditOverlay({
  table,
  id,
  fields,
  label = 'Editar',
  position = 'top-right',
  children,
  onSaved,
}: Props) {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [open, setOpen] = useState(false)

  if (!isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {children}

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label={label}
        title={label}
        className={`absolute z-30 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs active:scale-95 transition-transform ${
          position === 'top-right'
            ? 'top-3 right-3 md:top-4 md:right-4'
            : position === 'top-left'
              ? 'top-3 left-3 md:top-4 md:left-4'
              : 'bottom-3 right-3 md:bottom-4 md:right-4'
        }`}
        style={{
          background:
            'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 65%, black) 100%)',
          color: 'var(--accent-contrast)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          boxShadow:
            '0 6px 18px -4px color-mix(in srgb, var(--accent) 50%, transparent)',
        }}
      >
        <Pencil className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </button>

      {open && (
        <EditDrawer
          table={table}
          id={id}
          fields={fields}
          label={label}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false)
            if (onSaved) onSaved()
            else if (typeof window !== 'undefined') window.location.reload()
          }}
        />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Drawer
// ────────────────────────────────────────────────────────────────────────

/** Quando o usuário pede edição de `cover_url`, o drawer também
 *  carrega e salva os campos auxiliares (variante mobile + posições). */
const COVER_EXTRA_FIELDS = [
  'cover_url_mobile',
  'cover_position',
  'cover_position_mobile',
] as const

function EditDrawer({
  table,
  id,
  fields,
  label,
  onClose,
  onSaved,
}: {
  table: EditableTable
  id: string
  fields: EditableField[]
  label: string
  onClose: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasCover = fields.includes('cover_url')
  const selectColumns = [
    ...fields,
    ...(hasCover ? COVER_EXTRA_FIELDS : []),
  ].join(', ')

  // Carrega valores atuais
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      if (!supabase) {
        if (!cancelled) setLoading(false)
        return
      }
      setLoading(true)
      const { data, error } = await supabase
        .from(table)
        .select(selectColumns)
        .eq('id', id)
        .maybeSingle()
      if (cancelled) return
      if (error) {
        setError(error.message)
      } else if (data) {
        const next: Record<string, string> = {}
        const allFields: string[] = [
          ...fields,
          ...(hasCover ? COVER_EXTRA_FIELDS : []),
        ]
        for (const f of allFields) {
          const v = (data as Record<string, unknown>)[f]
          next[f] = typeof v === 'string' ? v : ''
        }
        setValues(next)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  // selectColumns/fields são estáveis durante o lifetime do drawer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, id, selectColumns])

  const set = useCallback((field: string, value: string) => {
    setValues((cur) => ({ ...cur, [field]: value }))
  }, [])

  async function save() {
    const supabase = createClient()
    if (!supabase) return
    setSaving(true)
    setError(null)
    const payload: Record<string, string | null> = {}
    const allFields: string[] = [
      ...fields,
      ...(hasCover ? COVER_EXTRA_FIELDS : []),
    ]
    for (const f of allFields) {
      payload[f] = values[f]?.trim() ? values[f].trim() : null
    }
    const { error } = await supabase.from(table).update(payload).eq('id', id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    // Após salvar capa, invalida o cache server-side dos pilares pro
    // /educa/estudo recarregar a versão nova sem esperar o TTL de 5 min.
    if (hasCover) {
      try {
        await fetch('/api/admin/educa/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: 'pillars' }),
        })
      } catch {
        /* não bloqueia */
      }
    }
    onSaved()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--accent) 4%, var(--surface-2)) 0%, var(--surface-1) 100%)',
          border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
          boxShadow: '0 -20px 60px -20px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="sticky top-0 px-5 py-4 flex items-center justify-between"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,14,12,0.95) 0%, rgba(15,14,12,0.7) 100%)',
            borderBottom:
              '1px solid color-mix(in srgb, var(--accent) 14%, transparent)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <p
              className="text-[10px] tracking-[0.22em] uppercase"
              style={{
                color: 'var(--accent)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {table.replace('content_', '').replace('_', ' ')}
            </p>
            <h2
              className="text-lg"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--text-1)',
              }}
            >
              {label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-1)',
              color: 'var(--text-2)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2
                className="w-5 h-5 animate-spin"
                style={{ color: 'var(--accent)' }}
              />
            </div>
          ) : (
            <>
              {fields.map((f) => {
                if (f === 'cover_url') {
                  return (
                    <CoverField
                      key={f}
                      table={table}
                      web={{
                        url: values.cover_url ?? '',
                        position: values.cover_position ?? '',
                      }}
                      mobile={{
                        url: values.cover_url_mobile ?? '',
                        position: values.cover_position_mobile ?? '',
                      }}
                      onWebChange={(v) => {
                        set('cover_url', v.url)
                        set('cover_position', v.position ?? '')
                      }}
                      onMobileChange={(v) => {
                        set('cover_url_mobile', v.url)
                        set('cover_position_mobile', v.position ?? '')
                      }}
                    />
                  )
                }
                return (
                  <FieldEditor
                    key={f}
                    field={f}
                    value={values[f] ?? ''}
                    onChange={(v) => set(f, v)}
                  />
                )
              })}
              {error && (
                <p
                  className="text-sm px-3 py-2 rounded-xl"
                  style={{
                    background:
                      'color-mix(in srgb, var(--warning) 14%, transparent)',
                    color: 'var(--warning)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        <footer
          className="sticky bottom-0 px-5 py-4 flex items-center justify-end gap-2"
          style={{
            background:
              'linear-gradient(0deg, rgba(15,14,12,0.95) 0%, rgba(15,14,12,0.7) 100%)',
            borderTop:
              '1px solid color-mix(in srgb, var(--accent) 14%, transparent)',
            backdropFilter: 'blur(12px)',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-1)',
              color: 'var(--text-3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm disabled:opacity-60"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
            }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </button>
        </footer>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Cover field (delega ao ImageUploader universal)
// ────────────────────────────────────────────────────────────────────────

function CoverField({
  table,
  web,
  mobile,
  onWebChange,
  onMobileChange,
}: {
  table: EditableTable
  web: { url: string; position: string }
  mobile: { url: string; position: string }
  onWebChange: (v: { url: string; position?: string }) => void
  onMobileChange: (v: { url: string; position?: string }) => void
}) {
  const prefix = PREFIX_BY_TABLE[table]
  const specWeb = COVER_SPECS_WEB[table]
  const specMobile = COVER_SPECS_MOBILE[table]

  return (
    <ImageUploader
      label="Capa"
      description="Web e mobile separadas. Toggle no canto direito; o preview já mostra a proporção certa."
      web={{
        url: web.url,
        position: web.position || undefined,
        spec: specWeb,
        prefix: `${prefix}/web`,
      }}
      mobile={{
        url: mobile.url,
        position: mobile.position || undefined,
        spec: specMobile,
        prefix: `${prefix}/mobile`,
      }}
      onWebChange={onWebChange}
      onMobileChange={onMobileChange}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────
// Field editor (campos simples: title, description, video_url)
// ────────────────────────────────────────────────────────────────────────

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: EditableField
  value: string
  onChange: (v: string) => void
}) {
  const isVideo = field === 'video_url'
  const isText = field === 'title' || field === 'description'

  const label =
    field === 'video_url'
      ? 'URL do vídeo (YouTube)'
      : field === 'title'
        ? 'Título'
        : field === 'description'
          ? 'Descrição'
          : ''

  const placeholder =
    field === 'video_url' ? 'https://youtube.com/watch?v=...' : ''

  return (
    <div>
      <label
        className="text-[11px] tracking-[0.15em] uppercase block mb-2"
        style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
      >
        {label}
      </label>
      {isText ? (
        field === 'description' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border:
                '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
              color: 'var(--text-1)',
              fontFamily: 'var(--font-body)',
            }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border:
                '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
              color: 'var(--text-1)',
              fontFamily: 'var(--font-body)',
            }}
          />
        )
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: 'rgba(0,0,0,0.35)',
            border:
              '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
            color: 'var(--text-1)',
            fontFamily: 'var(--font-body)',
          }}
        />
      )}

      {isVideo && value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
        >
          <ExternalLink className="w-3 h-3" />
          Testar link
        </a>
      )}
    </div>
  )
}
