'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, Check, X, Clock, ShieldAlert, Mail, Trash2, Ban, FileText, Activity, ArrowLeft } from 'lucide-react'
import ModerationPanel from '@/components/comunidade/ModerationPanel'

const BRAND = '#C9A84C'
const SURFACE = '#15171c'
const SURFACE_2 = '#1c1f26'
const BORDER = '#2a2e36'
const MUTED = '#9aa0a6'
const TEXT = '#e9eaed'

type TabKey = 'sos' | 'appeals' | 'parental' | 'lgpd' | 'bans' | 'reports' | 'log'

interface Props {
  currentUserId: string
  role: 'admin' | 'moderator'
}

const TABS: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ size?: number }>; adminOnly?: boolean }> = [
  { key: 'sos', label: 'SOS', icon: ShieldAlert },
  { key: 'appeals', label: 'Apelações', icon: FileText },
  { key: 'parental', label: 'Parental', icon: Mail },
  { key: 'lgpd', label: 'Exclusões LGPD', icon: Trash2, adminOnly: true },
  { key: 'bans', label: 'Banimentos', icon: Ban, adminOnly: true },
  { key: 'reports', label: 'Denúncias', icon: AlertCircle },
  { key: 'log', label: 'Moderation log', icon: Activity },
]

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function hoursAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3600_000)
}

