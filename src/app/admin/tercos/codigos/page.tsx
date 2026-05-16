'use client'

/**
 * /admin/tercos/codigos — gerenciamento de códigos de resgate de terço físico.
 *
 * Fluxo do mundo real:
 *   1. Admin escolhe a skin e o lote (ex.: "Bento - junho/2026").
 *   2. Admin gera N códigos aleatórios.
 *   3. Imprime/grava nos certificados que vão com os terços físicos.
 *   4. Comprador resgata o código via /rosario/loja → unlock da skin.
 *
 * Aqui:
 *   - Lista todos os códigos (com filtros por skin / lote / status).
 *   - Cria batch: { skin, lote, quantidade }.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Copy,
  Check,
  Loader2,
  Download,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SkinLite {
  id: string
  slug: string
  nome: string
}

interface Codigo {
  codigo: string
  skin_id: string
  lote: string | null
  used_by_user_id: string | null
  used_at: string | null
  created_at: string
}

// Charset: sem 0/O/1/I/L (confusão visual). Tamanho: 12 chars (estilo
// "BENEDITO-2026-A4F2" sem hífen — readability ok).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCodigo(length = 12): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return out
}

export default function AdminCodigosPage() {
  const supabase = createClient()
  const [skins, setSkins] = useState<SkinLite[]>([])
  const [codigos, setCodigos] = useState<Codigo[]>([])
  const [filterSkin, setFilterSkin] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'unused' | 'used'>('all')
  const [loading, setLoading] = useState(true)

  // Batch form
  const [batchSkinId, setBatchSkinId] = useState<string>('')
  const [batchLote, setBatchLote] = useState('')
  const [batchQty, setBatchQty] = useState(10)
  const [batchPending, setBatchPending] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchResult, setBatchResult] = useState<string[] | null>(null)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('rosary_skins').select('id, slug, nome').order('ordem'),
      supabase
        .from('rosary_redemption_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
    ])
    setSkins((s as SkinLite[]) ?? [])
    setCodigos((c as Codigo[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    return codigos.filter((c) => {
      if (filterSkin !== 'all' && c.skin_id !== filterSkin) return false
      if (filterStatus === 'unused' && c.used_at) return false
      if (filterStatus === 'used' && !c.used_at) return false
      return true
    })
  }, [codigos, filterSkin, filterStatus])

  const skinById = useMemo(
    () => new Map(skins.map((s) => [s.id, s])),
    [skins],
  )

  async function gerarBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (!batchSkinId) {
      setBatchError('Escolha uma skin.')
      return
    }
    if (batchQty < 1 || batchQty > 500) {
      setBatchError('Quantidade: entre 1 e 500.')
      return
    }
    setBatchPending(true)
    setBatchError(null)
    setBatchResult(null)
    try {
      const novos = new Set<string>()
      while (novos.size < batchQty) novos.add(generateCodigo(12))
      const rows = Array.from(novos).map((codigo) => ({
        codigo,
        skin_id: batchSkinId,
        lote: batchLote.trim() || null,
      }))
      const { error } = await supabase.from('rosary_redemption_codes').insert(rows)
      if (error) throw new Error(error.message)
      setBatchResult(Array.from(novos))
      await load()
    } catch (e) {
      setBatchError(e instanceof Error ? e.message : 'Erro ao gerar.')
    } finally {
      setBatchPending(false)
    }
  }

  function copyBatchToClipboard() {
    if (!batchResult) return
    const text = batchResult.join('\n')
    void navigator.clipboard.writeText(text)
  }

  function downloadBatchCSV() {
    if (!batchResult) return
    const skin = skinById.get(batchSkinId)
    const header = 'codigo,skin,lote\n'
    const lines = batchResult
      .map((c) => `${c},${skin?.slug ?? ''},${batchLote ?? ''}`)
      .join('\n')
    const blob = new Blob([header + lines], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `codigos-${skin?.slug ?? 'skin'}-${batchLote || 'lote'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin/tercos"
            className="mb-2 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em]"
            style={{ color: 'var(--text-3)' }}
          >
            <ArrowLeft className="h-3 w-3" /> Skins
          </Link>
          <h1
            className="text-3xl md:text-4xl"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}
          >
            Códigos de resgate
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>
            Cada código vira uma skin desbloqueada quando o cliente resgata na loja.
          </p>
        </div>
      </header>

      {/* Batch form */}
      <section
        className="mb-8 rounded-2xl border p-5"
        style={{ borderColor: 'var(--accent-soft)', background: 'var(--surface-2)' }}
      >
        <h2
          className="mb-4 text-[11px] uppercase tracking-[0.25em]"
          style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
        >
          Gerar batch
        </h2>
        <form
          onSubmit={gerarBatch}
          className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_2fr_1fr_auto] md:items-end"
        >
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>
              Skin
            </span>
            <select
              value={batchSkinId}
              onChange={(e) => setBatchSkinId(e.target.value)}
              className="adm-input"
            >
              <option value="">Selecione…</option>
              {skins.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.slug})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>
              Lote (opcional)
            </span>
            <input
              type="text"
              value={batchLote}
              onChange={(e) => setBatchLote(e.target.value)}
              placeholder="Ex.: bento-jun-2026"
              className="adm-input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>
              Quantidade
            </span>
            <input
              type="number"
              min={1}
              max={500}
              value={batchQty}
              onChange={(e) => setBatchQty(Number(e.target.value) || 1)}
              className="adm-input"
            />
          </label>
          <button
            type="submit"
            disabled={batchPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] disabled:opacity-60"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {batchPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Gerar
          </button>
        </form>

        {batchError && (
          <p className="mt-3 text-xs" style={{ color: 'var(--danger)' }}>
            {batchError}
          </p>
        )}

        {batchResult && (
          <div
            className="mt-4 rounded-lg border p-3"
            style={{ borderColor: 'var(--accent-soft)' }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
                <Check className="mr-1 inline h-3 w-3" /> {batchResult.length} códigos criados
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyBatchToClipboard}
                  className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] uppercase tracking-[0.15em]"
                  style={{ borderColor: 'var(--border-1)', color: 'var(--text-2)' }}
                >
                  <Copy className="h-3 w-3" /> Copiar
                </button>
                <button
                  type="button"
                  onClick={downloadBatchCSV}
                  className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] uppercase tracking-[0.15em]"
                  style={{ borderColor: 'var(--border-1)', color: 'var(--text-2)' }}
                >
                  <Download className="h-3 w-3" /> CSV
                </button>
              </div>
            </div>
            <pre
              className="max-h-40 overflow-auto rounded bg-black/30 p-2 font-mono text-[11px]"
              style={{ color: 'var(--text-1)' }}
            >
              {batchResult.join('\n')}
            </pre>
          </div>
        )}
      </section>

      {/* Filtros + lista */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={filterSkin}
          onChange={(e) => setFilterSkin(e.target.value)}
          className="adm-input max-w-xs"
        >
          <option value="all">Todas as skins</option>
          {skins.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'unused' | 'used')}
          className="adm-input max-w-xs"
        >
          <option value="all">Todos</option>
          <option value="unused">Não usados</option>
          <option value="used">Usados</option>
        </select>
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {filtered.length} código(s)
        </span>
      </div>

      {loading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin" style={{ color: 'var(--accent)' }} />
      ) : (
        <div
          className="overflow-x-auto rounded-2xl border"
          style={{ borderColor: 'var(--border-1)' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border-1)' }}
              >
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Skin</th>
                <th className="px-3 py-2 text-left">Lote</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Resgatado em</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const skin = skinById.get(c.skin_id)
                return (
                  <tr
                    key={c.codigo}
                    style={{ borderBottom: '1px solid var(--border-1)' }}
                  >
                    <td className="px-3 py-2 font-mono text-xs" style={{ color: 'var(--text-1)' }}>
                      {c.codigo}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-2)' }}>
                      {skin?.nome ?? c.skin_id}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-3)' }}>
                      {c.lote ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {c.used_at ? (
                        <span style={{ color: 'var(--text-3)' }}>Usado</span>
                      ) : (
                        <span style={{ color: 'var(--success)' }}>Livre</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-3)' }}>
                      {c.used_at ? new Date(c.used_at).toLocaleString('pt-BR') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .adm-input {
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-1);
          border-radius: 8px;
          color: var(--text-1);
          font-size: 13px;
          outline: none;
        }
        .adm-input:focus { border-color: var(--accent); }
      `}</style>
    </div>
  )
}
