'use client'

/**
 * /admin/codex — gestão dos personagens do Códex Veritas.
 *
 * Cada personagem agrupa variações de carta. Daqui o admin entra em
 * /admin/codex/[slug] para gerenciar as cartas daquele personagem.
 *
 * Acesso: AdminLayout gateia por role=admin; a RLS de `personagens`
 * reaplica a checagem.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ImageUploader, { type ImageSpec } from '@/components/admin/ImageUploader'
import type { Personagem } from '@/types/codex'

const ICONE_SPEC: ImageSpec = {
  recommendedWidth: 512,
  recommendedHeight: 512,
  aspectRatio: '1 / 1',
  maxMb: 2,
  formats: 'JPG, PNG, WebP',
  hint: 'Ícone/retrato pequeno do personagem — aparece na grade da coleção.',
}

interface FormState {
  slug: string
  nome: string
  subtitulo: string
  descricao: string
  icone_url: string
  ordem: number
  visivel: boolean
}

const EMPTY: FormState = {
  slug: '',
  nome: '',
  subtitulo: '',
  descricao: '',
  icone_url: '',
  ordem: 0,
  visivel: true,
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminCodexPage() {
  const [personagens, setPersonagens] = useState<Personagem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    if (!supabase) return
    setLoading(true)
    const { data, error: e } = await supabase
      .from('personagens')
      .select('*')
      .order('ordem')
    if (e) setError(e.message)
    else setPersonagens((data as Personagem[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [load])

  function startCreate() {
    setEditingId(null)
    setForm({ ...EMPTY, ordem: (personagens.at(-1)?.ordem ?? -1) + 1 })
    setError(null)
    setShowForm(true)
  }

  function startEdit(p: Personagem) {
    setEditingId(p.id)
    setForm({
      slug: p.slug,
      nome: p.nome,
      subtitulo: p.subtitulo ?? '',
      descricao: p.descricao ?? '',
      icone_url: p.icone_url ?? '',
      ordem: p.ordem,
      visivel: p.visivel,
    })
    setError(null)
    setShowForm(true)
  }

  async function save() {
    const supabase = createClient()
    if (!supabase) return
    if (!form.nome.trim()) {
      setError('Dê um nome ao personagem.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      slug: form.slug.trim() || slugify(form.nome),
      nome: form.nome.trim(),
      subtitulo: form.subtitulo.trim() || null,
      descricao: form.descricao.trim() || null,
      icone_url: form.icone_url.trim() || null,
      ordem: form.ordem,
      visivel: form.visivel,
    }
    const op = editingId
      ? supabase.from('personagens').update(payload).eq('id', editingId)
      : supabase.from('personagens').insert(payload)
    const { error: e } = await op
    setSaving(false)
    if (e) {
      setError(e.message)
      return
    }
    setShowForm(false)
    setEditingId(null)
    await load()
  }

  async function toggleVisivel(p: Personagem) {
    const supabase = createClient()
    if (!supabase) return
    const { error: e } = await supabase
      .from('personagens')
      .update({ visivel: !p.visivel })
      .eq('id', p.id)
    if (e) setError(e.message)
    else await load()
  }

  async function remove(p: Personagem) {
    const supabase = createClient()
    if (!supabase) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Excluir o personagem "${p.nome}" e TODAS as suas cartas? Esta ação não pode ser desfeita.`,
      )
    ) {
      return
    }
    const { error: e } = await supabase
      .from('personagens')
      .delete()
      .eq('id', p.id)
    if (e) setError(e.message)
    else await load()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" style={{ color: '#C9A84C' }} />
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Códex Veritas · Personagens
            </h1>
          </div>
          <p
            className="text-xs"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Cada personagem agrupa variações de carta colecionável. Entre num
            personagem para gerenciar suas cartas e regras de desbloqueio.
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
          Novo personagem
        </button>
      </header>

      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-sm"
          style={{
            background: 'rgba(214,79,92,0.12)',
            border: '1px solid rgba(214,79,92,0.3)',
            color: '#D64F5C',
          }}
        >
          {error}
        </div>
      )}

      {showForm && (
        <div
          className="rounded-2xl p-5 mb-6 space-y-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(201,168,76,0.18)',
          }}
        >
          <div className="flex items-center justify-between">
            <h2
              className="text-sm tracking-[0.15em] uppercase"
              style={{ color: '#C9A84C', fontFamily: 'Cinzel, serif' }}
            >
              {editingId ? 'Editar personagem' : 'Novo personagem'}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#8A8378' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome">
              <input
                className="input"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Jesus Cristo"
              />
            </Field>
            <Field label="Slug (vazio = gerado do nome)">
              <input
                className="input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="jesus-cristo"
              />
            </Field>
            <Field label="Subtítulo">
              <input
                className="input"
                value={form.subtitulo}
                onChange={(e) =>
                  setForm({ ...form, subtitulo: e.target.value })
                }
                placeholder="O Verbo Eterno Encarnado"
              />
            </Field>
            <Field label="Ordem">
              <input
                className="input"
                type="number"
                value={form.ordem}
                onChange={(e) =>
                  setForm({ ...form, ordem: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea
              className="input"
              rows={2}
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </Field>
          <ImageUploader
            label="Ícone do personagem"
            description="Retrato pequeno que aparece na grade da coleção."
            web={{
              url: form.icone_url,
              spec: ICONE_SPEC,
              prefix: 'codex/personagens',
            }}
            onWebChange={(v) => setForm({ ...form, icone_url: v.url })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.visivel}
              onChange={(e) =>
                setForm({ ...form, visivel: e.target.checked })
              }
            />
            <span
              className="text-xs"
              style={{ color: '#C9C2B4', fontFamily: 'Poppins, sans-serif' }}
            >
              Visível na coleção
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{
                background: '#C9A84C',
                color: '#0F0E0C',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
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
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
        </div>
      ) : personagens.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(201,168,76,0.2)',
          }}
        >
          <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: '#8A8378' }} />
          <p
            className="text-sm"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Nenhum personagem ainda. Crie o primeiro.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {personagens.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl p-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(201,168,76,0.12)',
                opacity: p.visivel ? 1 : 0.55,
              }}
            >
              <div
                className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.15)',
                }}
              >
                {p.icone_url ? (
                  <Image
                    src={p.icone_url}
                    alt={p.nome}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Sparkles className="w-5 h-5" style={{ color: '#C9A84C' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm truncate"
                  style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                >
                  {p.nome}
                </p>
                <p
                  className="text-[11px] truncate"
                  style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
                >
                  {p.total_cartas} carta(s) publicada(s)
                  {p.subtitulo ? ` · ${p.subtitulo}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => toggleVisivel(p)}
                  aria-label="Alternar visibilidade"
                  className="p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#8A8378' }}
                >
                  {p.visivel ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  aria-label="Editar"
                  className="p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#C9A84C' }}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  aria-label="Excluir"
                  className="p-2 rounded-lg"
                  style={{ background: 'rgba(214,79,92,0.1)', color: '#D64F5C' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link
                  href={`/admin/codex/${p.slug}`}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs"
                  style={{
                    background: 'rgba(201,168,76,0.12)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Cartas
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
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
    <label className="flex flex-col gap-1">
      <span
        className="text-[10px] uppercase tracking-wide"
        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}
