'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database, RefreshCw, Play, CheckCircle, AlertTriangle } from 'lucide-react'

interface Coverage {
  table: 'magisterio' | 'patristica' | 'etymo_terms'
  total: number
  missing: number
}

interface BackfillResult {
  table: Coverage['table']
  attempted: number
  succeeded: number
  failed: number
  remaining: number
  errors: Array<{ reference?: string; term?: string; message: string }>
}

interface BackfillResponse {
  summary: { attempted: number; succeeded: number; failed: number; remaining: number }
  results: BackfillResult[]
}

const TABLE_LABELS: Record<Coverage['table'], string> = {
  magisterio: 'Magistério (Credo Niceno, Trento, encíclicas…)',
  patristica: 'Patrística (Agostinho, Orígenes, Ambrósio…)',
  etymo_terms: 'Termos Etimológicos (grego, latim, hebraico)',
}

export default function EmbeddingsAdminPage() {
  const [coverage, setCoverage] = useState<Coverage[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<BackfillResponse | null>(null)

  const loadCoverage = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/embeddings/backfill', {
        method: 'GET',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const json = (await res.json()) as { coverage: Coverage[] }
      setCoverage(json.coverage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cobertura')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCoverage()
  }, [loadCoverage])

  const runBackfill = async (table: 'all' | Coverage['table']) => {
    if (running) return
    setRunning(true)
    setError(null)
    setLastRun(null)
    try {
      const res = await fetch('/api/admin/embeddings/backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, limit: 200 }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const json = (await res.json()) as BackfillResponse
      setLastRun(json)
      // Refresh coverage after backfill
      await loadCoverage()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar backfill')
    } finally {
      setRunning(false)
    }
  }

  const totalMissing = coverage?.reduce((a, c) => a + c.missing, 0) ?? 0
  const hasPending = totalMissing > 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Database className="w-6 h-6" style={{ color: '#C9A84C' }} />
        <h1
          className="text-2xl font-bold tracking-wide"
          style={{ fontFamily: 'Cinzel, serif', color: '#E8DFC7' }}
        >
          Embeddings — Backfill
        </h1>
      </div>

      <p className="mb-6 text-sm" style={{ color: '#9C9488' }}>
        Preenche os vetores (<em>embeddings</em>) faltantes nas tabelas de
        Magistério, Patrística e Termos Etimológicos. Isso é o que permite a
        busca semântica (&quot;por significado&quot;) encontrar conteúdo dessas
        fontes na IA. Sem isso, só o fallback por palavra-chave funciona.
      </p>

      {/* Coverage */}
      <section
        className="mb-6 p-5 rounded-xl"
        style={{
          background: 'rgba(201,168,76,0.04)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-bold uppercase tracking-wider"
            style={{ fontFamily: 'Poppins, sans-serif', color: '#C9A84C' }}
          >
            Cobertura atual
          </h2>
          <button
            onClick={loadCoverage}
            disabled={loading}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
            style={{
              background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.3)',
              color: '#C9A84C',
            }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {coverage === null && loading && (
          <p className="text-sm" style={{ color: '#7A7368' }}>Carregando…</p>
        )}

        {coverage && (
          <div className="space-y-3">
            {coverage.map(c => {
              const pct = c.total > 0 ? Math.round(((c.total - c.missing) / c.total) * 100) : 0
              const isDone = c.missing === 0
              return (
                <div key={c.table}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span style={{ color: '#E8DFC7', fontFamily: 'Poppins, sans-serif' }}>
                      {TABLE_LABELS[c.table]}
                    </span>
                    <span
                      className="font-mono text-xs"
                      style={{ color: isDone ? '#6EE7A1' : '#E8B547' }}
                    >
                      {c.total - c.missing}/{c.total} ({pct}%)
                      {isDone && ' ✓'}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: isDone ? '#6EE7A1' : '#C9A84C',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Action */}
      <section className="mb-6">
        {!hasPending && coverage !== null && (
          <div
            className="p-4 rounded-xl flex items-center gap-3"
            style={{
              background: 'rgba(110,231,161,0.08)',
              border: '1px solid rgba(110,231,161,0.25)',
              color: '#6EE7A1',
            }}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Tudo em dia. Todas as linhas já têm embeddings. A busca semântica
              está 100% ativa nas 5 fontes.
            </p>
          </div>
        )}

        {hasPending && (
          <button
            onClick={() => runBackfill('all')}
            disabled={running}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: running
                ? 'rgba(201,168,76,0.15)'
                : 'linear-gradient(180deg, #C9A84C 0%, #A8852C 100%)',
              color: running ? '#C9A84C' : '#0D0D0D',
              fontFamily: 'Poppins, sans-serif',
              border: '1px solid rgba(201,168,76,0.4)',
            }}
          >
            {running ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Processando… (pode levar 2–3 minutos, não feche a aba)
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Rodar backfill agora ({totalMissing} linhas pendentes)
              </>
            )}
          </button>
        )}

        {hasPending && !running && (
          <p className="mt-3 text-xs text-center" style={{ color: '#7A7368' }}>
            Processa as 3 tabelas em sequência. Idempotente — se der timeout,
            só clicar de novo que continua de onde parou.
          </p>
        )}
      </section>

      {/* Error */}
      {error && (
        <div
          className="mb-6 p-4 rounded-xl flex items-start gap-3"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#FCA5A5',
          }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Erro</p>
            <p className="opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Last run results */}
      {lastRun && (
        <section
          className="p-5 rounded-xl"
          style={{
            background: 'rgba(13,13,13,0.5)',
            border: '1px solid rgba(201,168,76,0.15)',
          }}
        >
          <h3
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ fontFamily: 'Poppins, sans-serif', color: '#C9A84C' }}
          >
            Resultado da última execução
          </h3>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <Stat label="Tentadas" value={lastRun.summary.attempted} color="#E8DFC7" />
            <Stat label="Sucesso" value={lastRun.summary.succeeded} color="#6EE7A1" />
            <Stat label="Falhas" value={lastRun.summary.failed} color="#FCA5A5" />
            <Stat label="Pendente" value={lastRun.summary.remaining} color="#E8B547" />
          </div>

          <div className="space-y-2 text-xs" style={{ color: '#9C9488' }}>
            {lastRun.results.map(r => (
              <div key={r.table} className="flex items-center justify-between">
                <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {TABLE_LABELS[r.table]}
                </span>
                <span className="font-mono">
                  +{r.succeeded} / {r.failed} falhas / {r.remaining} restantes
                </span>
              </div>
            ))}
          </div>

          {lastRun.results.some(r => r.errors.length > 0) && (
            <details className="mt-4">
              <summary className="text-xs cursor-pointer" style={{ color: '#E8B547' }}>
                Ver erros
              </summary>
              <pre
                className="mt-2 p-3 rounded text-xs overflow-x-auto"
                style={{ background: 'rgba(0,0,0,0.4)', color: '#FCA5A5' }}
              >
                {lastRun.results
                  .flatMap(r =>
                    r.errors.map(e => `[${r.table}] ${e.reference || e.term || ''}: ${e.message}`),
                  )
                  .join('\n')}
              </pre>
            </details>
          )}
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="p-3 rounded-lg text-center"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.1)' }}
    >
      <div className="text-2xl font-bold font-mono" style={{ color }}>
        {value}
      </div>
      <div className="text-xs mt-1" style={{ color: '#7A7368' }}>
        {label}
      </div>
    </div>
  )
}
