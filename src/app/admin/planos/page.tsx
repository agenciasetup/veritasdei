'use client'

/**
 * Admin → Planos.
 *
 * Gerencia o catálogo de planos (Premium, Veritas Educa, …):
 *  - cria/edita plano (nome, descrição, benefícios, default_provider);
 *  - cria/edita/exclui preços por intervalo (mensal/semestral/anual/único);
 *  - cola `stripe_price_id` se o provedor for Stripe.
 *
 * IMPORTANTE — Asaas: preços de subprodutos NÃO existem no painel da
 * Asaas. Aqui é a fonte da verdade. A Asaas só recebe `value`, `cycle`
 * e `nextDueDate` na hora de criar a subscription do cliente.
 */

import { useEffect, useState } from 'react'
import { Save, Plus, Trash2, CreditCard, Loader2, X } from 'lucide-react'

type Price = {
  id: string
  intervalo: 'mensal' | 'semestral' | 'anual' | 'unico'
  amount_cents: number
  moeda: string
  stripe_price_id: string | null
  ativo: boolean
}

type Plan = {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  beneficios: string[]
  destaque: string | null
  ativo: boolean
  ordem: number
  default_provider: 'asaas' | 'stripe' | 'hubla' | 'manual'
  billing_prices: Price[]
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export default function AdminPlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [savingPlan, setSavingPlan] = useState<string | null>(null)
  const [savingPrice, setSavingPrice] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; tom: 'ok' | 'erro' } | null>(
    null,
  )

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/planos')
      const data = await res.json()
      setPlans(data.plans ?? [])
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

  async function savePlan(plan: Plan) {
    setSavingPlan(plan.id)
    try {
      const res = await fetch(`/api/admin/planos/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: plan.nome,
          descricao: plan.descricao,
          beneficios: plan.beneficios,
          destaque: plan.destaque,
          ativo: plan.ativo,
          ordem: plan.ordem,
          default_provider: plan.default_provider,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Falha ao salvar')
      }
      flash('Plano salvo')
      await load()
    } catch (err) {
      flash((err as Error).message, 'erro')
    } finally {
      setSavingPlan(null)
    }
  }

  async function deletePrice(price: Price) {
    if (
      !window.confirm(
        `Excluir o preço ${price.intervalo} de ${formatBRL(price.amount_cents)}? ` +
          'Se houver assinaturas usando, prefira desativar.',
      )
    ) {
      return
    }
    setSavingPrice(price.id)
    try {
      const res = await fetch(`/api/admin/planos/precos/${price.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Falha ao excluir')
      }
      flash('Preço excluído')
      await load()
    } catch (err) {
      flash((err as Error).message, 'erro')
    } finally {
      setSavingPrice(null)
    }
  }

  async function createPrice(planId: string, draft: {
    intervalo: Price['intervalo']
    amount_cents: number
  }) {
    setSavingPrice(`new-${planId}`)
    try {
      const res = await fetch('/api/admin/planos/precos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          intervalo: draft.intervalo,
          amount_cents: draft.amount_cents,
          ativo: true,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Falha ao criar preço')
      }
      flash('Preço adicionado')
      await load()
    } catch (err) {
      flash((err as Error).message, 'erro')
    } finally {
      setSavingPrice(null)
    }
  }

  async function createPlan(draft: {
    codigo: string
    nome: string
    descricao: string
  }) {
    if (!draft.codigo.trim() || !draft.nome.trim()) {
      flash('codigo e nome são obrigatórios', 'erro')
      return
    }
    try {
      const res = await fetch('/api/admin/planos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: draft.codigo.trim(),
          nome: draft.nome.trim(),
          descricao: draft.descricao.trim() || null,
          ativo: true,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Falha ao criar plano')
      }
      flash('Plano criado')
      await load()
    } catch (err) {
      flash((err as Error).message, 'erro')
    }
  }

  async function savePrice(price: Price) {
    setSavingPrice(price.id)
    try {
      const res = await fetch(`/api/admin/planos/precos/${price.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: price.amount_cents,
          stripe_price_id: price.stripe_price_id,
          ativo: price.ativo,
          intervalo: price.intervalo,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Falha ao salvar')
      }
      flash('Preço salvo')
      await load()
    } catch (err) {
      flash((err as Error).message, 'erro')
    } finally {
      setSavingPrice(null)
    }
  }

  function updatePlan(id: string, patch: Partial<Plan>) {
    setPlans(p => p.map(x => (x.id === id ? { ...x, ...patch } : x)))
  }

  function updatePrice(planId: string, priceId: string, patch: Partial<Price>) {
    setPlans(p =>
      p.map(pl =>
        pl.id === planId
          ? {
              ...pl,
              billing_prices: pl.billing_prices.map(pr =>
                pr.id === priceId ? { ...pr, ...patch } : pr,
              ),
            }
          : pl,
      ),
    )
  }

  function addBeneficio(planId: string) {
    setPlans(p =>
      p.map(pl =>
        pl.id === planId ? { ...pl, beneficios: [...pl.beneficios, ''] } : pl,
      ),
    )
  }

  function updateBeneficio(planId: string, index: number, value: string) {
    setPlans(p =>
      p.map(pl => {
        if (pl.id !== planId) return pl
        const arr = [...pl.beneficios]
        arr[index] = value
        return { ...pl, beneficios: arr }
      }),
    )
  }

  function removeBeneficio(planId: string, index: number) {
    setPlans(p =>
      p.map(pl => {
        if (pl.id !== planId) return pl
        return { ...pl, beneficios: pl.beneficios.filter((_, i) => i !== index) }
      }),
    )
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
          Planos & Preços
        </h1>
        <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Gerencie o catálogo do Veritas Dei Premium. Os <code className="text-[10px]" style={{ color: '#C9A84C' }}>stripe_price_id</code> você cria no dashboard Stripe e cola aqui.
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
              msg.tom === 'ok' ? 'rgba(102,187,106,0.35)' : 'rgba(230,126,34,0.35)'
            }`,
            color: msg.tom === 'ok' ? '#66BB6A' : '#E67E22',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {msg.text}
        </div>
      )}

      {plans.map(plan => (
        <section
          key={plan.id}
          className="mb-8 p-5 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(201,168,76,0.15)',
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <CreditCard className="w-5 h-5" style={{ color: '#C9A84C' }} />
            <code className="text-[11px]" style={{ color: '#7A7368' }}>
              {plan.codigo}
            </code>
            <label className="ml-auto flex items-center gap-2 text-xs" style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}>
              <input
                type="checkbox"
                checked={plan.ativo}
                onChange={e => updatePlan(plan.id, { ativo: e.target.checked })}
              />
              Ativo
            </label>
          </div>

          <Field label="Nome">
            <input
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={fieldStyle}
              value={plan.nome}
              onChange={e => updatePlan(plan.id, { nome: e.target.value })}
            />
          </Field>

          <Field label="Descrição">
            <textarea
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={fieldStyle}
              rows={2}
              value={plan.descricao ?? ''}
              onChange={e => updatePlan(plan.id, { descricao: e.target.value })}
            />
          </Field>

          <Field label="Destaque (ex: 'Mais popular')">
            <input
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={fieldStyle}
              value={plan.destaque ?? ''}
              onChange={e => updatePlan(plan.id, { destaque: e.target.value })}
            />
          </Field>

          <Field label="Provedor de pagamento padrão">
            <select
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={fieldStyle}
              value={plan.default_provider ?? 'asaas'}
              onChange={e =>
                updatePlan(plan.id, {
                  default_provider: e.target.value as Plan['default_provider'],
                })
              }
            >
              <option value="asaas">Asaas (PIX + cartão, checkout custom)</option>
              <option value="stripe">Stripe (cartão, hosted checkout)</option>
              <option value="hubla">
                Hubla (link estático — usado por /educa/assine)
              </option>
              <option value="manual">Manual (sem checkout automático)</option>
            </select>
            <p
              className="text-[10px] mt-1"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Asaas é o default global. Stripe/Hubla só fazem sentido se o
              plano específico precisar de fluxo legado.
            </p>
          </Field>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-[11px] uppercase tracking-wider"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Benefícios
              </label>
              <button
                type="button"
                onClick={() => addBeneficio(plan.id)}
                className="inline-flex items-center gap-1 text-xs"
                style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
              >
                <Plus className="w-3 h-3" />
                Adicionar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {plan.beneficios.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={fieldStyle}
                    value={b}
                    onChange={e => updateBeneficio(plan.id, i, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeBeneficio(plan.id, i)}
                    className="px-2 rounded-lg"
                    style={{
                      background: 'rgba(230,126,34,0.1)',
                      border: '1px solid rgba(230,126,34,0.25)',
                      color: '#E67E22',
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => savePlan(plan)}
            disabled={savingPlan === plan.id}
            className="mb-6 w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs touch-target-lg active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
              color: '#0F0E0C',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
            }}
          >
            {savingPlan === plan.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar plano
          </button>

          {/* Preços */}
          <div>
            <h3
              className="text-xs uppercase tracking-wider mb-3"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Preços
            </h3>
            <div className="flex flex-col gap-3">
              {plan.billing_prices
                .slice()
                .sort((a, b) => intervaloOrdem(a.intervalo) - intervaloOrdem(b.intervalo))
                .map(price => (
                  <div
                    key={price.id}
                    className="p-4 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(201,168,76,0.1)',
                    }}
                  >
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider" style={{ color: '#7A7368' }}>
                          Intervalo
                        </label>
                        <div
                          className="px-3 py-2 rounded-lg text-sm mt-1"
                          style={{ ...fieldStyle, color: '#F2EDE4' }}
                        >
                          {price.intervalo}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider" style={{ color: '#7A7368' }}>
                          Preço (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 rounded-lg text-sm mt-1"
                          style={fieldStyle}
                          value={(price.amount_cents / 100).toFixed(2)}
                          onChange={e =>
                            updatePrice(plan.id, price.id, {
                              amount_cents: Math.round(
                                parseFloat(e.target.value || '0') * 100,
                              ),
                            })
                          }
                        />
                        <p className="text-[10px] mt-1" style={{ color: '#7A7368' }}>
                          Atual: {formatBRL(price.amount_cents)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="text-[10px] uppercase tracking-wider" style={{ color: '#7A7368' }}>
                        Stripe Price ID
                      </label>
                      <input
                        className="w-full px-3 py-2 rounded-lg text-sm mt-1 font-mono"
                        style={fieldStyle}
                        placeholder="price_1O..."
                        value={price.stripe_price_id ?? ''}
                        onChange={e =>
                          updatePrice(plan.id, price.id, {
                            stripe_price_id: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <label className="flex items-center gap-2 text-xs cursor-pointer touch-target" style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}>
                        <input
                          type="checkbox"
                          checked={price.ativo}
                          className="w-4 h-4"
                          onChange={e =>
                            updatePrice(plan.id, price.id, { ativo: e.target.checked })
                          }
                        />
                        Ativo
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => deletePrice(price)}
                          disabled={savingPrice === price.id}
                          aria-label="Excluir preço"
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
                          onClick={() => savePrice(price)}
                          disabled={savingPrice === price.id}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs touch-target-lg active:scale-[0.98]"
                          style={{
                            background: 'rgba(201,168,76,0.12)',
                            border: '1px solid rgba(201,168,76,0.3)',
                            color: '#C9A84C',
                            fontFamily: 'Poppins, sans-serif',
                          }}
                        >
                          {savingPrice === price.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <AddPriceForm
              planId={plan.id}
              existingIntervals={plan.billing_prices.map(p => p.intervalo)}
              saving={savingPrice === `new-${plan.id}`}
              onCreate={createPrice}
            />
          </div>
        </section>
      ))}

      <CreatePlanForm onCreate={createPlan} />
    </div>
  )
}

function CreatePlanForm({
  onCreate,
}: {
  onCreate: (draft: { codigo: string; nome: string; descricao: string }) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
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
        Criar novo plano (subproduto)
      </button>
    )
  }

  return (
    <section
      className="mb-8 p-5 rounded-2xl"
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
          Novo plano
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
      <p className="text-[11px] mb-3" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
        Cria um plano vazio. Depois adicione preços nele (mensal/semestral/anual) abaixo.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <input
          className="px-3 py-2 rounded-lg text-sm"
          style={fieldStyle}
          placeholder="codigo (ex: veritas-confessor)"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
        />
        <input
          className="px-3 py-2 rounded-lg text-sm"
          style={fieldStyle}
          placeholder="Nome (ex: Veritas Confessor)"
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
      </div>
      <textarea
        className="w-full px-3 py-2 rounded-lg text-sm mb-2"
        style={fieldStyle}
        placeholder="Descrição curta"
        rows={2}
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await onCreate({ codigo, nome, descricao })
            setCodigo('')
            setNome('')
            setDescricao('')
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
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Criar plano
      </button>
    </section>
  )
}

function AddPriceForm({
  planId,
  existingIntervals,
  saving,
  onCreate,
}: {
  planId: string
  existingIntervals: string[]
  saving: boolean
  onCreate: (
    planId: string,
    draft: { intervalo: Price['intervalo']; amount_cents: number },
  ) => Promise<void>
}) {
  const options: Price['intervalo'][] = ['mensal', 'semestral', 'anual', 'unico']
  const available = options.filter(o => !existingIntervals.includes(o))
  const [intervalo, setIntervalo] = useState<Price['intervalo']>(
    available[0] ?? 'mensal',
  )
  const [valor, setValor] = useState('0.00')

  if (available.length === 0) return null

  return (
    <div
      className="mt-3 p-4 rounded-xl flex flex-col md:flex-row md:items-end gap-2"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px dashed rgba(201,168,76,0.18)',
      }}
    >
      <div className="flex-1">
        <label className="text-[10px] uppercase tracking-wider" style={{ color: '#7A7368' }}>
          Novo intervalo
        </label>
        <select
          className="w-full px-3 py-2 rounded-lg text-sm mt-1"
          style={fieldStyle}
          value={intervalo}
          onChange={e => setIntervalo(e.target.value as Price['intervalo'])}
        >
          {available.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="text-[10px] uppercase tracking-wider" style={{ color: '#7A7368' }}>
          Preço (R$)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="w-full px-3 py-2 rounded-lg text-sm mt-1"
          style={fieldStyle}
          value={valor}
          onChange={e => setValor(e.target.value)}
        />
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          await onCreate(planId, {
            intervalo,
            amount_cents: Math.round(parseFloat(valor || '0') * 100),
          })
          setValor('0.00')
        }}
        className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-xs"
        style={{
          background: 'rgba(201,168,76,0.12)',
          border: '1px solid rgba(201,168,76,0.3)',
          color: '#C9A84C',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
        Adicionar preço
      </button>
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(201,168,76,0.15)',
  color: '#F2EDE4',
  fontFamily: 'Poppins, sans-serif',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

function intervaloOrdem(i: string): number {
  return { mensal: 1, semestral: 2, anual: 3, unico: 4 }[i] ?? 99
}
