'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, EyeOff, Check, X, AlertCircle, BadgeCheck } from 'lucide-react'

interface ReportRow {
  report_id: string
  report_reason: string
  report_details: string | null
  report_status: string
  report_created_at: string
  reporter_id: string
  reporter_name: string | null
  reporter_handle: string | null
  post_id: string
  post_kind: string
  post_body: string
  post_created_at: string
  post_deleted_at: string | null
  post_report_count: number
  author_id: string
  author_name: string | null
  author_handle: string | null
  author_verified: boolean
  author_role: string
}

interface ReportsResponse {
  reports: ReportRow[]
  pagination: { next_cursor: string | null }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ModerationPanel() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set())

  const load = useCallback(async (append = false) => {
    if (append && !cursor) return
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (append && cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/comunidade/admin/reports?${params}`, { cache: 'no-store' })
      if (res.status === 403) throw new Error('Acesso restrito a admins/moderadores.')
      if (!res.ok) throw new Error('Falha ao carregar denúncias.')
      const data = (await res.json()) as ReportsResponse
      setCursor(data.pagination.next_cursor)
      setReports(prev => append ? [...prev, ...data.reports] : data.reports)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [cursor])

  useEffect(() => {
    void load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function markLoading(id: string, on: boolean) {
    setActionLoading(prev => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function resolveReport(reportId: string, resolution: 'resolved' | 'dismissed' | 'reviewing') {
    markLoading(reportId, true)
    try {
      const res = await fetch(`/api/comunidade/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      })
      if (!res.ok) throw new Error('Falha na ação')
      if (resolution !== 'reviewing') {
        setReports(prev => prev.filter(r => r.report_id !== reportId))
      } else {
        setReports(prev => prev.map(r => r.report_id === reportId ? { ...r, report_status: 'reviewing' } : r))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      markLoading(reportId, false)
    }
  }

  async function hidePost(reportId: string, postId: string) {
    if (!confirm('Ocultar este Veritas? Isto faz soft-delete e resolve todas as denúncias sobre ele.')) return
    markLoading(reportId, true)
    try {
      const res = await fetch(`/api/comunidade/admin/posts/${postId}/hide`, { method: 'POST' })
      if (!res.ok) throw new Error('Falha ao ocultar')
      // Remove todos os reports sobre esse post (foram marcados como resolved).
      setReports(prev => prev.filter(r => r.post_id !== postId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      markLoading(reportId, false)
    }
  }

  async function verifyAuthor(reportId: string, authorId: string) {
    const reason = prompt('Motivo da verificação (opcional):') ?? null
    markLoading(reportId, true)
    try {
      const res = await fetch(`/api/comunidade/admin/profiles/${authorId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Falha ao verificar')
      setReports(prev => prev.map(r => r.author_id === authorId ? { ...r, author_verified: true } : r))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      markLoading(reportId, false)
    }
  }

  return (
    <main className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link
          href="/comunidade"
          className="inline-flex items-center gap-2 mb-6 text-sm"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Comunidade
        </Link>

        <header className="mb-6">
          <h1
            className="text-2xl md:text-3xl flex items-center gap-3"
            style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
          >
            <AlertCircle className="w-7 h-7" /> Moderação
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Denúncias abertas. Resolva ou descarte conforme política da comunidade.
          </p>
        </header>

        {error && (
          <div
            className="mb-4 rounded-xl p-3 text-sm"
            style={{
              background: 'rgba(107,29,42,0.12)',
              border: '1px solid rgba(217,79,92,0.35)',
              color: '#D94F5C',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {error}
          </div>
        )}

        {loading && (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
          </div>
        )}

        {!loading && reports.length === 0 && !error && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'rgba(16,16,16,0.65)',
              border: '1px solid rgba(201,168,76,0.1)',
            }}
          >
            <p style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}>
              Sem denúncias abertas. ✦
            </p>
          </div>
        )}

        <div className="space-y-4">
          {reports.map(r => {
            const busy = actionLoading.has(r.report_id)
            const authorHref = r.author_handle
              ? `/comunidade/@${r.author_handle}`
              : `/comunidade/p/${r.author_id}`

            return (
              <article
                key={r.report_id}
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(16,16,16,0.78)',
                  border: '1px solid rgba(217,79,92,0.25)',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                <div className="flex items-center gap-3 mb-3 flex-wrap text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <span
                    className="px-2 py-0.5 rounded-full uppercase tracking-[0.08em]"
                    style={{
                      background: r.report_status === 'reviewing' ? 'rgba(201,168,76,0.14)' : 'rgba(217,79,92,0.14)',
                      border: `1px solid ${r.report_status === 'reviewing' ? 'rgba(201,168,76,0.35)' : 'rgba(217,79,92,0.35)'}`,
                      color: r.report_status === 'reviewing' ? '#C9A84C' : '#D94F5C',
                    }}
                  >
                    {r.report_status}
                  </span>
                  <span style={{ color: '#7A7368' }}>
                    {formatDate(r.report_created_at)} · denunciado por{' '}
                    {r.reporter_handle ? `@${r.reporter_handle}` : (r.reporter_name ?? 'anônimo')}
                  </span>
                  {r.post_report_count > 1 && (
                    <span style={{ color: '#D94F5C' }}>
                      {r.post_report_count} denúncias no post
                    </span>
                  )}
                  {r.post_deleted_at && (
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(107,114,128,0.2)', color: '#B6B9C4' }}
                    >
                      Já oculto
                    </span>
                  )}
                </div>

                <div
                  className="rounded-xl p-3 mb-3 text-sm"
                  style={{
                    background: 'rgba(10,10,10,0.6)',
                    border: '1px solid rgba(201,168,76,0.1)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <strong>Motivo:</strong> {r.report_reason}
                  {r.report_details && (
                    <p className="mt-2 text-xs" style={{ color: '#B8B0A2' }}>
                      {r.report_details}
                    </p>
                  )}
                </div>

                <div
                  className="rounded-xl p-3 mb-3"
                  style={{
                    background: 'rgba(10,10,10,0.5)',
                    border: '1px solid rgba(201,168,76,0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <Link
                      href={authorHref}
                      className="hover:underline"
                      style={{ color: '#C9A84C' }}
                    >
                      {r.author_name ?? 'Membro'}{r.author_handle ? ` @${r.author_handle}` : ''}
                    </Link>
                    {r.author_verified && <BadgeCheck className="w-3.5 h-3.5" style={{ color: '#E3C265' }} />}
                    {r.author_role !== 'leigo' && (
                      <span
                        className="px-1.5 py-0.5 rounded uppercase text-[10px]"
                        style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                      >
                        {r.author_role}
                      </span>
                    )}
                    <span style={{ color: '#7A7368' }}>· {formatDate(r.post_created_at)}</span>
                    <Link
                      href={`/comunidade/veritas/${r.post_id}`}
                      className="ml-auto text-xs hover:underline"
                      style={{ color: '#8A8378' }}
                    >
                      Abrir Veritas →
                    </Link>
                  </div>
                  <p
                    className="text-sm whitespace-pre-line line-clamp-4"
                    style={{ color: '#E7DED1', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {r.post_body || '(sem corpo)'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => hidePost(r.report_id, r.post_id)}
                    disabled={busy || !!r.post_deleted_at}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs disabled:opacity-40"
                    style={{
                      background: 'rgba(217,79,92,0.14)',
                      border: '1px solid rgba(217,79,92,0.35)',
                      color: '#D94F5C',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Ocultar Veritas
                  </button>

                  <button
                    type="button"
                    onClick={() => resolveReport(r.report_id, 'resolved')}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs disabled:opacity-40"
                    style={{
                      background: 'rgba(102,187,106,0.14)',
                      border: '1px solid rgba(102,187,106,0.35)',
                      color: '#66BB6A',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <Check className="w-3.5 h-3.5" /> Marcar resolvida
                  </button>

                  <button
                    type="button"
                    onClick={() => resolveReport(r.report_id, 'dismissed')}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs disabled:opacity-40"
                    style={{
                      background: 'rgba(16,16,16,0.6)',
                      border: '1px solid rgba(201,168,76,0.15)',
                      color: '#8A8378',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <X className="w-3.5 h-3.5" /> Descartar
                  </button>

                  {!r.author_verified && (
                    <button
                      type="button"
                      onClick={() => verifyAuthor(r.report_id, r.author_id)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs disabled:opacity-40 ml-auto"
                      style={{
                        background: 'rgba(201,168,76,0.10)',
                        border: '1px solid rgba(201,168,76,0.3)',
                        color: '#C9A84C',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <BadgeCheck className="w-3.5 h-3.5" /> Verificar autor
                    </button>
                  )}
                </div>
              </article>
            )
          })}

          {cursor && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={() => load(true)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
                style={{
                  background: 'rgba(16,16,16,0.65)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  color: '#C9A84C',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Carregar mais
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
