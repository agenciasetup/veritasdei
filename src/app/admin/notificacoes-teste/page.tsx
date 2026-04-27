'use client'

/**
 * /admin/notificacoes-teste — ferramenta de admin pra disparar push
 * notification de teste (Web Push + FCM em paralelo).
 *
 * Default: envia pro próprio admin (handy pra QA do device).
 * Opcional: envia pra um user específico (passa UUID).
 *
 * Resposta da API mostra contadores por canal: enviadas, falhadas,
 * limpas (tokens expirados), skippadas (sem push registrado).
 */

import { useState } from 'react'
import { Bell, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface SendResult {
  sent: number
  failed: number
  cleaned: number
  skipped: number
}

interface ApiResponse {
  ok: boolean
  target?: string
  result?: SendResult
  error?: string
}

export default function AdminPushTestPage() {
  const { user } = useAuth()
  const [targetUserId, setTargetUserId] = useState('')
  const [title, setTitle] = useState('Teste de notificação')
  const [body, setBody] = useState('Push do app Veritas Dei chegando!')
  const [url, setUrl] = useState('/')
  const [busy, setBusy] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    setBusy(true)
    setResponse(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/push-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetUserId.trim() || undefined,
          title,
          body,
          url,
        }),
      })
      const data = (await res.json()) as ApiResponse
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`)
      } else {
        setResponse(data)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.25)',
          }}
        >
          <Bell className="w-5 h-5" style={{ color: '#C9A84C' }} />
        </div>
        <div>
          <h1
            className="text-xl"
            style={{ fontFamily: 'Cinzel, serif', color: '#E8E4D9' }}
          >
            Teste de notificação
          </h1>
          <p
            className="text-xs"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Dispara push pro próprio admin (default) ou pra qualquer user.
          </p>
        </div>
      </header>

      <section
        className="p-5 rounded-2xl mb-4"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Destinatário (UUID)
            </span>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder={user?.id ?? 'usuário atual (deixe vazio)'}
              className="px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E8E4D9',
                fontFamily: 'monospace',
              }}
            />
            <span className="text-[10px]" style={{ color: '#8A8378' }}>
              Vazio = manda pra você ({user?.email ?? 'admin'}).
            </span>
          </label>

          <label className="grid gap-1">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Título
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E8E4D9',
                fontFamily: 'Poppins, sans-serif',
              }}
            />
          </label>

          <label className="grid gap-1">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Corpo
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={180}
              rows={3}
              className="px-3 py-2.5 rounded-lg text-sm resize-none"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E8E4D9',
                fontFamily: 'Poppins, sans-serif',
              }}
            />
          </label>

          <label className="grid gap-1">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              URL ao tocar
            </span>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/perfil"
              className="px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E8E4D9',
                fontFamily: 'monospace',
              }}
            />
            <span className="text-[10px]" style={{ color: '#8A8378' }}>
              Tem que começar com / (rota interna).
            </span>
          </label>

          <button
            type="button"
            onClick={handleSend}
            disabled={busy || !title.trim() || !body.trim()}
            className="mt-2 px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{
              background: '#C9A84C',
              color: '#0A0A0A',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
            }}
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" /> Enviar notificação
              </>
            )}
          </button>
        </div>
      </section>

      {error && (
        <div
          className="p-4 rounded-xl flex items-start gap-2 mb-4"
          style={{
            background: 'rgba(230,126,34,0.10)',
            border: '1px solid rgba(230,126,34,0.30)',
            color: '#E67E22',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="text-xs">{error}</div>
        </div>
      )}

      {response?.ok && response.result && (
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.30)',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: '#22C55E' }} />
            <span className="text-sm" style={{ color: '#22C55E' }}>
              Disparada para{' '}
              <code className="text-xs">{response.target?.slice(0, 8)}…</code>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Enviadas', value: response.result.sent },
              { label: 'Falhadas', value: response.result.failed },
              { label: 'Limpas', value: response.result.cleaned },
              { label: 'Skipped', value: response.result.skipped },
            ].map((m) => (
              <div
                key={m.label}
                className="p-2 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.4)' }}
              >
                <div className="text-lg font-medium" style={{ color: '#E8E4D9' }}>
                  {m.value}
                </div>
                <div className="text-[10px]" style={{ color: '#8A8378' }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: '#8A8378' }}>
            "Skipped" = usuário sem push registrado, ou opt-out da categoria
            test (essa categoria não filtra, mas se push_enabled=false aparece
            aqui).
          </p>
        </div>
      )}
    </div>
  )
}
