'use client'

import { useEffect, useState } from 'react'
import {
  subscribePush,
  unsubscribePush,
  getCurrentSubscription,
  sendTestPush,
  isIos,
  isStandalone,
} from '@/lib/pwa/push'

interface Prefs {
  pref_liturgia: boolean
  pref_liturgia_hora: number
  pref_angelus: boolean
  pref_novenas: boolean
  pref_exame: boolean
  pref_exame_hora: number
  pref_comunidade: boolean
}

const DEFAULT_PREFS: Prefs = {
  pref_liturgia: true,
  pref_liturgia_hora: 7,
  pref_angelus: true,
  pref_novenas: true,
  pref_exame: true,
  pref_exame_hora: 21,
  pref_comunidade: true,
}

export default function NotificacoesSection() {
  const [enabled, setEnabled] = useState(false)
  const [permissao, setPermissao] = useState<NotificationPermission | 'unsupported'>('default')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgTom, setMsgTom] = useState<'ok' | 'erro'>('ok')
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPermissao('Notification' in window ? Notification.permission : 'unsupported')
    getCurrentSubscription()
      .then((sub) => setEnabled(!!sub))
      .catch(() => {})
    fetch('/api/push/prefs')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPrefs({ ...DEFAULT_PREFS, ...data })
      })
      .catch(() => {})
  }, [])

  const iosNaoInstalado = isIos() && !isStandalone()

  function flash(text: string, tom: 'ok' | 'erro' = 'ok') {
    setMsg(text)
    setMsgTom(tom)
    setTimeout(() => setMsg(null), 4000)
  }

  async function toggleMaster() {
    setBusy(true)
    try {
      if (enabled) {
        await unsubscribePush()
        setEnabled(false)
        flash('Notificações desativadas')
      } else {
        await subscribePush()
        setEnabled(true)
        setPermissao(Notification.permission)
        flash('Pronto! Você receberá lembretes 🙏')
      }
    } catch (err) {
      const code = (err as Error).message
      if (code === 'ios_needs_install') {
        flash('Instale o app primeiro (Compartilhar → Tela de Início)', 'erro')
      } else if (code === 'permission_denied') {
        flash('Permissão negada. Habilite nas configurações do navegador.', 'erro')
        setPermissao('denied')
      } else if (code === 'push_unsupported') {
        flash('Seu navegador não suporta notificações', 'erro')
        setPermissao('unsupported')
      } else {
        flash('Não foi possível ativar agora', 'erro')
      }
    } finally {
      setBusy(false)
    }
  }

  async function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    const prev = prefs[key]
    setPrefs((p) => ({ ...p, [key]: value }))
    try {
      const res = await fetch('/api/push/prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      })
      if (!res.ok) throw new Error('patch_failed')
    } catch {
      setPrefs((p) => ({ ...p, [key]: prev }))
      flash('Não foi possível salvar', 'erro')
    }
  }

  async function enviarTeste() {
    setBusy(true)
    try {
      const ok = await sendTestPush()
      if (ok) flash('Enviado! Confira sua tela.')
      else flash('Falha ao enviar teste', 'erro')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2
          className="text-lg mb-1"
          style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-1)' }}
        >
          Notificações
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
          Receba lembretes de oração, liturgia e comunidade no seu celular.
        </p>
      </div>

      {/* Toggle mestre */}
      <div
        className="p-4 rounded-2xl mb-4"
        style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-1)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p
              className="text-base font-medium"
              style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
            >
              Lembretes no celular
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
              Estado:{' '}
              <strong style={{ color: enabled ? 'var(--success)' : 'var(--accent)' }}>
                {permissao === 'unsupported'
                  ? 'não suportado'
                  : enabled
                    ? 'ativo'
                    : permissao === 'denied'
                      ? 'bloqueado no navegador'
                      : 'desativado'}
              </strong>
            </p>
          </div>
          <Toggle
            checked={enabled}
            disabled={busy || permissao === 'unsupported' || iosNaoInstalado}
            onChange={toggleMaster}
          />
        </div>

        {msg && (
          <p
            className="text-[11px] mt-2"
            style={{
              color: msgTom === 'ok' ? '#66BB6A' : '#D94F5C',
              fontFamily: 'var(--font-body)',
            }}
          >
            {msg}
          </p>
        )}

        {enabled && (
          <button
            type="button"
            onClick={enviarTeste}
            disabled={busy}
            className="mt-3 w-full py-2.5 rounded-xl text-sm disabled:opacity-50 touch-target-lg active:scale-[0.98]"
            style={{
              background: 'var(--surface-inset)',
              border: '1px solid var(--border-1)',
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
            }}
          >
            Enviar notificação de teste
          </button>
        )}

        {iosNaoInstalado && (
          <p
            className="text-[11px] mt-3 leading-relaxed"
            style={{ color: '#E67E22', fontFamily: 'var(--font-body)' }}
          >
            No iPhone, notificações só funcionam após instalar o app: toque em{' '}
            <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>.
          </p>
        )}
      </div>

      {/* Granularidade por categoria — aparece quando mestre está on */}
      {enabled && (
        <div
          className="p-4 rounded-2xl"
          style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-1)' }}
        >
          <p
            className="text-sm font-medium mb-3"
            style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
          >
            O que você quer receber
          </p>

          <PrefRow
            label="Liturgia do dia"
            hint="Leituras e evangelho para meditar pela manhã"
            checked={prefs.pref_liturgia}
            onChange={(v) => updatePref('pref_liturgia', v)}
            extra={
              prefs.pref_liturgia && (
                <HoraSelect
                  value={prefs.pref_liturgia_hora}
                  options={[5, 6, 7, 8, 9]}
                  onChange={(h) => updatePref('pref_liturgia_hora', h)}
                />
              )
            }
          />

          <PrefRow
            label="Ângelus (meio-dia)"
            hint="Oração mariana do meio-dia, todos os dias às 12h"
            checked={prefs.pref_angelus}
            onChange={(v) => updatePref('pref_angelus', v)}
          />

          <PrefRow
            label="Novena diária"
            hint="Só chega se você tem uma novena ativa em andamento"
            checked={prefs.pref_novenas}
            onChange={(v) => updatePref('pref_novenas', v)}
          />

          <PrefRow
            label="Exame de consciência"
            hint="Convite para rever o dia antes de dormir"
            checked={prefs.pref_exame}
            onChange={(v) => updatePref('pref_exame', v)}
            extra={
              prefs.pref_exame && (
                <HoraSelect
                  value={prefs.pref_exame_hora}
                  options={[20, 21, 22, 23]}
                  onChange={(h) => updatePref('pref_exame_hora', h)}
                />
              )
            }
          />

          <PrefRow
            label="Comunidade"
            hint="Quando alguém responde seu pedido ou carta"
            checked={prefs.pref_comunidade}
            onChange={(v) => updatePref('pref_comunidade', v)}
            last
          />
        </div>
      )}
    </section>
  )
}

