'use client'

/**
 * /admin/educa/banners — CRUD do slider full-width do /educa/estudo.
 *
 * Acesso: AdminLayout já gateia por role=admin. Aqui só fazemos CRUD
 * sobre `educa_banners` via RLS (que reaplica a checagem do role).
 *
 * MVP: admin cola URL externa de imagem. Upload via Supabase Storage
 * fica pra próxima iteração.
 */

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Megaphone,
  Loader2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

type Banner = {
  id: string
  image_url: string
  link_url: string | null
  title: string | null
  subtitle: string | null
  ordem: number
  ativo: boolean
}

type FormState = {
  image_url: string
  link_url: string
  title: string
  subtitle: string
  ordem: number
  ativo: boolean
}

const EMPTY_FORM: FormState = {
  image_url: '',
  link_url: '',
  title: '',
  subtitle: '',
  ordem: 0,
  ativo: true,
}

export default function AdminBannersPage() {
  const supabase = createClient()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('educa_banners')
      .select('id, image_url, link_url, title, subtitle, ordem, ativo')
      .order('ordem', { ascending: true })
    if (error) {
      setError(error.message)
    } else {
      setBanners((data as Banner[]) ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  function startCreate() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, ordem: (banners.at(-1)?.ordem ?? -1) + 1 })
    setError(null)
    setShowForm(true)
  }

  function startEdit(b: Banner) {
    setEditingId(b.id)
    setForm({
      image_url: b.image_url,
      link_url: b.link_url ?? '',
      title: b.title ?? '',
      subtitle: b.subtitle ?? '',
      ordem: b.ordem,
      ativo: b.ativo,
    })
    setError(null)
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditingId(null)
    setError(null)
  }

  async function save() {
    if (!supabase) return
    if (!form.image_url.trim()) {
      setError('URL da imagem é obrigatória.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim() || null,
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      ordem: Number.isFinite(form.ordem) ? form.ordem : 0,
      ativo: form.ativo,
    }
    const op = editingId
      ? supabase.from('educa_banners').update(payload).eq('id', editingId)
      : supabase.from('educa_banners').insert(payload)
    const { error } = await op
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setShowForm(false)
    setEditingId(null)
    await load()
  }

  async function toggleAtivo(b: Banner) {
    if (!supabase) return
    const { error } = await supabase
      .from('educa_banners')
      .update({ ativo: !b.ativo })
      .eq('id', b.id)
    if (error) setError(error.message)
    else await load()
  }

  async function moveOrder(b: Banner, dir: -1 | 1) {
    if (!supabase) return
    const { error } = await supabase
      .from('educa_banners')
      .update({ ordem: b.ordem + dir })
      .eq('id', b.id)
    if (error) setError(error.message)
    else await load()
  }

  async function remove(b: Banner) {
    if (!supabase) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Excluir o banner "${b.title || b.id}" definitivamente?`)
    ) {
      return
    }
    const { error } = await supabase
      .from('educa_banners')
      .delete()
      .eq('id', b.id)
    if (error) setError(error.message)
    else await load()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="w-5 h-5" style={{ color: '#C9A84C' }} />
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Banners do Veritas Educa
            </h1>
          </div>
          <p
            className="text-xs"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Slider full-width que aparece no topo de <code>/educa/estudo</code>.
            Apenas os ativos são exibidos, em ordem crescente.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm flex-shrink-0"
          style={{
            background: '#C9A84C',
            color: '#0F0E0C',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
          }}
        >
          <Plus className="w-4 h-4" />
          Novo banner
        </button>
      </header>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-sm"
          style={{
            background: 'rgba(214,79,92,0.12)',
            border: '1px solid rgba(214,79,92,0.3)',
            color: '#D64F5C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {error}
        </div>
      )}

      {showForm && (
        <BannerForm
          form={form}
          setForm={setForm}
          saving={saving}
          editing={Boolean(editingId)}
          onCancel={cancel}
          onSave={save}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: '#C9A84C' }}
          />
        </div>
      ) : banners.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(201,168,76,0.2)',
          }}
        >
          <Megaphone
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: '#8A8378' }}
          />
          <p
            className="text-sm"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Nenhum banner ainda. Crie o primeiro pra aparecer no /educa/estudo.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {banners.map((b, i) => (
            <li
              key={b.id}
              className="rounded-2xl p-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(201,168,76,0.12)',
                opacity: b.ativo ? 1 : 0.5,
              }}
            >
              {/* Thumb */}
              <div
                className="w-24 h-14 md:w-32 md:h-20 rounded-lg overflow-hidden flex-shrink-0"
                style={{ background: '#1a1612' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(201,168,76,0.12)',
                      color: '#C9A84C',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    #{b.ordem}
                  </span>
                </div>
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                >
                  {b.title || <span style={{ color: '#8A8378' }}>(sem título)</span>}
                </p>
                <p
                  className="text-[11px] truncate"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  {b.subtitle || b.link_url || b.image_url}
                </p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <IconBtn
                  title="Subir ordem"
                  onClick={() => moveOrder(b, -1)}
                  disabled={i === 0}
                >
                  <ArrowUp className="w-4 h-4" />
                </IconBtn>
                <IconBtn
                  title="Descer ordem"
                  onClick={() => moveOrder(b, 1)}
                  disabled={i === banners.length - 1}
                >
                  <ArrowDown className="w-4 h-4" />
                </IconBtn>
                <IconBtn
                  title={b.ativo ? 'Desativar' : 'Ativar'}
                  onClick={() => toggleAtivo(b)}
                >
                  {b.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </IconBtn>
                <IconBtn title="Editar" onClick={() => startEdit(b)}>
                  <Pencil className="w-4 h-4" />
                </IconBtn>
                <IconBtn title="Excluir" onClick={() => remove(b)} danger>
                  <Trash2 className="w-4 h-4" />
                </IconBtn>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function BannerForm({
  form,
  setForm,
  saving,
  editing,
  onCancel,
  onSave,
}: {
  form: FormState
  setForm: (f: FormState) => void
  saving: boolean
  editing: boolean
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(201,168,76,0.18)',
      }}
    >
      <h2
        className="text-sm tracking-[0.15em] uppercase mb-4"
        style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
      >
        {editing ? 'Editar banner' : 'Novo banner'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="URL da imagem *">
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            placeholder="https://..."
            className="input"
          />
        </Field>
        <Field label="Link (opcional)">
          <input
            type="text"
            value={form.link_url}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            placeholder="/educa/trilhas ou URL externa"
            className="input"
          />
        </Field>
        <Field label="Título (opcional)">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Texto grande sobre a imagem"
            className="input"
          />
        </Field>
        <Field label="Subtítulo (opcional)">
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Etiqueta acima do título"
            className="input"
          />
        </Field>
        <Field label="Ordem">
          <input
            type="number"
            value={form.ordem}
            onChange={(e) =>
              setForm({ ...form, ordem: Number(e.target.value) || 0 })
            }
            className="input"
          />
        </Field>
        <Field label="Ativo">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            />
            <span
              className="text-sm"
              style={{ color: '#E8E2D8', fontFamily: 'Poppins, sans-serif' }}
            >
              Mostrar no slider
            </span>
          </label>
        </Field>
      </div>

      {/* Preview */}
      {form.image_url && (
        <div className="mt-4">
          <p
            className="text-[11px] tracking-wider uppercase mb-2"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Preview
          </p>
          <div
            className="relative aspect-[21/9] rounded-xl overflow-hidden"
            style={{ background: '#1a1612' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.opacity = '0.2'
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, rgba(15,14,12,0.85) 0%, rgba(15,14,12,0.35) 45%, transparent 70%)',
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              {form.subtitle && (
                <p
                  className="text-xs tracking-[0.25em] uppercase mb-1"
                  style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
                >
                  {form.subtitle}
                </p>
              )}
              {form.title && (
                <h3
                  className="text-2xl md:text-3xl leading-tight"
                  style={{
                    fontFamily: 'Cinzel, serif',
                    color: '#F2EDE4',
                    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                  }}
                >
                  {form.title}
                </h3>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#8A8378',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm disabled:opacity-60"
          style={{
            background: '#C9A84C',
            color: '#0F0E0C',
            fontFamily: 'Poppins, sans-serif',
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
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.75rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(201, 168, 76, 0.18);
          color: #f2ede4;
          font-family: 'Poppins', sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .input:focus {
          border-color: rgba(201, 168, 76, 0.5);
        }
      `}</style>
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
    <label className="block">
      <span
        className="text-[11px] tracking-wider uppercase block mb-1.5"
        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="w-8 h-8 inline-flex items-center justify-center rounded-lg active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        color: danger ? '#D64F5C' : '#C9A84C',
      }}
    >
      {children}
    </button>
  )
}