export default function AdminModerationShell({ currentUserId, role }: Props) {
  const [tab, setTab] = useState<TabKey>('sos')

  const visibleTabs = TABS.filter((t) => !t.adminOnly || role === 'admin')

  return (
    <div style={{ minHeight: '100vh', background: '#0f1115', color: TEXT, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <header style={{ padding: '20px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/comunidade" style={{ color: MUTED, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 14 }}>
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1 style={{ fontFamily: "Georgia,'Times New Roman',serif", fontSize: 22, color: BRAND, margin: 0, letterSpacing: '.04em' }}>
          Moderação · Admin
        </h1>
        <span style={{ fontSize: 12, color: MUTED, marginLeft: 'auto' }}>
          Você como <strong style={{ color: TEXT }}>{role}</strong>
        </span>
      </header>

      <nav style={{ display: 'flex', gap: 4, padding: '12px 24px', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto' }}>
        {visibleTabs.map((t) => {
          const Icon = t.icon
          const active = t.key === tab
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 8,
                background: active ? BRAND : 'transparent',
                color: active ? '#1a1505' : TEXT,
                border: `1px solid ${active ? BRAND : BORDER}`,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </nav>

      <main style={{ padding: '24px' }}>
        {tab === 'sos' && <SosTab />}
        {tab === 'appeals' && <AppealsTab currentUserId={currentUserId} />}
        {tab === 'parental' && <ParentalTab />}
        {tab === 'lgpd' && <LgpdTab />}
        {tab === 'bans' && <BansTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'log' && <LogTab />}
      </main>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
      {children}
    </div>
  )
}

function Btn({ children, onClick, variant = 'default', disabled }: { children: React.ReactNode; onClick: () => void; variant?: 'default' | 'primary' | 'danger'; disabled?: boolean }) {
  const colors = {
    default: { bg: SURFACE_2, fg: TEXT, border: BORDER },
    primary: { bg: BRAND, fg: '#1a1505', border: BRAND },
    danger: { bg: 'rgba(231,76,60,.15)', fg: '#f5b8b3', border: 'rgba(231,76,60,.4)' },
  }[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  )
}

function useFetch<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let aborted = false
    setLoading(true)
    setError(null)
    fetch(url, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return (await r.json()) as T
      })
      .then((d) => { if (!aborted) setData(d) })
      .catch((e) => { if (!aborted) setError(e instanceof Error ? e.message : String(e)) })
      .finally(() => { if (!aborted) setLoading(false) })
    return () => { aborted = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, reloadKey, ...deps])

  return { data, loading, error, reload }
}

interface SosRow {
  id: string
  reporter_user_id: string | null
  target_user_id: string | null
  target_post_id: string | null
  category: string
  details: string | null
  status: string
  created_at: string
}

function SosTab() {
  const { data, loading, error, reload } = useFetch<{ items: SosRow[] }>('/api/admin/sos')

  async function patch(id: string, status: 'triaged' | 'escalated' | 'closed') {
    const r = await fetch('/api/admin/sos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (!r.ok) alert(`Falha: ${r.status}`)
    reload()
  }

  if (loading) return <Loading />
  if (error) return <ErrBox msg={error} />
  const items = data?.items ?? []
  if (items.length === 0) return <Empty msg="Nenhum SOS aberto." />

  return (
    <div>
      {items.map((r) => {
        const ageH = hoursAgo(r.created_at)
        const overdue = ageH > 24 && r.status === 'open'
        return (
          <Card key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ background: overdue ? 'rgba(231,76,60,.18)' : SURFACE_2, color: overdue ? '#f5b8b3' : MUTED, padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    {r.category}
                  </span>
                  <span style={{ background: SURFACE_2, color: MUTED, padding: '3px 8px', borderRadius: 4, fontSize: 11 }}>
                    {r.status}
                  </span>
                  <span style={{ color: overdue ? '#f5b8b3' : MUTED, fontSize: 11 }}>
                    <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {ageH}h atrás
                  </span>
                </div>
                {r.details && <div style={{ fontSize: 13, color: TEXT, marginBottom: 8, lineHeight: 1.5 }}>{r.details}</div>}
                <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace' }}>
                  reporter: {r.reporter_user_id ?? '—'} · target: {r.target_user_id ?? r.target_post_id ?? '—'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {r.status === 'open' && <Btn onClick={() => patch(r.id, 'triaged')}>Triar</Btn>}
                {r.status !== 'closed' && <Btn variant="danger" onClick={() => patch(r.id, 'escalated')}>Escalar</Btn>}
                {r.status !== 'closed' && <Btn onClick={() => patch(r.id, 'closed')}>Fechar</Btn>}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

interface AppealRow {
  id: string
  user_id: string
  post_id: string | null
  report_id: string | null
  reason: string
  status: string
  created_at: string
}

function AppealsTab({ currentUserId: _ }: { currentUserId: string }) {
  const { data, loading, error, reload } = useFetch<{ items: AppealRow[] }>('/api/admin/appeals')
  const [notes, setNotes] = useState<Record<string, string>>({})

  async function decide(id: string, decision: 'upheld' | 'denied' | 'dismissed') {
    const note = notes[id] ?? ''
    const r = await fetch('/api/admin/appeals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, decision, note }),
    })
    if (r.status === 409) {
      const json = (await r.json().catch(() => ({}))) as { error?: string }
      if (json.error === 'same_moderator_block') {
        if (confirm('Você é o moderador da denúncia original. Forçar decisão mesmo assim?')) {
          await fetch('/api/admin/appeals', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, decision, note, overrideSameModerator: true }),
          })
          reload()
          return
        }
        return
      }
    }
    if (!r.ok) alert(`Falha: ${r.status}`)
    reload()
  }

  if (loading) return <Loading />
  if (error) return <ErrBox msg={error} />
  const items = data?.items ?? []
  if (items.length === 0) return <Empty msg="Nenhuma apelação pendente." />

  return (
    <div>
      {items.map((a) => (
        <Card key={a.id}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: TEXT, lineHeight: 1.5, marginBottom: 8 }}>{a.reason}</div>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', marginBottom: 8 }}>
              user: {a.user_id} · {a.post_id ? `post: ${a.post_id}` : `report: ${a.report_id}`} · {fmt(a.created_at)}
            </div>
            <textarea
              placeholder="Resposta enviada ao usuário (opcional)..."
              value={notes[a.id] ?? ''}
              onChange={(e) => setNotes((s) => ({ ...s, [a.id]: e.target.value }))}
              style={{ width: '100%', background: SURFACE_2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: 8, fontSize: 12, minHeight: 60, fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="primary" onClick={() => decide(a.id, 'upheld')}>Acolher</Btn>
            <Btn variant="danger" onClick={() => decide(a.id, 'denied')}>Negar</Btn>
            <Btn onClick={() => decide(a.id, 'dismissed')}>Arquivar</Btn>
          </div>
        </Card>
      ))}
    </div>
  )
}

interface ParentalRow {
  id: string
  user_id: string
  parent_email: string
  requested_at: string
  expires_at: string
}

function ParentalTab() {
  const { data, loading, error, reload } = useFetch<{ items: ParentalRow[] }>('/api/admin/parental')

  async function action(userId: string, kind: 'resend' | 'cancel' | 'copy_link') {
    const r = await fetch('/api/admin/parental', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: kind, userId }),
    })
    const json = (await r.json().catch(() => ({}))) as { ok?: boolean; consentUrl?: string; emailDelivered?: boolean; error?: string }
    if (!r.ok) {
      alert(`Falha: ${json.error ?? r.status}`)
      return
    }
    if (kind === 'copy_link' && json.consentUrl) {
      try {
        await navigator.clipboard.writeText(json.consentUrl)
        alert('Link copiado para a área de transferência.')
      } catch {
        prompt('Link:', json.consentUrl)
      }
    } else if (kind === 'resend') {
      alert(json.emailDelivered ? 'E-mail reenviado.' : 'Token regenerado, mas e-mail falhou.')
    }
    reload()
  }

  if (loading) return <Loading />
  if (error) return <ErrBox msg={error} />
  const items = data?.items ?? []
  if (items.length === 0) return <Empty msg="Nenhum consentimento pendente." />

  return (
    <div>
      {items.map((p) => (
        <Card key={p.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: TEXT }}>{p.parent_email}</div>
              <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', marginTop: 4 }}>
                user: {p.user_id} · solicitado {fmt(p.requested_at)} · expira {fmt(p.expires_at)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Btn variant="primary" onClick={() => action(p.user_id, 'resend')}>Reenviar</Btn>
              <Btn onClick={() => action(p.user_id, 'copy_link')}>Copiar link</Btn>
              <Btn variant="danger" onClick={() => { if (confirm('Cancelar consentimento?')) action(p.user_id, 'cancel') }}>Cancelar</Btn>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

interface LgpdRow {
  id: string
  display_name: string | null
  deletion_scheduled_for: string | null
  deletion_requested_at: string | null
}

function LgpdTab() {
  const { data, loading, error, reload } = useFetch<{ items: LgpdRow[] }>('/api/admin/lgpd-queue')

  async function action(userId: string, kind: 'execute_now' | 'restore') {
    const confirmMsg = kind === 'execute_now' ? 'Executar exclusão agora? Irreversível.' : 'Restaurar conta?'
    if (!confirm(confirmMsg)) return
    const r = await fetch('/api/admin/lgpd-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: kind }),
    })
    if (!r.ok) alert(`Falha: ${r.status}`)
    reload()
  }

  if (loading) return <Loading />
  if (error) return <ErrBox msg={error} />
  const items = data?.items ?? []
  if (items.length === 0) return <Empty msg="Nenhuma exclusão agendada." />

  return (
    <div>
      {items.map((p) => {
        const daysLeft = p.deletion_scheduled_for
          ? Math.ceil((new Date(p.deletion_scheduled_for).getTime() - Date.now()) / 86400_000)
          : null
        return (
          <Card key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: TEXT }}>{p.display_name ?? '—'}</div>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', marginTop: 4 }}>
                  user: {p.id} · agendado {fmt(p.deletion_scheduled_for)} {daysLeft !== null && `(${daysLeft}d)`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant="danger" onClick={() => action(p.id, 'execute_now')}>Executar agora</Btn>
                <Btn variant="primary" onClick={() => action(p.id, 'restore')}>Restaurar</Btn>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

interface BanRow {
  id: string
  kind: string
  value_hash: string
  reason: string | null
  banned_at: string
  expires_at: string | null
}

function BansTab() {
  const { data, loading, error, reload } = useFetch<{ items: BanRow[] }>('/api/admin/bans')
  const [form, setForm] = useState({ kind: 'email' as 'email' | 'ip', value: '', reason: '', ttlDays: '' })

  async function create() {
    if (!form.value.trim()) return
    const r = await fetch('/api/admin/bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: form.kind,
        value: form.value.trim(),
        reason: form.reason || undefined,
        ttlDays: form.ttlDays ? Number(form.ttlDays) : null,
      }),
    })
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      alert(`Falha: ${j.error ?? r.status}`)
      return
    }
    setForm({ kind: 'email', value: '', reason: '', ttlDays: '' })
    reload()
  }

  async function remove(id: string) {
    if (!confirm('Remover ban?')) return
    const r = await fetch(`/api/admin/bans?id=${id}`, { method: 'DELETE' })
    if (!r.ok) alert(`Falha: ${r.status}`)
    reload()
  }

  return (
    <div>
      <Card>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Banir manualmente</div>
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr 110px auto', gap: 8, alignItems: 'center' }}>
          <select
            value={form.kind}
            onChange={(e) => setForm((s) => ({ ...s, kind: e.target.value as 'email' | 'ip' }))}
            style={{ background: SURFACE_2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
          >
            <option value="email">e-mail</option>
            <option value="ip">IP</option>
          </select>
          <input
            placeholder={form.kind === 'email' ? 'spammer@dominio.com' : '203.0.113.42'}
            value={form.value}
            onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))}
            style={{ background: SURFACE_2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
          />
          <input
            placeholder="motivo (opcional)"
            value={form.reason}
            onChange={(e) => setForm((s) => ({ ...s, reason: e.target.value }))}
            style={{ background: SURFACE_2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
          />
          <input
            type="number"
            placeholder="TTL (dias)"
            value={form.ttlDays}
            onChange={(e) => setForm((s) => ({ ...s, ttlDays: e.target.value }))}
            style={{ background: SURFACE_2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
          />
          <Btn variant="primary" onClick={create}>Banir</Btn>
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>
          Sem TTL = ban perpétuo. O valor é convertido em hash SHA-256 antes de gravar.
        </div>
      </Card>

      {loading && <Loading />}
      {error && <ErrBox msg={error} />}
      {data?.items.map((b) => (
        <Card key={b.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, fontSize: 12 }}>
              <div>
                <span style={{ background: SURFACE_2, padding: '2px 8px', borderRadius: 4, fontSize: 11, marginRight: 8 }}>{b.kind}</span>
                <span style={{ fontFamily: 'monospace', color: MUTED }}>{b.value_hash.slice(0, 16)}…</span>
                {b.expires_at && <span style={{ marginLeft: 8, color: MUTED }}>· expira {fmt(b.expires_at)}</span>}
                {!b.expires_at && <span style={{ marginLeft: 8, color: BRAND, fontWeight: 600 }}>· perpétuo</span>}
              </div>
              {b.reason && <div style={{ color: MUTED, marginTop: 4 }}>{b.reason}</div>}
              <div style={{ color: MUTED, marginTop: 2 }}>banido {fmt(b.banned_at)}</div>
            </div>
            <Btn variant="danger" onClick={() => remove(b.id)}>Remover</Btn>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ReportsTab() {
  return <ModerationPanel />
}

interface LogRow {
  source: 'rejection' | 'media_scan'
  id: string
  created_at: string
  user_id: string | null
  asset_id?: string | null
  reason?: string | null
  provider?: string | null
  score?: number | null
  labels?: string[] | null
}

function LogTab() {
  const [reason, setReason] = useState('')
  const [since, setSince] = useState('')
  const params = new URLSearchParams()
  if (reason) params.set('reason', reason)
  if (since) params.set('since', since)
  const url = `/api/admin/moderation-log?${params.toString()}`
  const { data, loading, error } = useFetch<{ items: LogRow[] }>(url)

  return (
    <div>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input
            placeholder="filtrar reason (ex: nsfw, text_filter)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ background: SURFACE_2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
          />
          <input
            type="datetime-local"
            value={since}
            onChange={(e) => setSince(e.target.value ? new Date(e.target.value).toISOString() : '')}
            style={{ background: SURFACE_2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '6px 8px', fontSize: 12 }}
          />
        </div>
      </Card>

      {loading && <Loading />}
      {error && <ErrBox msg={error} />}
      {(data?.items ?? []).map((row) => (
        <Card key={`${row.source}:${row.id}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={{ background: SURFACE_2, padding: '2px 8px', borderRadius: 4, fontSize: 11, marginRight: 8 }}>{row.source}</span>
              {row.reason && <strong>{row.reason}</strong>}
              {row.provider && <span style={{ color: MUTED }}>{row.provider} · score {row.score?.toFixed(3)}</span>}
              {row.labels && <div style={{ color: MUTED, marginTop: 4 }}>{row.labels.join(', ')}</div>}
              <div style={{ color: MUTED, marginTop: 4, fontFamily: 'monospace', fontSize: 11 }}>
                {row.user_id ? `user: ${row.user_id}` : row.asset_id ? `asset: ${row.asset_id}` : ''}
              </div>
            </div>
            <div style={{ color: MUTED, fontSize: 11, whiteSpace: 'nowrap' }}>{fmt(row.created_at)}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}

function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: MUTED, padding: 24, justifyContent: 'center' }}>
      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
      Carregando…
    </div>
  )
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <Card>
      <div style={{ display: 'flex', gap: 8, color: '#f5b8b3' }}>
        <X size={16} /> Erro: {msg}
      </div>
    </Card>
  )
}

function Empty({ msg }: { msg: string }) {
  return (
    <Card>
      <div style={{ display: 'flex', gap: 8, color: MUTED }}>
        <Check size={16} /> {msg}
      </div>
    </Card>
  )
}
