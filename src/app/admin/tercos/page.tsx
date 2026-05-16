'use client'

/**
 * /admin/tercos — gestão das skins de terço.
 *
 * Lista todas as skins (publicadas, draft, archived), com ações:
 *   - Nova → cria draft e redireciona pro editor
 *   - Editar → /admin/tercos/[id]
 *   - Publicar/Despublicar → toggle status
 *   - Gerenciar códigos físicos (futuro)
 *
 * RLS: a tabela rosary_skins tem policy `rosary_skins_admin_all` que
 * exige role='admin' no profile. AdminLayout reapliga.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SkinMiniPreview } from '@/features/rosario/components/SkinMiniPreview'
import { resolveTheme, type RosarySkin } from '@/features/rosario/data/skinTypes'

function rowToSkin(row: Record<string, unknown>): RosarySkin {
  return {
    id: row.id as string,
    slug: row.slug as string,
    nome: row.nome as string,
    subtitulo: (row.subtitulo as string | null) ?? null,
    descricao: (row.descricao as string | null) ?? null,
    epigraph: (row.epigraph as string | null) ?? null,
    categoria: row.categoria as RosarySkin['categoria'],
    raridade: row.raridade as RosarySkin['raridade'],
    glyph: (row.glyph as string) ?? '✦',
    preview_url: (row.preview_url as string | null) ?? null,
    theme: resolveTheme(row.theme),
    mysteries: (row.mysteries as RosarySkin['mysteries']) ?? null,
    base_mystery_set: (row.base_mystery_set as RosarySkin['base_mystery_set']) ?? null,
    unlock_tipo: row.unlock_tipo as RosarySkin['unlock_tipo'],
    unlock_regras: (row.unlock_regras as RosarySkin['unlock_regras']) ?? {
      operador: 'todas',
      condicoes: [],
    },
    unlock_label: (row.unlock_label as string | null) ?? null,
    sku: (row.sku as string | null) ?? null,
    preco_cents: (row.preco_cents as number) ?? 0,
    ordem: (row.ordem as number) ?? 0,
    visivel: (row.visivel as boolean) ?? true,
    status: row.status as RosarySkin['status'],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

export default function AdminTercosPage() {
  const supabase = createClient()
  const router = useRouter()
  const [skins, setSkins] = useState<RosarySkin[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data } = await supabase
      .from('rosary_skins')
      .select('*')
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false })
    setSkins(((data ?? []) as Record<string, unknown>[]).map(rowToSkin))
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  async function criarDraft() {
    if (!supabase) return
    const ts = Date.now().toString(36)
    const { data, error } = await supabase
      .from('rosary_skins')
      .insert({
        slug: `nova-skin-${ts}`,
        nome: 'Nova skin',
        categoria: 'devocional',
        raridade: 'comum',
        status: 'draft',
        unlock_tipo: 'admin_only',
        ordem: skins.length,
      })
      .select('id')
      .single()
    if (error || !data) {
      alert(`Erro criando: ${error?.message ?? 'desconhecido'}`)
      return
    }
    router.push(`/admin/tercos/${data.id}`)
  }

  async function togglePublish(skin: RosarySkin) {
    if (!supabase) return
    setPending(skin.id)
    const next = skin.status === 'published' ? 'draft' : 'published'
    await supabase
      .from('rosary_skins')
      .update({ status: next })
      .eq('id', skin.id)
    setPending(null)
    await load()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="mb-2 text-[10px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--text-3)', fontFamily: 'var(--font-display)' }}
          >
            Admin · Coleção
          </p>
          <h1
            className="text-3xl md:text-4xl"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
          >
            Skins de Terço
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>
            Catálogo da loja. Edite paleta, mistérios, glyphs e regras de unlock.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/tercos/codigos"
            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs uppercase tracking-[0.18em] transition active:scale-[0.97]"
            style={{
              borderColor: 'var(--accent-soft)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Códigos físicos →
          </Link>
          <button
            type="button"
            onClick={criarDraft}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition active:scale-[0.97]"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
            Nova skin
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20" aria-live="polite">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      ) : skins.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ borderColor: 'var(--border-1)' }}
        >
          <Sparkles className="mx-auto mb-3 h-8 w-8" style={{ color: 'var(--text-3)' }} />
          <p className="mb-4 text-sm" style={{ color: 'var(--text-3)' }}>
            Nenhuma skin ainda.
          </p>
          <button
            type="button"
            onClick={criarDraft}
            className="rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Criar primeira
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skins.map((skin) => (
            <li
              key={skin.id}
              className="flex flex-col gap-3 rounded-2xl border p-4"
              style={{
                borderColor: skin.status === 'published' ? 'var(--accent-soft)' : 'var(--border-1)',
                background: 'var(--surface-2)',
                opacity: skin.status === 'archived' ? 0.55 : 1,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[9px] uppercase tracking-[0.22em]"
                  style={{
                    color:
                      skin.status === 'published'
                        ? 'var(--success)'
                        : skin.status === 'draft'
                          ? 'var(--warning)'
                          : 'var(--text-3)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {skin.status} · {skin.raridade}
                </span>
                <code
                  className="text-[10px]"
                  style={{ color: 'var(--text-3)' }}
                >
                  {skin.slug}
                </code>
              </div>

              <div className="flex items-center justify-center py-1">
                <SkinMiniPreview theme={skin.theme} size={120} />
              </div>

              <div>
                <h2
                  className="text-base"
                  style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
                >
                  {skin.nome}
                </h2>
                <p className="mt-0.5 text-xs italic" style={{ color: 'var(--text-3)' }}>
                  {skin.subtitulo ?? '—'}
                </p>
              </div>

              <div
                className="flex items-center justify-between gap-2 text-[10px]"
                style={{ color: 'var(--text-3)' }}
              >
                <span>{skin.categoria} · unlock: {skin.unlock_tipo}</span>
                <span>#{skin.ordem}</span>
              </div>

              <div className="mt-auto flex gap-2 pt-1">
                <Link
                  href={`/admin/tercos/${skin.id}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition active:scale-[0.97]"
                  style={{
                    borderColor: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  <Pencil className="h-3 w-3" /> Editar
                </Link>
                <button
                  type="button"
                  onClick={() => togglePublish(skin)}
                  disabled={pending === skin.id}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition active:scale-[0.97] disabled:opacity-50"
                  style={{
                    borderColor: 'rgba(122, 115, 104, 0.4)',
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-display)',
                  }}
                  title={skin.status === 'published' ? 'Despublicar' : 'Publicar'}
                >
                  {skin.status === 'published' ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </button>
                <Link
                  href={`/rosario/loja/${skin.slug}`}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-lg border px-2.5 py-2 text-xs transition active:scale-[0.97]"
                  style={{
                    borderColor: 'var(--border-1)',
                    color: 'var(--text-3)',
                  }}
                  title="Ver na loja"
                >
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
