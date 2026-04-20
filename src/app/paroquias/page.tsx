'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Paroquia } from '@/types/paroquia'
import SeloVerificado from '@/components/paroquias/SeloVerificado'
import {
  Church,
  MapPin,
  Clock,
  Phone,
  Plus,
  Navigation,
  CheckCircle,
  XCircle,
  Hourglass,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react'

const PAGE_SIZE = 18

export default function ParoquiasPage() {
  const { user, profile, isAuthenticated } = useAuth()
  const supabase = createClient()
  const [paroquias, setParoquias] = useState<Paroquia[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (!supabase) return
    async function load() {
      setLoading(true)
      const { data, count } = await supabase!
        .from('paroquias')
        .select(
          'id, nome, diocese, cidade, estado, padre_responsavel, telefone, horarios_missa, foto_url, status, verificado, criado_por, owner_user_id',
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      setParoquias((data as Paroquia[]) ?? [])
      setTotal(count ?? 0)
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleApprove = async (id: string) => {
    if (!supabase || !profile) return
    await supabase.from('paroquias').update({ status: 'aprovada', aprovado_por: profile.id }).eq('id', id)
    setParoquias(prev => prev.map(p => p.id === id ? { ...p, status: 'aprovada' } : p))
  }

  const handleReject = async (id: string) => {
    if (!supabase) return
    await supabase.from('paroquias').update({ status: 'rejeitada' }).eq('id', id)
    setParoquias(prev => prev.map(p => p.id === id ? { ...p, status: 'rejeitada' } : p))
  }

  const filtered = paroquias.filter(p => {
    const q = search.toLowerCase()
    return !q || p.nome.toLowerCase().includes(q) || p.cidade.toLowerCase().includes(q) || (p.diocese?.toLowerCase().includes(q) ?? false)
  })

  const statusIcon = (s: string) => {
    if (s === 'aprovada') return <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
    if (s === 'rejeitada') return <XCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} />
    return <Hourglass className="w-4 h-4" style={{ color: 'var(--accent)' }} />
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-[0.08em] uppercase"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
            >
              Igrejas
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Catálogo completo. Para encontrar igrejas perto, use a busca.
            </p>
          </div>

          <Link
            href="/paroquias/sugerir"
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold tracking-[0.08em] uppercase active:scale-[0.98] transition-transform"
            style={{
              fontFamily: 'var(--font-body)',
              background: isAuthenticated ? 'var(--accent-soft)' : 'var(--accent)',
              border: isAuthenticated ? '1px solid var(--accent-soft)' : 'none',
              color: isAuthenticated ? 'var(--accent)' : 'var(--accent-contrast)',
            }}
          >
            <Plus className="w-4 h-4" />
            Sugerir Igreja
          </Link>
        </div>

        <div
          className="rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border-1)',
          }}
        >
          <Link
            href="/paroquias/buscar?mode=nearby"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs active:scale-[0.97] transition-transform"
            style={{
              color: 'var(--accent-contrast)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              background: 'var(--accent)',
            }}
          >
            <Navigation className="w-3.5 h-3.5" />
            Igrejas perto de mim
          </Link>
          <Link
            href="/paroquias/buscar?mode=city"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs"
            style={{
              color: 'var(--accent)',
              fontFamily: 'var(--font-body)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-soft)',
            }}
          >
            <MapPin className="w-3.5 h-3.5" />
            Buscar por cidade
          </Link>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, cidade ou diocese..."
            className="w-full max-w-xl px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--surface-inset)',
              border: '1px solid var(--border-1)',
              color: 'var(--text-1)',
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-1)',
                }}
              >
                <div className="skeleton h-6 w-3/4 mb-4" />
                <div className="skeleton h-4 w-1/2 mb-2" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Church className="w-12 h-12 mx-auto mb-4 opacity-40" style={{ color: 'var(--text-3)' }} />
            <p
              className="text-lg tracking-[0.06em] uppercase"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-2)' }}
            >
              Nenhuma paróquia encontrada
            </p>
            <Link
              href="/paroquias/sugerir"
              className="inline-flex items-center gap-2 mt-4 text-sm underline"
              style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
            >
              Sugerir a primeira igreja
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => {
              const isOwner =
                !!user?.id && (user.id === p.owner_user_id || user.id === p.criado_por)
              return (
                <div
                  key={p.id}
                  className="rounded-2xl p-6 transition-colors relative"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-1)',
                  }}
                >
                  <Link href={`/paroquias/${p.id}`} className="block">
                    {/* Photo */}
                    {p.foto_url && (
                      <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.foto_url} alt={p.nome} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <h3
                        className="text-base font-bold tracking-[0.04em] uppercase"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-1)' }}
                      >
                        {p.nome}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {p.verificado && <SeloVerificado size="sm" showLabel={false} />}
                        {statusIcon(p.status)}
                      </div>
                    </div>

                    {/* Info */}
                    <div
                      className="space-y-2 text-sm"
                      style={{ color: 'var(--text-2)', fontFamily: 'var(--font-body)' }}
                    >
                      {p.diocese && (
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>{p.diocese}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                        <span>{p.cidade}, {p.estado}</span>
                      </div>
                      {p.padre_responsavel && (
                        <div className="flex items-center gap-2">
                          <Church className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                          <span>Pe. {p.padre_responsavel}</span>
                        </div>
                      )}
                      {p.telefone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                          <span>{p.telefone}</span>
                        </div>
                      )}
                      {p.horarios_missa && p.horarios_missa.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                          <div className="flex flex-wrap gap-1">
                            {p.horarios_missa.slice(0, 3).map((h, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  background: 'var(--accent-soft)',
                                  border: '1px solid var(--accent-soft)',
                                  color: 'var(--accent)',
                                }}
                              >
                                {h.dia} {h.horario}
                              </span>
                            ))}
                            {p.horarios_missa.length > 3 && (
                              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                                +{p.horarios_missa.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Owner / Admin actions */}
                  {(isOwner || (isAdmin && p.status === 'pendente')) && (
                    <div
                      className="flex items-center gap-2 mt-4 pt-4"
                      style={{ borderTop: '1px solid var(--border-2)' }}
                    >
                      {isOwner && (
                        <Link
                          href={`/paroquias/${p.id}/editar`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            background: 'var(--accent-soft)',
                            border: '1px solid var(--accent-soft)',
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </Link>
                      )}
                      {isAdmin && p.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => handleApprove(p.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              background: 'color-mix(in srgb, var(--success) 14%, transparent)',
                              border: '1px solid color-mix(in srgb, var(--success) 28%, transparent)',
                              color: 'var(--success)',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
                            style={{
                              background: 'color-mix(in srgb, var(--danger) 14%, transparent)',
                              border: '1px solid color-mix(in srgb, var(--danger) 28%, transparent)',
                              color: 'var(--danger)',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <p
              className="text-xs"
              style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
            >
              Página {page + 1} de {totalPages} ({total} paróquias)
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 rounded-lg transition-opacity disabled:opacity-30"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 rounded-lg transition-opacity disabled:opacity-30"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
