'use client'

/**
 * /admin/tercos/[id] — editor de uma skin de terço.
 *
 * Live preview: o `SkinMiniPreview` renderiza usando o `theme` atual do
 * form em tempo real. Cada campo do form alimenta o JSONB theme do banco.
 *
 * Campos principais:
 *   - Identidade (nome, slug, subtítulo, descrição, epigraph, glyph,
 *     categoria, raridade)
 *   - Paleta (color pickers HTML5 pros tokens principais; textarea pros
 *     compostos como pageBgAmbient ou rgba(...))
 *   - Glyphs (selects pra crucifixVariant, introBeadVariant, beadShape)
 *   - Mistérios (textarea JSON de array com 5 itens — null = usa set do dia)
 *   - Unlock (tipo + textarea JSON da regras + label)
 *   - Commerce (sku, preco)
 *   - Meta (ordem, visivel, status)
 */

import { useCallback, useEffect, useMemo, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Trash2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SkinMiniPreview } from '@/features/rosario/components/SkinMiniPreview'
import {
  FALLBACK_THEME,
  resolveTheme,
  type RosarySkinTheme,
} from '@/features/rosario/data/skinTypes'

interface FormState {
  slug: string
  nome: string
  subtitulo: string
  descricao: string
  epigraph: string
  categoria: string
  raridade: string
  glyph: string
  preview_url: string
  unlock_tipo: string
  unlock_label: string
  unlock_regras_json: string
  mysteries_json: string
  base_mystery_set: string
  sku: string
  preco_cents: number
  ordem: number
  visivel: boolean
  status: string
  theme: RosarySkinTheme
}

const CATEGORIES = ['canonico', 'devocional', 'santo', 'doutrina', 'comemorativo', 'exclusivo']
const RARIDADES = ['comum', 'rara', 'epica', 'lendaria', 'suprema']
const UNLOCK_TIPOS = ['free', 'rules', 'commerce', 'admin_only', 'coming_soon']
const STATUSES = ['draft', 'published', 'archived']
const CRUCIFIX_VARIANTS = ['classic', 'benedictine', 'budded', 'celtic', 'pio']
const INTRO_BEAD_VARIANTS = ['classic', 'medal-bento', 'medal-divine-mercy', 'rose']
const BEAD_SHAPES = ['sphere', 'rose', 'cube', 'oval']

const EMPTY: FormState = {
  slug: '',
  nome: '',
  subtitulo: '',
  descricao: '',
  epigraph: '',
  categoria: 'devocional',
  raridade: 'comum',
  glyph: '✦',
  preview_url: '',
  unlock_tipo: 'admin_only',
  unlock_label: '',
  unlock_regras_json: '{\n  "operador": "todas",\n  "condicoes": []\n}',
  mysteries_json: 'null',
  base_mystery_set: '',
  sku: '',
  preco_cents: 0,
  ordem: 0,
  visivel: true,
  status: 'draft',
  theme: FALLBACK_THEME,
}

