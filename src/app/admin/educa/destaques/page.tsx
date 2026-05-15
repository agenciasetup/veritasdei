'use client'

/**
 * /admin/educa/destaques — CRUD dos rostos na faixa "stories" da landing
 * de venda do Veritas Educa.
 *
 * Acesso: AdminLayout já gateia por role=admin. Aqui só fazemos CRUD
 * sobre `educa_landing_destaques` via RLS.
 *
 * Imagens: usa o componente <ImageUploader> compartilhado que sobe
 * direto pra R2 via `/api/admin/media/presign`. Foto quadrada,
 * recortada em círculo na landing.
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
  Users,
  Loader2,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import ImageUploader, { type ImageSpec } from '@/components/admin/ImageUploader'

async function revalidateDestaques() {
  try {
    await fetch('/api/admin/educa/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'destaques' }),
    })
  } catch {
    /* não bloqueia UX se a invalidação falhar */
  }
}

type Destaque = {
  id: string
  nome: string
  subtitulo: string | null
  photo_url: string
  link_url: string | null
  ordem: number
  ativo: boolean
}

type FormState = {
  nome: string
  subtitulo: string
  photo_url: string
  link_url: string
  ordem: number
  ativo: boolean
}

const EMPTY_FORM: FormState = {
  nome: '',
  subtitulo: '',
  photo_url: '',
  link_url: '',
  ordem: 0,
  ativo: true,
}

const PHOTO_SPEC: ImageSpec = {
  recommendedWidth: 400,
  recommendedHeight: 400,
  aspectRatio: '1 / 1',
  maxMb: 2,
  formats: 'JPG, PNG, WebP',
  hint: 'Foto quadrada. Vai aparecer dentro de um círculo, então centralize o rosto.',
}

export default function AdminDestaquesPage() {
  const supabase = createClient()
  const [destaques, setDestaques] = useState<Destaque[]>([])
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
      .from('educa_landing_destaques')
      .select('id, nome, subtitulo, photo_url, link_url, ordem, ativo')
      .order('ordem', { ascending: true })
    if (error) {
      setError(error.message)
    } else {
      setDestaques((data as Destaque[]) ?? [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [load])

  function startCreate() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, ordem: (destaques.at(-1)?.ordem ?? -1) + 1 })
    setError(null)
    setShowForm(true)
  }

  function startEdit(d: Destaque) {
    setEditingId(d.id)
    setForm({
      nome: d.nome,
      subtitulo: d.subtitulo ?? '',
      photo_url: d.photo_url,
      link_url: d.link_url ?? '',
      ordem: d.ordem,
      ativo: d.ativo,
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
    if (!form.nome.trim()) {
      setError('Informe o nome.')
      return
    }
    if (!form.photo_url.trim()) {
      setError('Envie a foto antes de salvar.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      nome: form.nome.trim(),
      subtitulo: form.subtitulo.trim() || null,
      photo_url: form.photo_url.trim(),
      link_url: form.link_url.trim() || null,
      ordem: Number.isFinite(form.ordem) ? form.ordem : 0,
      ativo: form.ativo,
    }
    const op = editingId
      ? supabase.from('educa_landing_destaques').update(payload).eq('id', editingId)
      : supabase.from('educa_landing_destaques').insert(payload)
    const { error } = await op
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setShowForm(false)
    setEditingId(null)
    await load()
    await revalidateDestaques()
  }

  async function toggleAtivo(d: Destaque) {
    if (!supabase) return
    const { error } = await supabase
      .from('educa_landing_destaques')
      .update({ ativo: !d.ativo })
      .eq('id', d.id)
    if (error) setError(error.message)
    else {
      await load()
      await revalidateDestaques()
    }
  }

  async function moveOrder(d: Destaque, dir: -1 | 1) {
    if (!supabase) return
    const { error } = await supabase
      .from('educa_landing_destaques')
      .update({ ordem: d.ordem + dir })
      .eq('id', d.id)
    if (error) setError(error.message)
    else {
      await load()
      await revalidateDestaques()
    }
  }

  async function remove(d: Destaque) {
    if (!supabase) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Excluir "${d.nome}" definitivamente?`)
    ) {
      return
    }
    const { error } = await supabase
      .from('educa_landing_destaques')
      .delete()
      .eq('id', d.id)
    if (error) setError(error.message)
    else {
      await load()
      await revalidateDestaques()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5" style={{ color: '#C9A84C' }} />
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Destaques da landing
            </h1>
          </div>
          <p
            className="text-xs"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Faixa de rostos acima dos planos em <code>/educa</code>. Mostra padres,
            formadores e alunos referência. Mantenha curado e pequeno (até ~20 rostos).
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
          Novo destaque
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
        <DestaqueForm
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
      ) : destaques.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(201,168,76,0.2)',
          }}
        >
          <Users
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: '#8A8378' }}
          />
          <p
            className="text-sm"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Nenhum destaque cadastrado. Adicione padres, formadores ou alunos
            pra aparecerem na faixa acima dos planos.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {destaques.map((d, i) => (
            <li
              key={d.id}
              className="rounded-2xl p-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(201,168,76,0.12)',
                opacity: d.ativo ? 1 : 0.5,
              }}
            >
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
                style={{ background: '#1a1612', border: '1px solid rgba(201,168,76,0.3)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.photo_url}
                  alt={d.nome}
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
                    #{d.ordem}
                  </span>
                </div>
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                >
                  {d.nome}
                </p>
                {d.subtitulo && (
                  <p
                    className="text-[11px] truncate"
                    style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {d.subtitulo}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <IconBtn
                  title="Subir ordem"
                  onClick={() => moveOrder(d, -1)}
                  disabled={i === 0}
                >
                  <ArrowUp className="w-4 h-4" />
                </IconBtn>
                <IconBtn
                  title="Descer ordem"
                  onClick={() => moveOrder(d, 1)}
                  disabled={i === destaques.length - 1}
                >
                  <ArrowDown className="w-4 h-4" />
                </IconBtn>
                <IconBtn
                  title={d.ativo ? 'Desativar' : 'Ativar'}
                  onClick={() => toggleAtivo(d)}
                >
                  {d.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </IconBtn>
                <IconBtn title="Editar" onClick={() => startEdit(d)}>
                  <Pencil className="w-4 h-4" />
                </IconBtn>
                <IconBtn title="Excluir" onClick={() => remove(d)} danger>
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

function DestaqueForm({
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
        {editing ? 'Editar destaque' : 'Novo destaque'}
      </h2>

      <ImageUploader
        label="Foto"
        description="Foto da pessoa. Vai aparecer dentro de um círculo, então centralize o rosto na imagem."
        web={{
          url: form.photo_url,
          spec: PHOTO_SPEC,
          prefix: 'educa/destaques',
        }}
        onWebChange={(v) =>
          setForm({
            ...form,
            photo_url: v.url,
          })
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nome">
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Pe. Paulo Ricardo"
            className="input"
          />
        </Field>
        <Field label="Subtítulo (opcional)">
          <input
            type="text"
            value={form.subtitulo}
            onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
            placeholder="Padre, Influenciador..."
            className="input"
          />
        </Field>
        <Field label="Link (opcional)">
          <input
            type="text"
            value={form.link_url}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            placeholder="https://instagram.com/..."
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
              Mostrar na faixa
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
