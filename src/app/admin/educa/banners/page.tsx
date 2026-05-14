'use client'

/**
 * /admin/educa/banners — CRUD do slider full-width do /educa/estudo.
 *
 * Acesso: AdminLayout já gateia por role=admin. Aqui só fazemos CRUD
 * sobre `educa_banners` via RLS (que reaplica a checagem do role).
 *
 * Imagens: usa o componente <ImageUploader> compartilhado que sobe
 * direto pra R2 via `/api/admin/media/presign`, com toggle Web|Mobile
 * e reposicionamento. Admin não precisa mais colar URL externa.
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
import ImageUploader, { type ImageSpec } from '@/components/admin/ImageUploader'

async function revalidateBanners() {
  try {
    await fetch('/api/admin/educa/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'banners' }),
    })
  } catch {
    /* não bloqueia UX se a invalidação falhar */
  }
}

type Banner = {
  id: string
  image_url: string
  image_url_mobile: string | null
  image_position: string | null
  image_position_mobile: string | null
  link_url: string | null
  title: string | null
  subtitle: string | null
  ordem: number
  ativo: boolean
}

type FormState = {
  image_url: string
  image_url_mobile: string
  image_position: string
  image_position_mobile: string
  link_url: string
  title: string
  subtitle: string
  ordem: number
  ativo: boolean
}

const EMPTY_FORM: FormState = {
  image_url: '',
  image_url_mobile: '',
  image_position: '',
  image_position_mobile: '',
  link_url: '',
  title: '',
  subtitle: '',
  ordem: 0,
  ativo: true,
}

const BANNER_WEB_SPEC: ImageSpec = {
  recommendedWidth: 2520,
  recommendedHeight: 1080,
  aspectRatio: '21 / 9',
  maxMb: 4,
  formats: 'JPG, PNG, WebP',
  hint: 'O título aparece à esquerda da imagem — deixe o foco visual à direita ou no centro pra não competir com o texto.',
}

const BANNER_MOBILE_SPEC: ImageSpec = {
  recommendedWidth: 1080,
  recommendedHeight: 1350,
  aspectRatio: '4 / 5',
  maxMb: 3,
  formats: 'JPG, PNG, WebP',
  hint: 'Recorte vertical pro slider mobile. Se vazio, o app usa a versão web reposicionada.',
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
      .select(
        'id, image_url, image_url_mobile, image_position, image_position_mobile, link_url, title, subtitle, ordem, ativo',
      )
      .order('ordem', { ascending: true })
    if (error) {
      setError(error.message)
    } else {
      setBanners((data as Banner[]) ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // Microtask defere o setState pra fora do body síncrono do effect,
    // o que satisfaz a regra `react-hooks/set-state-in-effect` do Next 16.
    queueMicrotask(() => void load())
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
      image_url_mobile: b.image_url_mobile ?? '',
      image_position: b.image_position ?? '',
      image_position_mobile: b.image_position_mobile ?? '',
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
      setError('Envie a imagem desktop antes de salvar.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      image_url: form.image_url.trim(),
      image_url_mobile: form.image_url_mobile.trim() || null,
      image_position: form.image_position.trim() || null,
      image_position_mobile: form.image_position_mobile.trim() || null,
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
    await revalidateBanners()
  }

  async function toggleAtivo(b: Banner) {
    if (!supabase) return
    const { error } = await supabase
      .from('educa_banners')
      .update({ ativo: !b.ativo })
      .eq('id', b.id)
    if (error) setError(error.message)
    else {
      await load()
      await revalidateBanners()
    }
  }

  async function moveOrder(b: Banner, dir: -1 | 1) {
    if (!supabase) return
    const { error } = await supabase
      .from('educa_banners')
      .update({ ordem: b.ordem + dir })
      .eq('id', b.id)
    if (error) setError(error.message)
    else {
      await load()
      await revalidateBanners()
    }
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
    else {
      await load()
      await revalidateBanners()
    }
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
                  className="w-full h-full"
                  style={{
                    objectFit: 'cover',
                    objectPosition: b.image_position ?? '50% 50%',
                  }}
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
                  {b.image_url_mobile && (
                    <span
                      className="text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(91,143,109,0.18)',
                        color: '#5B8F6D',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      mobile
                    </span>
                  )}
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
      className="rounded-2xl p-5 mb-6 space-y-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(201,168,76,0.18)',
      }}
    >
      <h2
        className="text-sm tracking-[0.15em] uppercase"
        style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
      >
        {editing ? 'Editar banner' : 'Novo banner'}
      </h2>

      <ImageUploader
        label="Imagem do banner"
        description="A imagem ocupa o topo do /educa/estudo. Use uma variante mobile pra preservar o foco em telas estreitas."
        web={{
          url: form.image_url,
          position: form.image_position || undefined,
          spec: BANNER_WEB_SPEC,
          prefix: 'educa/banners/web',
        }}
        mobile={{
          url: form.image_url_mobile,
          position: form.image_position_mobile || undefined,
          spec: BANNER_MOBILE_SPEC,
          prefix: 'educa/banners/mobile',
        }}
        onWebChange={(v) =>
          setForm({
            ...form,
            image_url: v.url,
            image_position: v.position ?? '',
          })
        }
        onMobileChange={(v) =>
          setForm({
            ...form,
            image_url_mobile: v.url,
            image_position_mobile: v.position ?? '',
          })
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="flex items-center justify-end gap-2">
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
