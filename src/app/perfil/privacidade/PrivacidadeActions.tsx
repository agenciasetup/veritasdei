'use client'

import { useEffect, useState } from 'react'
import { Download, Trash2, RotateCcw, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

type AccountStatus = 'active' | 'pending_deletion' | 'pending_parental_consent' | 'suspended' | 'banned' | null
type DeleteState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }
  | { kind: 'ok' }

export function PrivacidadeActions() {
  const { user } = useAuth()
  const supabase = createClient()
  const [status, setStatus] = useState<AccountStatus>(null)
  const [scheduledFor, setScheduledFor] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleteState, setDeleteState] = useState<DeleteState>({ kind: 'idle' })
  const [cancelState, setCancelState] = useState<DeleteState>({ kind: 'idle' })

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('account_status, deletion_scheduled_for')
        .eq('id', user.id)
        .maybeSingle()
      if (!cancelled && data) {
        setStatus(data.account_status as AccountStatus)
        setScheduledFor(data.deletion_scheduled_for ?? null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, supabase])

  const isPendingDeletion = status === 'pending_deletion'

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/lgpd/export', { method: 'GET' })
      if (!res.ok) {
        alert('Falha ao gerar exportação. Tente novamente.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('content-disposition') ?? ''
      const match = disposition.match(/filename="?([^";]+)"?/i)
      a.download = match?.[1] ?? 'veritasdei-export.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (confirmText.trim().toUpperCase() !== 'EXCLUIR') {
      setDeleteState({ kind: 'error', message: 'Digite "EXCLUIR" em maiúsculas para confirmar.' })
      return
    }
    setDeleteState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/lgpd/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: confirmText }),
      })
      const body = await res.json()
      if (!res.ok) {
        setDeleteState({ kind: 'error', message: body?.detail ?? 'Não foi possível solicitar a exclusão.' })
        return
      }
      setStatus('pending_deletion')
      setScheduledFor(body?.scheduledFor ?? null)
      setDeleteState({ kind: 'ok' })
      setDeleteConfirmOpen(false)
      setConfirmText('')
    } catch {
      setDeleteState({ kind: 'error', message: 'Falha de rede. Tente novamente.' })
    }
  }

  async function handleCancel() {
    setCancelState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/lgpd/delete', { method: 'DELETE' })
      if (!res.ok) {
        setCancelState({ kind: 'error', message: 'Não foi possível cancelar a exclusão.' })
        return
      }
      setStatus('active')
      setScheduledFor(null)
      setCancelState({ kind: 'ok' })
    } catch {
      setCancelState({ kind: 'error', message: 'Falha de rede. Tente novamente.' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Exportar dados */}
      <section>
        <h2 className="text-sm font-semibold mb-1" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
          Exportar meus dados
        </h2>
        <p className="text-xs mb-3" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Baixe uma cópia em JSON de tudo o que mantemos sobre você: perfil, posts,
          cartas privadas, intenções, pedidos, consentimentos e histórico de logins.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
          style={{
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.2)',
            color: '#C9A84C',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? 'Gerando...' : 'Baixar meus dados (JSON)'}
        </button>
      </section>

      <div style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }} />

      {/* Excluir conta */}
      <section>
        <h2 className="text-sm font-semibold mb-1" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
          Excluir minha conta
        </h2>

        {isPendingDeletion ? (
          <div
            className="p-4 rounded-xl space-y-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
              <div>
                <p className="text-sm" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                  Sua exclusão está agendada
                  {scheduledFor ? ` para ${formatDate(scheduledFor)}` : ''}.
                </p>
                <p className="text-xs mt-1" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                  Durante o período de 30 dias sua conta fica oculta mas pode ser restaurada. Depois
                  disso, cartas privadas, intenções, pedidos, interações sociais e mídia são removidos,
                  e o perfil público fica anonimizado.
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelState.kind === 'submitting'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
              style={{
                background: 'rgba(201,168,76,0.1)',
                border: '1px solid rgba(201,168,76,0.2)',
                color: '#C9A84C',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {cancelState.kind === 'submitting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Cancelar a exclusão
            </button>
            {cancelState.kind === 'error' && (
              <p className="text-xs" style={{ color: '#ef4444' }}>
                {cancelState.message}
              </p>
            )}
            {cancelState.kind === 'ok' && (
              <p className="text-xs flex items-center gap-1" style={{ color: '#10b981' }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Exclusão cancelada. Bem-vindo de volta.
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs mb-3" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Ao excluir, sua conta fica oculta por 30 dias (período para arrepender-se). Depois
              disso, cartas, intenções, pedidos, interações e mídia são removidos, e o perfil público
              fica anonimizado permanentemente.
            </p>
            {!deleteConfirmOpen ? (
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#ef4444',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <Trash2 className="w-4 h-4" />
                Excluir minha conta
              </button>
            ) : (
              <div
                className="p-4 rounded-xl space-y-3"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <p className="text-xs" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                  Para confirmar, digite <strong>EXCLUIR</strong> em maiúsculas:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                    outline: 'none',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleteState.kind === 'submitting'}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all disabled:opacity-50"
                    style={{
                      background: '#ef4444',
                      color: '#F2EDE4',
                      fontFamily: 'Poppins, sans-serif',
                      border: '1px solid rgba(239,68,68,0.5)',
                    }}
                  >
                    {deleteState.kind === 'submitting' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Confirmar exclusão
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmOpen(false)
                      setConfirmText('')
                      setDeleteState({ kind: 'idle' })
                    }}
                    className="px-4 py-2 rounded-xl text-sm"
                    style={{
                      background: 'transparent',
                      color: '#7A7368',
                      fontFamily: 'Poppins, sans-serif',
                      border: '1px solid rgba(201,168,76,0.15)',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
                {deleteState.kind === 'error' && (
                  <p className="text-xs" style={{ color: '#ef4444' }}>
                    {deleteState.message}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <div style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }} />

      {/* Login events */}
      <LoginEventsBlock />
    </div>
  )
}

function LoginEventsBlock() {
  const { user } = useAuth()
  const supabase = createClient()
  const [events, setEvents] = useState<Array<{
    id: string
    created_at: string
    ip: string | null
    user_agent: string | null
    suspicious: boolean
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('auth_login_events')
        .select('id, created_at, ip, user_agent, suspicious')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (!cancelled) {
        setEvents((data ?? []) as typeof events)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user, supabase])

  return (
    <section>
      <h2 className="text-sm font-semibold mb-1" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
        Últimos logins
      </h2>
      <p className="text-xs mb-3" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
        Revise de onde sua conta foi acessada. Se algo parecer estranho, troque sua senha.
      </p>
      {loading ? (
        <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Carregando...
        </p>
      ) : events.length === 0 ? (
        <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
          Nenhum login registrado ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li
              key={e.id}
              className="p-3 rounded-lg text-xs"
              style={{
                background: 'rgba(201,168,76,0.04)',
                border: '1px solid rgba(201,168,76,0.08)',
                color: '#B8AFA2',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{formatDateTime(e.created_at)}</span>
                {e.suspicious && (
                  <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                    suspeito
                  </span>
                )}
              </div>
              <div className="mt-1" style={{ color: '#7A7368' }}>
                {e.ip ?? 'IP indisponível'} · {shortAgent(e.user_agent)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function shortAgent(ua: string | null): string {
  if (!ua) return 'dispositivo desconhecido'
  if (/iPhone|iPad/i.test(ua)) return 'iOS'
  if (/Android/i.test(ua)) return 'Android'
  if (/Macintosh/i.test(ua)) return 'Mac'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Linux/i.test(ua)) return 'Linux'
  return ua.slice(0, 40)
}
