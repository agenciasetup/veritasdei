'use client'

/**
 * Admin → Checkout.
 *
 * Personaliza a página /checkout/[sessionId]: logo, paleta, copy do
 * header/footer, métodos habilitados (PIX / Boleto / Cartão) e
 * parcelamento máximo.
 *
 * As cores entram como CSS vars na renderização do checkout — não
 * afetam os design tokens globais do app.
 */

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  CreditCard,
  Loader2,
  Palette,
  QrCode,
  Save,
  Sparkles,
  Type,
} from 'lucide-react'

type Settings = {
  logo_url: string | null
  primary_color: string
  accent_color: string
  background_color: string
  text_color: string
  header_title: string
  header_subtitle: string
  footer_text: string
  allow_pix: boolean
  allow_boleto: boolean
  allow_credit_card: boolean
  installments_max: number
}

const DEFAULT: Settings = {
  logo_url: null,
  primary_color: '#C9A84C',
  accent_color: '#0F0E0C',
  background_color: '#0F0E0C',
  text_color: '#F2EDE4',
  header_title: 'Finalize sua assinatura',
  header_subtitle: 'Pagamento seguro processado pela Asaas.',
  footer_text: 'Você pode cancelar quando quiser pelo seu perfil.',
  allow_pix: true,
  allow_boleto: false,
  allow_credit_card: true,
  installments_max: 12,
}

