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

export default function NotificacoesSection() {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [permissao, setPermissao] = useState<NotificationPermission | 'unsupported'>('default')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgTom, setMsgTom] = useState<'ok' | 'erro'>('ok')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPermissao('Notification' in window ? Notification.permission : 'unsupported')
    getCurrentSubscription()
      .then((sub) => setEnabled(!!sub))
      .catch(() => {})
  }, [])

  const iosNaoInstalado = isIos() && !isStandalone()

  function flash(text: string, tom: 'ok' | 'erro' = 'ok') {
    setMsg(text)
    setMsgTom(tom)
    setTimeout(() => setMsg(null), 4000)
  }

  async function toggle() {
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
          Receba lembretes de oração, confissão e missa no seu celular.
        </p>
      </div>

      <div
        className="p-4 rounded-2xl mb-4"
        style={{
          background: 'var(--accent-soft)',
          border: '1px solid var(--border-1)',
        }}
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
          <button
            type="button"
            onClick={toggle}
            disabled={busy || permissao === 'unsupported' || iosNaoInstalado}
            aria-pressed={enabled}
            className="flex-shrink-0 relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 touch-target-lg"
            style={{
              background: enabled ? 'color-mix(in srgb, var(--success) 35%, transparent)' : 'var(--surface-inset)',
              border: `1px solid ${
                enabled ? 'color-mix(in srgb, var(--success) 60%, transparent)' : 'var(--border-1)'
              }`,
            }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{
                left: enabled ? 'calc(100% - 22px)' : '2px',
                background: enabled ? 'var(--success)' : 'var(--text-3)',
              }}
            />
          </button>
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
    </section>
  )
}
