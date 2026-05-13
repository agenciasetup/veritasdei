'use client'

/**
 * Admin → Order bumps.
 *
 * Lista, cria, edita e exclui add-ons que aparecem no checkout. Cada
 * bump tem código, título, descrição, valor, badge e (opcional) lista
 * de planos onde aparece — lista vazia = aparece em todos.
 *
 * Aviso: o valor do bump entra como ADD-ON RECORRENTE — o cliente paga
 * o bump junto com a renovação. Pra ofertas one-shot use o painel
 * próprio do Asaas.
 */

import { useEffect, useState } from 'react'
import { Save, Plus, Trash2, Loader2, X, PlusSquare } from 'lucide-react'

type Bump = {
  id: string
  codigo: string
  titulo: string
  descricao: string | null
  valor_cents: number
  badge: string | null
  plan_codigos: string[]
  ordem: number
  ativo: boolean
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export default function AdminOrderBumpsPage() {
  const [bumps, setBumps] = useState<Bump[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; tom: 'ok' | 'erro' } | null>(
    null,
  )

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/order-bumps')
      const data = await res.json()
      setBumps(data.bumps ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function flash(text: string, tom: 'ok' | 'erro' = 'ok') {
    setMsg({ text, tom })
    setTimeout(() => setMsg(null), 3500)
  }

  function update(id: string, patch: Partial<Bump>) {
    setBumps(b => b.map(x => (x.id === id ? { ...x, ...patch } : x)))
  }

  async function save(bump: Bump) {
    setSaving(bump.id)
    try {
      const res = await fetch(`/api/admin/order-bumps/${bump.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: bump.codigo,
          titulo: bump.titulo,
          descricao: bump.descricao,
          valor_cents: bump.valor_cents,
          badge: bump.badge,
          plan_codigos: bump.plan_codigos,
          ordem: bump.ordem,
          ativo: bump.ativo,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Falha ao salvar')
      }
      flash('Salvo')
      await load()
    } catch (err) {
      flash((err as Error).message, 'erro')
    } finally {
      setSaving(null)
    }
  }

  async function remove(bump: Bump) {
    if (
      !window.confirm(
        `Excluir o bump "${bump.titulo}"? Histórico de sessões antigas é preservado em snapshot.`,
      )
    )
      return
    setSaving(bump.id)
    try {
      const res = await fetch(`/api/admin/order-bumps/${bump.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Falha ao excluir')
      }
      flash('Excluído')
      await load()
    } catch (err) {
      flash((err as Error).message, 'erro')
    } finally {
      setSaving(null)
    }
  }

  async function create(draft: {
    codigo: string
    titulo: string
    valor_cents: number
  }) {
    if (!draft.codigo.trim() || !draft.titulo.trim()) {
      flash('codigo e titulo são obrigatórios', 'erro')
      return
    }
    try {
      const res = await fetch('/api/admin/order-bumps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: draft.codigo.trim(),
          titulo: draft.titulo.trim(),
          valor_cents: draft.valor_cents,
          ativo: true,
          ordem: bumps.length,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Falha ao criar')
      }
      flash('Criado')
      await load()
    } catch (err) {
      flash((err as Error).message, 'erro')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1
          className="text-2xl mb-1"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
        >
          Order bumps
        </h1>
        <p
          className="text-xs"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Add-ons opcionais que o cliente marca no checkout antes de pagar. O
          valor é somado à assinatura recorrente.
        </p>
      </header>

      {msg && (
        <div
          className="mb-4 p-3 rounded-xl text-xs"
          style={{
            background:
              msg.tom === 'ok'
                ? 'rgba(102,187,106,0.12)'
                : 'rgba(230,126,34,0.12)',
            border: `1px solid ${
              msg.tom === 'ok'
                ? 'rgba(102,187,106,0.35)'
                : 'rgba(230,126,34,0.35)'
            }`,
            color: msg.tom === 'ok' ? '#66BB6A' : '#E67E22',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {msg.text}
        </div>
      )}

      {bumps.length === 0 && (
        <div
          className="mb-6 p-6 rounded-2xl text-center text-xs"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(201,168,76,0.25)',
            color: '#A8A096',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Nenhum bump cadastrado. Crie um abaixo para oferecer add-ons no
          checkout.
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        {bumps.map(bump => (
          <section
            key={bump.id}
            className="p-5 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(201,168,76,0.15)',
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <PlusSquare className="w-5 h-5" style={{ color: '#C9A84C' }} />
              <code className="text-[11px]" style={{ color: '#7A7368' }}>
                {bump.codigo}
              </code>
              <label
                className="ml-auto flex items-center gap-2 text-xs"
                style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
              >
                <input
                  type="checkbox"
                  checked={bump.ativo}
                  onChange={e => update(bump.id, { ativo: e.target.checked })}
                />
                Ativo
              </label>
            </div>

            <Field label="Código (slug único)">
              <input
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={fieldStyle}
                value={bump.codigo}
                onChange={e => update(bump.id, { codigo: e.target.value })}
              />
            </Field>

            <Field label="Título (aparece no checkout)">
              <input
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
                value={bump.titulo}
                onChange={e => update(bump.id, { titulo: e.target.value })}
              />
            </Field>

            <Field label="Descrição">
              <textarea
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
                rows={2}
                value={bump.descricao ?? ''}
                onChange={e => update(bump.id, { descricao: e.target.value })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor (R$)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={fieldStyle}
                  value={(bump.valor_cents / 100).toFixed(2)}
                  onChange={e =>
                    update(bump.id, {
                      valor_cents: Math.round(
                        parseFloat(e.target.value || '0') * 100,
                      ),
                    })
                  }
                />
                <p
                  className="text-[10px] mt-1"
                  style={{ color: '#7A7368' }}
                >
                  Atual: {formatBRL(bump.valor_cents)}
                </p>
              </Field>
              <Field label='Badge (ex: "MAIS POPULAR")'>
                <input
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={fieldStyle}
                  value={bump.badge ?? ''}
                  onChange={e => update(bump.id, { badge: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Planos em que aparece (códigos, separados por vírgula — vazio = todos)">
              <input
                className="w-full px-3 py-2 rounded-lg text-sm font-mono"
                style={fieldStyle}
                value={bump.plan_codigos.join(', ')}
                onChange={e =>
                  update(bump.id, {
                    plan_codigos: e.target.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="premium, veritas-educa"
              />
            </Field>

            <Field label="Ordem (menor aparece primeiro)">
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
                value={bump.ordem}
                onChange={e =>
                  update(bump.id, { ordem: Number(e.target.value) })
                }
              />
            </Field>

            <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
              <button
                type="button"
                onClick={() => remove(bump)}
                disabled={saving === bump.id}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs touch-target-lg active:scale-[0.98]"
                style={{
                  background: 'rgba(230,126,34,0.1)',
                  border: '1px solid rgba(230,126,34,0.3)',
                  color: '#E67E22',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
              <button
                type="button"
                onClick={() => save(bump)}
                disabled={saving === bump.id}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs touch-target-lg active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
                  color: '#0F0E0C',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                }}
              >
                {saving === bump.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Salvar
              </button>
            </div>
          </section>
        ))}
      </div>

      <CreateBumpForm onCreate={create} />
    </div>
  )
}

function CreateBumpForm({
  onCreate,
}: {
  onCreate: (draft: {
    codigo: string
    titulo: string
    valor_cents: number
  }) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [valor, setValor] = useState('0.00')
  const [busy, setBusy] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-sm touch-target-lg active:scale-[0.98]"
        style={{
          background: 'rgba(201,168,76,0.08)',
          border: '1px dashed rgba(201,168,76,0.3)',
          color: '#C9A84C',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <Plus className="w-4 h-4" />
        Criar novo order bump
      </button>
    )
  }

  return (
    <section
      className="p-5 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(201,168,76,0.15)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
        >
          Novo order bump
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          style={{ color: '#7A7368' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <input
          className="px-3 py-2 rounded-lg text-sm font-mono"
          style={fieldStyle}
          placeholder="codigo (ex: ebook-confissao)"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
        />
        <input
          className="px-3 py-2 rounded-lg text-sm"
          style={fieldStyle}
          placeholder='Título (ex: "Guia da Confissão em PDF")'
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
        />
      </div>
      <input
        type="number"
        step="0.01"
        min="0"
        className="w-full px-3 py-2 rounded-lg text-sm mb-3"
        style={fieldStyle}
        placeholder="Valor em reais (ex: 9.90)"
        value={valor}
        onChange={e => setValor(e.target.value)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await onCreate({
              codigo,
              titulo,
              valor_cents: Math.round(parseFloat(valor || '0') * 100),
            })
            setCodigo('')
            setTitulo('')
            setValor('0.00')
            setOpen(false)
          } finally {
            setBusy(false)
          }
        }}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs touch-target-lg active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
          color: '#0F0E0C',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
        }}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        Criar
      </button>
    </section>
  )
}

const fieldStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(201,168,76,0.15)',
  color: '#F2EDE4',
  fontFamily: 'Poppins, sans-serif',
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-3">
      <label
        className="block text-[10px] uppercase tracking-wider mb-1"
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