export default function AdminCheckoutPage() {
  const [s, setS] = useState<Settings>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; tom: 'ok' | 'erro' } | null>(
    null,
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch('/api/admin/checkout-settings')
        const data = await res.json()
        if (!alive) return
        if (data.settings) setS({ ...DEFAULT, ...data.settings })
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  function flash(text: string, tom: 'ok' | 'erro' = 'ok') {
    setMsg({ text, tom })
    setTimeout(() => setMsg(null), 3500)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/checkout-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Falha ao salvar')
      flash('Configuração salva')
    } catch (err) {
      flash((err as Error).message, 'erro')
    } finally {
      setSaving(false)
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
    <div className="max-w-5xl mx-auto pb-32 md:pb-12">
      <header className="mb-8">
        <h1
          className="text-2xl mb-1"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: '#F2EDE4' }}
        >
          Personalização do checkout
        </h1>
        <p
          className="text-xs"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          Logo, paleta, copy e métodos de pagamento. As cores aplicam só na
          página <code className="text-[10px]" style={{ color: '#C9A84C' }}>/checkout</code>.
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-5">
          <SectionCard icon={Sparkles} title="Identidade visual">
            <Field label="URL do logo (PNG/SVG)">
              <input
                placeholder="https://..."
                value={s.logo_url ?? ''}
                onChange={e => setS(p => ({ ...p, logo_url: e.target.value || null }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <ColorField
                label="Cor primária"
                value={s.primary_color}
                onChange={v => setS(p => ({ ...p, primary_color: v }))}
              />
              <ColorField
                label="Cor de contraste"
                value={s.accent_color}
                onChange={v => setS(p => ({ ...p, accent_color: v }))}
              />
              <ColorField
                label="Fundo"
                value={s.background_color}
                onChange={v => setS(p => ({ ...p, background_color: v }))}
              />
              <ColorField
                label="Texto"
                value={s.text_color}
                onChange={v => setS(p => ({ ...p, text_color: v }))}
              />
            </div>
          </SectionCard>

          <SectionCard icon={Type} title="Textos">
            <Field label="Título do header">
              <input
                value={s.header_title}
                onChange={e => setS(p => ({ ...p, header_title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
              />
            </Field>
            <Field label="Subtítulo do header">
              <input
                value={s.header_subtitle}
                onChange={e =>
                  setS(p => ({ ...p, header_subtitle: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
              />
            </Field>
            <Field label="Rodapé">
              <textarea
                rows={2}
                value={s.footer_text}
                onChange={e => setS(p => ({ ...p, footer_text: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
              />
            </Field>
          </SectionCard>

          <SectionCard icon={CreditCard} title="Métodos de pagamento">
            <Toggle
              icon={QrCode}
              label="PIX"
              hint="QR code + copia-cola. Confirmação em segundos."
              checked={s.allow_pix}
              onChange={v => setS(p => ({ ...p, allow_pix: v }))}
            />
            <Toggle
              icon={CreditCard}
              label="Cartão de crédito"
              hint="Recorrente. Parcela conforme limite abaixo."
              checked={s.allow_credit_card}
              onChange={v => setS(p => ({ ...p, allow_credit_card: v }))}
            />
            <Toggle
              icon={QrCode}
              label="Boleto"
              hint="Confirmação D+1 a D+2. Desabilitado por padrão."
              checked={s.allow_boleto}
              onChange={v => setS(p => ({ ...p, allow_boleto: v }))}
            />
            <Field label={`Parcelamento máximo (1 a 12) — atual: ${s.installments_max}x`}>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={s.installments_max}
                onChange={e =>
                  setS(p => ({ ...p, installments_max: Number(e.target.value) }))
                }
                className="w-full"
              />
            </Field>
          </SectionCard>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="hidden md:inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs touch-target-lg active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
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
            Salvar configuração
          </button>
        </div>

        {/* Preview */}
        <CheckoutPreview s={s} />
      </div>

      {/* Sticky save no mobile */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40"
        style={{
          background:
            'linear-gradient(to top, rgba(13,13,13,1) 60%, rgba(13,13,13,0))',
        }}
      >
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl text-sm"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #A88B3A)',
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
    </div>
  )
}

// ---------- Sub-componentes ----------

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Palette
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      className="p-5 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(201,168,76,0.15)',
      }}
    >
      <h3
        className="text-xs uppercase tracking-wider mb-4 flex items-center gap-2"
        style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
      >
        <Icon className="w-3.5 h-3.5" />
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer"
          style={{ background: 'transparent', border: '1px solid rgba(201,168,76,0.2)' }}
        />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="flex-1 px-3 py-2 rounded-lg text-sm font-mono"
          style={fieldStyle}
        />
      </div>
    </Field>
  )
}

function Toggle({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: typeof CreditCard
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer"
      style={{
        background: checked ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
        border: checked
          ? '1px solid rgba(201,168,76,0.3)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-1"
      />
      <div className="flex-1">
        <div
          className="flex items-center gap-2 text-sm"
          style={{
            color: '#F2EDE4',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
          }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
          {label}
        </div>
        <div
          className="text-[11px] mt-0.5"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          {hint}
        </div>
      </div>
    </label>
  )
}

function CheckoutPreview({ s }: { s: Settings }) {
  const cssVars: React.CSSProperties = useMemo(
    () => ({
      ['--p-primary' as string]: s.primary_color,
      ['--p-accent' as string]: s.accent_color,
      ['--p-bg' as string]: s.background_color,
      ['--p-text' as string]: s.text_color,
      background: s.background_color,
      color: s.text_color,
    }),
    [s.primary_color, s.accent_color, s.background_color, s.text_color],
  )

  return (
    <div className="md:sticky md:top-24">
      <div
        className="text-[10px] uppercase tracking-wider mb-2"
        style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
      >
        Preview
      </div>
      <div
        className="rounded-3xl overflow-hidden"
        style={{ border: '1px solid rgba(201,168,76,0.18)' }}
      >
        <div style={cssVars} className="p-6">
          <div className="text-center mb-5">
            {s.logo_url ? (
              <Image
                src={s.logo_url}
                alt="logo"
                width={48}
                height={48}
                className="h-12 w-auto mx-auto mb-3 object-contain"
                unoptimized
              />
            ) : (
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
                style={{
                  background:
                    'color-mix(in srgb, var(--p-primary) 18%, transparent)',
                  border:
                    '1px solid color-mix(in srgb, var(--p-primary) 35%, transparent)',
                }}
              >
                <Sparkles
                  className="w-5 h-5"
                  style={{ color: 'var(--p-primary)' }}
                />
              </div>
            )}
            <div
              className="text-lg mb-1"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                color: 'var(--p-text)',
              }}
            >
              {s.header_title || 'Finalize sua assinatura'}
            </div>
            <div
              className="text-[11px]"
              style={{
                color: 'color-mix(in srgb, var(--p-text) 70%, transparent)',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {s.header_subtitle || 'Pagamento seguro processado pela Asaas.'}
            </div>
          </div>

          <div
            className="rounded-2xl p-3 mb-4 text-xs flex items-center justify-between"
            style={{
              background: 'color-mix(in srgb, var(--p-text) 5%, transparent)',
              border: '1px solid color-mix(in srgb, var(--p-text) 12%, transparent)',
            }}
          >
            <span style={{ color: 'var(--p-text)', fontFamily: 'Poppins, sans-serif' }}>
              Premium · Mensal
            </span>
            <span style={{ color: 'var(--p-primary)', fontWeight: 700 }}>
              R$ 19,90
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {s.allow_pix && (
              <div
                className="rounded-xl py-2 text-[11px] text-center"
                style={{
                  background: 'var(--p-primary)',
                  color: 'var(--p-accent)',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                }}
              >
                PIX
              </div>
            )}
            {s.allow_credit_card && (
              <div
                className="rounded-xl py-2 text-[11px] text-center"
                style={{
                  background: 'transparent',
                  color: 'var(--p-text)',
                  border:
                    '1px solid color-mix(in srgb, var(--p-text) 15%, transparent)',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Cartão
              </div>
            )}
          </div>

          <button
            type="button"
            disabled
            className="w-full py-3 rounded-2xl text-xs"
            style={{
              background: 'var(--p-primary)',
              color: 'var(--p-accent)',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
            }}
          >
            Gerar PIX agora
          </button>

          <div
            className="text-[10px] text-center mt-3"
            style={{
              color: 'color-mix(in srgb, var(--p-text) 55%, transparent)',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {s.footer_text || 'Você pode cancelar quando quiser pelo seu perfil.'}
          </div>
        </div>
      </div>
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(201,168,76,0.15)',
  color: '#F2EDE4',
  fontFamily: 'Poppins, sans-serif',
}
