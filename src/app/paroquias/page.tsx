'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import AuthGuard from '@/components/auth/AuthGuard'
import Link from 'next/link'
import type { Paroquia } from '@/types/paroquia'
import { Church, MapPin, Clock, Phone, Plus, CheckCircle, XCircle, Hourglass, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 18

export default function ParoquiasPage() {
  return (
    <AuthGuard>
      <ParoquiasContent />
    </AuthGuard>
  )
}

function ParoquiasContent() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [paroquias, setParoquias] = useState<Paroquia[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const canCreate = profile?.role === 'admin' || profile?.vocacao === 'padre' || profile?.vocacao === 'diacono'
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (!supabase) return
    async function load() {
      setLoading(true)
      const { data, count } = await supabase!
        .from('paroquias')
        .select('id, nome, diocese, cidade, estado, padre_responsavel, telefone, horarios_missa, foto_url, status, criado_por', { count: 'exact' })
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
    if (s === 'aprovada') return <CheckCircle className="w-4 h-4" style={{ color: '#4CAF50' }} />
    if (s === 'rejeitada') return <XCircle className="w-4 h-4" style={{ color: '#D94F5C' }} />
    return <Hourglass className="w-4 h-4" style={{ color: '#C9A84C' }} />
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Paróquias
            </h1>
            <p className="text-sm mt-1" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Encontre e cadastre paróquias católicas
            </p>
          </div>

          {canCreate && (
            <Link
              href="/paroquias/cadastrar"
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all hover:scale-[1.02]"
              style={{
                fontFamily: 'Cinzel, serif',
                background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
                color: '#0A0A0A',
              }}
            >
              <Plus className="w-4 h-4" />
              Cadastrar Paróquia
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, cidade ou diocese..."
            className="w-full max-w-xl px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(10,10,10,0.6)',
              border: '1px solid rgba(201,168,76,0.12)',
              color: '#F2EDE4',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(201,168,76,0.4)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(201,168,76,0.12)' }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl p-6" style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.08)' }}>
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
            <Church className="w-12 h-12 mx-auto mb-4" style={{ color: '#7A7368', opacity: 0.5 }} />
            <p className="text-lg" style={{ fontFamily: 'Cinzel, serif', color: '#7A7368' }}>
              Nenhuma paróquia encontrada
            </p>
            {canCreate && (
              <Link
                href="/paroquias/cadastrar"
                className="inline-flex items-center gap-2 mt-4 text-sm underline"
                style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
              >
                Cadastrar a primeira paróquia
              </Link>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => (
              <div
                key={p.id}
                className="rounded-2xl p-6 transition-all duration-200 hover:border-[rgba(201,168,76,0.25)]"
                style={{
                  background: 'rgba(16,16,16,0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(201,168,76,0.1)',
                }}
              >
                {/* Photo */}
                {p.foto_url && (
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                    <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-base font-bold tracking-wide uppercase"
                    style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
                  >
                    {p.nome}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {statusIcon(p.status)}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                  {p.diocese && (
                    <p className="text-xs" style={{ color: '#7A7368' }}>{p.diocese}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                    <span>{p.cidade}, {p.estado}</span>
                  </div>
                  {p.padre_responsavel && (
                    <div className="flex items-center gap-2">
                      <Church className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                      <span>Pe. {p.padre_responsavel}</span>
                    </div>
                  )}
                  {p.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                      <span>{p.telefone}</span>
                    </div>
                  )}
                  {p.horarios_missa && p.horarios_missa.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#C9A84C' }} />
                      <div className="flex flex-wrap gap-1">
                        {p.horarios_missa.slice(0, 3).map((h, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.12)' }}
                          >
                            {h.dia} {h.horario}
                          </span>
                        ))}
                        {p.horarios_missa.length > 3 && (
                          <span className="text-xs" style={{ color: '#7A7368' }}>+{p.horarios_missa.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin actions */}
                {isAdmin && p.status === 'pendente' && (
                  <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }}>
                    <button
                      onClick={() => handleApprove(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: 'rgba(76,175,80,0.1)',
                        border: '1px solid rgba(76,175,80,0.2)',
                        color: '#4CAF50',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: 'rgba(217,79,92,0.1)',
                        border: '1px solid rgba(217,79,92,0.2)',
                        color: '#D94F5C',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <p className="text-xs" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>
              Página {page + 1} de {totalPages} ({total} paróquias)
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="p-2 rounded-lg transition-all disabled:opacity-30"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="p-2 rounded-lg transition-all disabled:opacity-30"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