// ─── Subcomponentes ──────────────────────────────────────────────────

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      className="flex-shrink-0 relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 touch-target-lg"
      style={{
        background: checked
          ? 'color-mix(in srgb, var(--success) 35%, transparent)'
          : 'var(--surface-inset)',
        border: `1px solid ${
          checked ? 'color-mix(in srgb, var(--success) 60%, transparent)' : 'var(--border-1)'
        }`,
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
        style={{
          left: checked ? 'calc(100% - 22px)' : '2px',
          background: checked ? 'var(--success)' : 'var(--text-3)',
        }}
      />
    </button>
  )
}

function PrefRow({
  label,
  hint,
  checked,
  onChange,
  extra,
  last,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
  extra?: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className="flex items-start justify-between gap-3 py-3"
      style={{
        borderBottom: last ? 'none' : '1px solid var(--border-1)',
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-sm"
          style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}
        >
          {label}
        </p>
        <p
          className="text-[11px] mt-0.5 leading-relaxed"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          {hint}
        </p>
        {extra && <div className="mt-2">{extra}</div>}
      </div>
      <Toggle checked={checked} onChange={() => onChange(!checked)} />
    </div>
  )
}

function HoraSelect({
  value,
  options,
  onChange,
}: {
  value: number
  options: number[]
  onChange: (h: number) => void
}) {
  return (
    <label
      className="inline-flex items-center gap-2 text-[11px]"
      style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
    >
      Horário:
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-2 py-1 rounded-lg text-xs"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-1)',
          color: 'var(--text-1)',
          fontFamily: 'var(--font-body)',
        }}
      >
        {options.map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, '0')}:00
          </option>
        ))}
      </select>
    </label>
  )
}