export default function AdminTercoEditor({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('rosary_skins')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) {
      setError(error?.message ?? 'Skin não encontrada')
      setLoading(false)
      return
    }
    setForm({
      slug: data.slug ?? '',
      nome: data.nome ?? '',
      subtitulo: data.subtitulo ?? '',
      descricao: data.descricao ?? '',
      epigraph: data.epigraph ?? '',
      categoria: data.categoria ?? 'devocional',
      raridade: data.raridade ?? 'comum',
      glyph: data.glyph ?? '✦',
      preview_url: data.preview_url ?? '',
      unlock_tipo: data.unlock_tipo ?? 'admin_only',
      unlock_label: data.unlock_label ?? '',
      unlock_regras_json: JSON.stringify(
        data.unlock_regras ?? { operador: 'todas', condicoes: [] },
        null,
        2,
      ),
      mysteries_json: data.mysteries
        ? JSON.stringify(data.mysteries, null, 2)
        : 'null',
      base_mystery_set: data.base_mystery_set ?? '',
      sku: data.sku ?? '',
      preco_cents: data.preco_cents ?? 0,
      ordem: data.ordem ?? 0,
      visivel: data.visivel ?? true,
      status: data.status ?? 'draft',
      theme: resolveTheme(data.theme),
    })
    setLoading(false)
  }, [id, supabase])

  useEffect(() => {
    void load()
  }, [load])

  function updateTheme<K extends keyof RosarySkinTheme>(key: K, value: RosarySkinTheme[K]) {
    setForm((f) => ({ ...f, theme: { ...f.theme, [key]: value } }))
  }

  async function save() {
    if (!supabase) return
    setSaving(true)
    setError(null)
    try {
      // Valida JSONs
      let unlockRegras
      try {
        unlockRegras = JSON.parse(form.unlock_regras_json)
      } catch {
        throw new Error('Regras de unlock: JSON inválido')
      }
      let mysteries: unknown
      try {
        const parsed = JSON.parse(form.mysteries_json)
        mysteries = parsed === null ? null : parsed
        if (mysteries !== null) {
          if (!Array.isArray(mysteries)) {
            throw new Error('Mistérios: precisa ser null ou array')
          }
          if (mysteries.length > 0 && mysteries.length !== 5) {
            throw new Error('Mistérios: deve ter exatamente 5 itens (ou null)')
          }
        }
      } catch (e) {
        throw new Error(
          e instanceof Error ? e.message : 'Mistérios: JSON inválido',
        )
      }

      const payload = {
        slug: form.slug.trim().toLowerCase(),
        nome: form.nome.trim(),
        subtitulo: form.subtitulo.trim() || null,
        descricao: form.descricao.trim() || null,
        epigraph: form.epigraph.trim() || null,
        categoria: form.categoria,
        raridade: form.raridade,
        glyph: form.glyph || '✦',
        preview_url: form.preview_url.trim() || null,
        theme: form.theme,
        mysteries,
        base_mystery_set: form.base_mystery_set || null,
        unlock_tipo: form.unlock_tipo,
        unlock_regras: unlockRegras,
        unlock_label: form.unlock_label.trim() || null,
        sku: form.sku.trim().toUpperCase() || null,
        preco_cents: form.preco_cents,
        ordem: form.ordem,
        visivel: form.visivel,
        status: form.status,
      }

      const { error: upErr } = await supabase
        .from('rosary_skins')
        .update(payload)
        .eq('id', id)
      if (upErr) throw new Error(upErr.message)

      setSavedAt(Date.now())
      setTimeout(() => setSavedAt(null), 2200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function excluir() {
    if (!supabase) return
    if (!window.confirm('Excluir essa skin? A ação não pode ser desfeita.')) return
    const { error: delErr } = await supabase
      .from('rosary_skins')
      .delete()
      .eq('id', id)
    if (delErr) {
      setError(delErr.message)
      return
    }
    router.push('/admin/tercos')
  }

  const previewTheme = useMemo(() => form.theme, [form.theme])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/tercos"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em]"
          style={{ color: 'var(--text-3)' }}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Skins
        </Link>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--success)' }}
            >
              ✓ Salvo
            </span>
          )}
          <button
            type="button"
            onClick={excluir}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs uppercase tracking-[0.15em]"
            style={{
              borderColor: 'rgba(217, 79, 92, 0.4)',
              color: 'var(--danger)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Trash2 className="h-3 w-3" />
            Excluir
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-60"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Salvar
          </button>
        </div>
      </header>

      {error && (
        <div
          className="mb-5 flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
          role="alert"
          style={{
            borderColor: 'color-mix(in srgb, var(--danger) 45%, transparent)',
            backgroundColor: 'rgba(70, 20, 20, 0.35)',
          }}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* FORM */}
        <div className="flex flex-col gap-6">
          {/* Identidade */}
          <Section title="Identidade">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Slug (URL)">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                  className="adm-input"
                />
              </Field>
              <Field label="Nome">
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="adm-input"
                />
              </Field>
              <Field label="Subtítulo">
                <input
                  type="text"
                  value={form.subtitulo}
                  onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                  className="adm-input"
                />
              </Field>
              <Field label="Glyph (emoji/símbolo)">
                <input
                  type="text"
                  value={form.glyph}
                  onChange={(e) => setForm({ ...form, glyph: e.target.value.slice(0, 4) })}
                  className="adm-input"
                />
              </Field>
              <Field label="Categoria">
                <Select
                  value={form.categoria}
                  options={CATEGORIES}
                  onChange={(v) => setForm({ ...form, categoria: v })}
                />
              </Field>
              <Field label="Raridade">
                <Select
                  value={form.raridade}
                  options={RARIDADES}
                  onChange={(v) => setForm({ ...form, raridade: v })}
                />
              </Field>
              <Field label="Descrição" className="md:col-span-2">
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={3}
                  className="adm-input"
                />
              </Field>
              <Field label="Epigraph (citação curta)" className="md:col-span-2">
                <input
                  type="text"
                  value={form.epigraph}
                  onChange={(e) => setForm({ ...form, epigraph: e.target.value })}
                  className="adm-input"
                />
              </Field>
              <Field label="Preview URL (imagem opcional)" className="md:col-span-2">
                <input
                  type="text"
                  value={form.preview_url}
                  onChange={(e) => setForm({ ...form, preview_url: e.target.value })}
                  className="adm-input"
                />
              </Field>
            </div>
          </Section>

          {/* Paleta */}
          <Section title="Paleta">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <ColorField label="Background (pageBg)" value={form.theme.pageBg} onChange={(v) => updateTheme('pageBg', v)} />
              <ColorField label="Accent" value={form.theme.accent} onChange={(v) => updateTheme('accent', v)} />
              <ColorField label="Accent Light" value={form.theme.accentLight} onChange={(v) => updateTheme('accentLight', v)} />
              <ColorField label="Accent Deep" value={form.theme.accentDeep} onChange={(v) => updateTheme('accentDeep', v)} />
              <ColorField label="Texto primário" value={form.theme.textPrimary} onChange={(v) => updateTheme('textPrimary', v)} />
              <ColorField label="Texto secundário" value={form.theme.textSecondary} onChange={(v) => updateTheme('textSecondary', v)} />
              <ColorField label="Texto mudo" value={form.theme.textMuted} onChange={(v) => updateTheme('textMuted', v)} />
              <Field label="Border (rgba ou hex)">
                <input
                  type="text"
                  value={form.theme.border}
                  onChange={(e) => updateTheme('border', e.target.value)}
                  className="adm-input"
                />
              </Field>
              <Field label="Border Strong (rgba ou hex)">
                <input
                  type="text"
                  value={form.theme.borderStrong}
                  onChange={(e) => updateTheme('borderStrong', e.target.value)}
                  className="adm-input"
                />
              </Field>
              <Field label="Card BG (rgba ou hex)">
                <input
                  type="text"
                  value={form.theme.cardBg}
                  onChange={(e) => updateTheme('cardBg', e.target.value)}
                  className="adm-input"
                />
              </Field>
              <Field label="Cord stroke (rgba)">
                <input
                  type="text"
                  value={form.theme.cordStroke}
                  onChange={(e) => updateTheme('cordStroke', e.target.value)}
                  className="adm-input"
                />
              </Field>
              <Field label="Ambient (gradient)" className="md:col-span-2">
                <textarea
                  value={form.theme.pageBgAmbient}
                  onChange={(e) => updateTheme('pageBgAmbient', e.target.value)}
                  rows={2}
                  className="adm-input font-mono text-[11px]"
                />
              </Field>
            </div>
          </Section>

          {/* Glyphs */}
          <Section title="Glyphs">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Cruz">
                <Select
                  value={form.theme.crucifixVariant}
                  options={CRUCIFIX_VARIANTS}
                  onChange={(v) => updateTheme('crucifixVariant', v as RosarySkinTheme['crucifixVariant'])}
                />
              </Field>
              <Field label="Conta inicial">
                <Select
                  value={form.theme.introBeadVariant}
                  options={INTRO_BEAD_VARIANTS}
                  onChange={(v) => updateTheme('introBeadVariant', v as RosarySkinTheme['introBeadVariant'])}
                />
              </Field>
              <Field label="Formato da conta">
                <Select
                  value={form.theme.beadShape}
                  options={BEAD_SHAPES}
                  onChange={(v) => updateTheme('beadShape', v as RosarySkinTheme['beadShape'])}
                />
              </Field>
            </div>
          </Section>

          {/* Mistérios */}
          <Section title="Mistérios (5 itens ou null)">
            <p className="mb-2 text-[11px]" style={{ color: 'var(--text-3)' }}>
              JSON com array de 5 mistérios{' '}
              <code>{`[{number, title, fruit, scripture, reflection}, ...]`}</code>{' '}
              ou <code>null</code> pra usar o set canônico do dia.
            </p>
            <textarea
              value={form.mysteries_json}
              onChange={(e) => setForm({ ...form, mysteries_json: e.target.value })}
              rows={10}
              className="adm-input font-mono text-[11px]"
            />
            <Field label="base_mystery_set (gozosos/luminosos/dolorosos/gloriosos) — opcional" className="mt-3">
              <input
                type="text"
                value={form.base_mystery_set}
                onChange={(e) => setForm({ ...form, base_mystery_set: e.target.value })}
                className="adm-input"
              />
            </Field>
          </Section>

          {/* Unlock */}
          <Section title="Unlock">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Tipo">
                <Select
                  value={form.unlock_tipo}
                  options={UNLOCK_TIPOS}
                  onChange={(v) => setForm({ ...form, unlock_tipo: v })}
                />
              </Field>
              <Field label="Label de bloqueio">
                <input
                  type="text"
                  value={form.unlock_label}
                  onChange={(e) => setForm({ ...form, unlock_label: e.target.value })}
                  className="adm-input"
                  placeholder="Ex.: Conclua o estudo de Mariologia"
                />
              </Field>
              <Field label="Regras (JSONB)" className="md:col-span-2">
                <textarea
                  value={form.unlock_regras_json}
                  onChange={(e) => setForm({ ...form, unlock_regras_json: e.target.value })}
                  rows={6}
                  className="adm-input font-mono text-[11px]"
                />
                <p className="mt-1 text-[10px]" style={{ color: 'var(--text-3)' }}>
                  Tipos: subtopico_concluido, grupo_concluido, topico_concluido,
                  nivel, streak, quiz_gabaritado, contador (mesmo DSL de cartas).
                </p>
              </Field>
            </div>
          </Section>

          {/* Commerce + Meta */}
          <Section title="Commerce & Meta">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="SKU (uppercase)">
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                  className="adm-input"
                />
              </Field>
              <Field label="Preço (centavos)">
                <input
                  type="number"
                  min={0}
                  value={form.preco_cents}
                  onChange={(e) => setForm({ ...form, preco_cents: Number(e.target.value) || 0 })}
                  className="adm-input"
                />
              </Field>
              <Field label="Ordem">
                <input
                  type="number"
                  value={form.ordem}
                  onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) || 0 })}
                  className="adm-input"
                />
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  options={STATUSES}
                  onChange={(v) => setForm({ ...form, status: v })}
                />
              </Field>
              <Field label="Visível no catálogo">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.visivel}
                    onChange={(e) => setForm({ ...form, visivel: e.target.checked })}
                  />
                  <span className="text-sm">Visível</span>
                </label>
              </Field>
            </div>
          </Section>
        </div>

        {/* LIVE PREVIEW */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div
            className="rounded-2xl border p-5"
            style={{
              borderColor: 'var(--accent-soft)',
              background: 'var(--surface-2)',
            }}
          >
            <p
              className="mb-4 text-[10px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
            >
              Preview ao vivo
            </p>
            <div className="flex justify-center">
              <SkinMiniPreview theme={previewTheme} size={240} />
            </div>
            <h3
              className="mt-4 text-center text-xl"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
            >
              {form.nome || 'Sem nome'}
            </h3>
            {form.subtitulo && (
              <p className="mt-1 text-center text-xs italic" style={{ color: 'var(--text-3)' }}>
                {form.subtitulo}
              </p>
            )}
            <p
              className="mt-3 text-center text-[10px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--text-3)' }}
            >
              {form.categoria} · {form.raridade}
            </p>
          </div>
        </aside>
      </div>

      <style>{`
        .adm-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-1);
          border-radius: 8px;
          color: var(--text-1);
          font-size: 13px;
          outline: none;
          transition: border-color 160ms ease;
        }
        .adm-input:focus { border-color: var(--accent); }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border p-4 md:p-5"
      style={{ borderColor: 'var(--border-1)', background: 'var(--surface-2)' }}
    >
      <h2
        className="mb-3 text-[11px] uppercase tracking-[0.25em]"
        style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  // Color picker funciona apenas com hex. Pra rgba/var, usa input texto.
  const isHex = /^#[0-9a-fA-F]{3,8}$/.test(value)
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          type="color"
          value={isHex ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border"
          style={{ borderColor: 'var(--border-1)', background: 'transparent' }}
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="adm-input flex-1 font-mono text-[12px]"
        />
      </div>
    </Field>
  )
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="adm-input"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
