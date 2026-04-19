'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import {
  CheckSquare, Church, Shield, CheckCircle, XCircle,
  FileText, MapPin, User, ExternalLink, BadgeCheck, Crown,
} from 'lucide-react'
import { decideClaim } from '@/app/paroquias/[id]/claim/actions'

interface Verificacao {
  id: string
  user_id: string
  tipo: string
  documento_url: string | null
  status: string
  notas: string | null
  created_at: string
  profiles?: { name: string | null; email: string | null; vocacao: string; cidade: string | null; estado: string | null }
}

interface ParoquiaPendente {
  id: string
  nome: string
  diocese: string | null
  cidade: string
  estado: string
  padre_responsavel: string | null
  status: string
  created_at: string
  foto_url: string | null
  criado_por: string
  profiles?: { name: string | null; email: string | null; vocacao: string }
}

type Tab = 'verificacoes' | 'paroquias' | 'igrejas-verif' | 'claims'

interface ClaimRow {
  id: string
  paroquia_id: string
  user_id: string | null
  nome_solicitante: string
  email_solicitante: string
  whatsapp: string | null
  relacao: string | null
  role_solicitada: 'admin' | 'moderator'
  mensagem: string | null
  documento_path: string | null
  created_at: string
  paroquia: { id: string; nome: string; cidade: string; estado: string; foto_url: string | null } | null
  solicitante: { name: string | null; email: string | null } | null
}

interface ParoquiaVerif {
  id: string
  nome: string
  cnpj: string | null
  tipo_igreja: string | null
  diocese: string | null
  cidade: string
  estado: string
  padre_responsavel: string | null
  foto_url: string | null
  verificacao_solicitada_em: string
  verificacao_documento_path: string | null
  verificacao_notas: string | null
  owner_user_id: string | null
  owner?: { name: string | null; email: string | null } | null
}

export default function AdminAprovacoesPage() {
  const supabase = createClient()
  const { profile } = useAuth()

  const [tab, setTab] = useState<Tab>('verificacoes')
  const [verificacoes, setVerificacoes] = useState<Verificacao[]>([])
  const [paroquias, setParoquias] = useState<ParoquiaPendente[]>([])
  const [igrejasVerif, setIgrejasVerif] = useState<ParoquiaVerif[]>([])
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVerificacoes = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data } = await supabase
      .from('verificacoes')
      .select('*, profiles:user_id(name, email, vocacao, cidade, estado)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
    setVerificacoes((data as Verificacao[]) ?? [])
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchParoquias = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data } = await supabase
      .from('paroquias')
      .select('*, profiles:criado_por(name, email, vocacao)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
    setParoquias((data as ParoquiaPendente[]) ?? [])
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchIgrejasVerif = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('paroquias')
      .select(
        'id, nome, cnpj, tipo_igreja, diocese, cidade, estado, padre_responsavel, foto_url, verificacao_solicitada_em, verificacao_documento_path, verificacao_notas, owner_user_id',
      )
      .not('verificacao_solicitada_em', 'is', null)
      .eq('verificado', false)
      .order('verificacao_solicitada_em', { ascending: true })

    if (error) {
      console.error('[admin] igrejas verif fetch error:', error)
      setIgrejasVerif([])
      setLoading(false)
      return
    }

    const rows = (data as ParoquiaVerif[]) ?? []
    const ownerIds = Array.from(
      new Set(rows.map(r => r.owner_user_id).filter((v): v is string => !!v)),
    )

    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', ownerIds)
      type OwnerRow = { id: string; name: string | null; email: string | null }
      const list = (owners as OwnerRow[] | null) ?? []
      const byId = new Map<string, OwnerRow>(list.map(o => [o.id, o]))
      for (const r of rows) {
        const o = r.owner_user_id ? byId.get(r.owner_user_id) : null
        r.owner = o ? { name: o.name ?? null, email: o.email ?? null } : null
      }
    }

    setIgrejasVerif(rows)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchClaims = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('paroquia_claims')
      .select(
        'id, paroquia_id, user_id, nome_solicitante, email_solicitante, whatsapp, relacao, role_solicitada, mensagem, documento_path, created_at, paroquia:paroquias(id, nome, cidade, estado, foto_url)',
      )
      .eq('status', 'pendente')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[admin] claims fetch error:', error)
      setClaims([])
      setLoading(false)
      return
    }

    const rows = (data as unknown as ClaimRow[]) ?? []
    const userIds = Array.from(
      new Set(rows.map(r => r.user_id).filter((v): v is string => !!v)),
    )
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds)
      type U = { id: string; name: string | null; email: string | null }
      const list = (users as U[] | null) ?? []
      const byId = new Map<string, U>(list.map(u => [u.id, u]))
      for (const r of rows) {
        const u = r.user_id ? byId.get(r.user_id) : null
        r.solicitante = u ? { name: u.name, email: u.email } : null
      }
    }
    setClaims(rows)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (tab === 'verificacoes') fetchVerificacoes()
    else if (tab === 'paroquias') fetchParoquias()
    else if (tab === 'igrejas-verif') fetchIgrejasVerif()
    else if (tab === 'claims') fetchClaims()
  }, [tab, fetchVerificacoes, fetchParoquias, fetchIgrejasVerif, fetchClaims])

  const handleVerificacao = async (id: string, action: 'aprovado' | 'rejeitado') => {
    if (!supabase || !profile) return
    await supabase.from('verificacoes').update({
      status: action,
      revisado_por: profile.id,
    }).eq('id', id)

    // If approved, also update the user's profile
    if (action === 'aprovado') {
      const ver = verificacoes.find(v => v.id === id)
      if (ver) {
        await supabase.from('profiles').update({ verified: true }).eq('id', ver.user_id)
      }
    }

    fetchVerificacoes()
  }

  const handleParoquia = async (id: string, action: 'aprovada' | 'rejeitada') => {
    if (!supabase || !profile) return
    await supabase.from('paroquias').update({
      status: action,
      aprovado_por: profile.id,
    }).eq('id', id)
    fetchParoquias()
  }

  const handleIgrejaVerif = async (id: string, action: 'aprovar' | 'rejeitar') => {
    if (!supabase || !profile) return
    if (action === 'aprovar') {
      await supabase.from('paroquias').update({
        verificado: true,
        verificado_por: profile.id,
        verificado_em: new Date().toISOString(),
      }).eq('id', id)
    } else {
      await supabase.from('paroquias').update({
        verificacao_solicitada_em: null,
      }).eq('id', id)
    }
    fetchIgrejasVerif()
  }

  const openVerifDoc = async (path: string) => {
    if (!supabase) return
    const { data } = await supabase.storage
      .from('paroquia-documentos')
      .createSignedUrl(path, 600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const handleClaim = async (id: string, action: 'aprovar' | 'rejeitar') => {
    const notas = action === 'rejeitar'
      ? (prompt('Motivo da rejeição (será enviado ao solicitante):') ?? '').trim() || null
      : null
    const result = await decideClaim({
      claimId: id,
      action,
      adminNotas: notas,
    })
    if (!result.ok) {
      alert(result.error)
      return
    }
    fetchClaims()
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare className="w-5 h-5" style={{ color: '#C9A84C' }} />
        <h1 className="text-xl font-bold tracking-wider uppercase"
          style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
          Aprovações
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'verificacoes' as Tab, icon: Shield, label: 'Verificações de Título' },
          { key: 'paroquias' as Tab, icon: Church, label: 'Paróquias Pendentes' },
          { key: 'igrejas-verif' as Tab, icon: BadgeCheck, label: 'Verificações de Igrejas' },
          { key: 'claims' as Tab, icon: Crown, label: 'Reivindicações' },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all"
            style={{
              fontFamily: 'Poppins, sans-serif',
              background: tab === key ? 'rgba(201,168,76,0.1)' : 'rgba(16,16,16,0.6)',
              border: tab === key ? '1px solid rgba(201,168,76,0.25)' : '1px solid rgba(201,168,76,0.08)',
              color: tab === key ? '#C9A84C' : '#7A7368',
            }}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-12 text-center">
          <div className="w-6 h-6 border-2 rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }} />
        </div>
      )}

      {/* ═══ VERIFICAÇÕES ═══ */}
      {!loading && tab === 'verificacoes' && (
        <>
          {verificacoes.length === 0 ? (
            <EmptyState icon={Shield} message="Nenhuma verificação pendente" />
          ) : (
            <div className="space-y-3">
              {verificacoes.map(v => (
                <div key={v.id} className="rounded-2xl p-4 md:p-5"
                  style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}>
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <VocacaoIcon vocacao={v.profiles?.vocacao ?? 'leigo'} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                        {v.profiles?.name ?? '—'}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#8A8378' }}>{v.profiles?.email}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                          {v.tipo}
                        </span>
                        {v.profiles?.cidade && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#8A8378' }}>
                            <MapPin className="w-3 h-3" />
                            {v.profiles.cidade}, {v.profiles.estado}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: '#7A736860' }}>
                          {new Date(v.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {v.documento_url && (
                        <button
                          onClick={async () => {
                            const { data } = await supabase.storage.from('verificacoes').createSignedUrl(v.documento_url!, 600)
                            if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                          }}
                          className="inline-flex items-center gap-1 text-xs mt-2 underline cursor-pointer"
                          style={{ color: '#C9A84C', background: 'none', border: 'none' }}>
                          <FileText className="w-3 h-3" /> Ver documento
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      {v.notas && (
                        <p className="text-xs mt-2 p-2 rounded-lg"
                          style={{ background: 'rgba(10,10,10,0.5)', color: '#B8AFA2' }}>
                          {v.notas}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Actions — full-width no mobile, inline no desktop */}
                  <div className="grid grid-cols-2 md:flex md:justify-end gap-2 mt-3">
                    <button onClick={() => {
                      if (confirm(`Rejeitar verificação de "${v.profiles?.name ?? 'usuário'}"?`)) {
                        handleVerificacao(v.id, 'rejeitado')
                      }
                    }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] touch-target-lg"
                      style={{ background: 'rgba(217,79,92,0.1)', border: '1px solid rgba(217,79,92,0.25)', color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </button>
                    <button onClick={() => handleVerificacao(v.id, 'aprovado')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] touch-target-lg"
                      style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50', fontFamily: 'Poppins, sans-serif' }}>
                      <CheckCircle className="w-4 h-4" /> Aprovar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ VERIFICAÇÕES DE IGREJAS ═══ */}
      {!loading && tab === 'igrejas-verif' && (
        <>
          {igrejasVerif.length === 0 ? (
            <EmptyState icon={BadgeCheck} message="Nenhuma igreja aguardando verificação" />
          ) : (
            <div className="space-y-3">
              {igrejasVerif.map(p => (
                <div key={p.id} className="rounded-2xl p-5"
                  style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}>
                  <div className="flex items-start gap-4">
                    {p.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.foto_url} alt={p.nome} loading="lazy" decoding="async" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                        <Church className="w-6 h-6" style={{ color: '#C9A84C' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                          {p.nome}
                        </p>
                        {p.tipo_igreja && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                            {p.tipo_igreja}
                          </span>
                        )}
                      </div>
                      {p.diocese && <p className="text-xs" style={{ color: '#7A7368' }}>{p.diocese}</p>}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#B8AFA2' }}>
                          <MapPin className="w-3 h-3" style={{ color: '#C9A84C' }} />
                          {p.cidade}, {p.estado}
                        </span>
                        {p.cnpj && (
                          <span className="text-xs" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                            CNPJ: {p.cnpj}
                          </span>
                        )}
                        {p.padre_responsavel && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#B8AFA2' }}>
                            <User className="w-3 h-3" style={{ color: '#C9A84C' }} />
                            Pe. {p.padre_responsavel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: '#7A736860' }}>
                        Solicitado por {p.owner?.name ?? p.owner?.email ?? 'desconhecido'} em {new Date(p.verificacao_solicitada_em).toLocaleDateString('pt-BR')}
                      </p>
                      {p.verificacao_documento_path && (
                        <button
                          onClick={() => openVerifDoc(p.verificacao_documento_path!)}
                          className="inline-flex items-center gap-1 text-xs mt-2 underline cursor-pointer"
                          style={{ color: '#C9A84C', background: 'none', border: 'none' }}>
                          <FileText className="w-3 h-3" /> Ver documento
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      {p.verificacao_notas && (
                        <p className="text-xs mt-2 p-2 rounded-lg"
                          style={{ background: 'rgba(10,10,10,0.5)', color: '#B8AFA2' }}>
                          {p.verificacao_notas}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:flex md:justify-end gap-2 mt-3">
                    <button onClick={() => {
                      if (confirm(`Rejeitar verificação de "${p.nome}"?`)) handleIgrejaVerif(p.id, 'rejeitar')
                    }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] touch-target-lg"
                      style={{ background: 'rgba(217,79,92,0.1)', border: '1px solid rgba(217,79,92,0.25)', color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </button>
                    <button onClick={() => handleIgrejaVerif(p.id, 'aprovar')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] touch-target-lg"
                      style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50', fontFamily: 'Poppins, sans-serif' }}>
                      <CheckCircle className="w-4 h-4" /> Aprovar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ PARÓQUIAS ═══ */}
      {!loading && tab === 'paroquias' && (
        <>
          {paroquias.length === 0 ? (
            <EmptyState icon={Church} message="Nenhuma paróquia pendente" />
          ) : (
            <div className="space-y-3">
              {paroquias.map(p => (
                <div key={p.id} className="rounded-2xl p-5"
                  style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}>
                  <div className="flex items-start gap-4">
                    {p.foto_url && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={p.foto_url} alt={p.nome} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                        {p.nome}
                      </p>
                      {p.diocese && <p className="text-xs" style={{ color: '#7A7368' }}>{p.diocese}</p>}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#B8AFA2' }}>
                          <MapPin className="w-3 h-3" style={{ color: '#C9A84C' }} />
                          {p.cidade}, {p.estado}
                        </span>
                        {p.padre_responsavel && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#B8AFA2' }}>
                            <User className="w-3 h-3" style={{ color: '#C9A84C' }} />
                            Pe. {p.padre_responsavel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: '#7A736860' }}>
                        Enviada por {p.profiles?.name ?? 'desconhecido'} em {new Date(p.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:flex md:justify-end gap-2 mt-3">
                    <button onClick={() => {
                      if (confirm(`Rejeitar paróquia "${p.nome}"?`)) handleParoquia(p.id, 'rejeitada')
                    }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] touch-target-lg"
                      style={{ background: 'rgba(217,79,92,0.1)', border: '1px solid rgba(217,79,92,0.25)', color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </button>
                    <button onClick={() => handleParoquia(p.id, 'aprovada')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] touch-target-lg"
                      style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50', fontFamily: 'Poppins, sans-serif' }}>
                      <CheckCircle className="w-4 h-4" /> Aprovar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ REIVINDICAÇÕES ═══ */}
      {!loading && tab === 'claims' && (
        <>
          {claims.length === 0 ? (
            <EmptyState icon={Crown} message="Nenhuma reivindicação pendente" />
          ) : (
            <div className="space-y-3">
              {claims.map(c => (
                <div key={c.id} className="rounded-2xl p-5"
                  style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}>
                  <div className="flex items-start gap-4">
                    {c.paroquia?.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.paroquia.foto_url} alt={c.paroquia.nome} loading="lazy" decoding="async" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                        <Church className="w-5 h-5" style={{ color: '#C9A84C' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-bold" style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}>
                          {c.paroquia?.nome ?? '—'}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: c.role_solicitada === 'admin' ? 'rgba(107,29,42,0.18)' : 'rgba(201,168,76,0.08)',
                            color: c.role_solicitada === 'admin' ? '#D94F5C' : '#C9A84C',
                            fontFamily: 'Poppins, sans-serif',
                          }}>
                          {c.role_solicitada === 'admin' ? 'Administrador' : 'Moderador'}
                        </span>
                      </div>
                      {c.paroquia && (
                        <p className="text-xs flex items-center gap-1" style={{ color: '#B8AFA2' }}>
                          <MapPin className="w-3 h-3" style={{ color: '#C9A84C' }} />
                          {c.paroquia.cidade}, {c.paroquia.estado}
                        </p>
                      )}
                      <div className="mt-2 text-xs space-y-0.5" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
                        <p>
                          <User className="inline w-3 h-3 mr-1" style={{ color: '#C9A84C' }} />
                          <strong style={{ color: '#F2EDE4' }}>{c.nome_solicitante}</strong>
                          {c.solicitante?.name && c.solicitante.name !== c.nome_solicitante && (
                            <span className="ml-1" style={{ color: '#7A7368' }}>(conta: {c.solicitante.name})</span>
                          )}
                        </p>
                        <p style={{ color: '#7A7368' }}>{c.email_solicitante}</p>
                        {c.whatsapp && <p style={{ color: '#7A7368' }}>WhatsApp: {c.whatsapp}</p>}
                        {c.relacao && <p>Relação: {c.relacao}</p>}
                      </div>
                      {c.mensagem && (
                        <p className="text-xs mt-2 p-2 rounded-lg whitespace-pre-wrap"
                          style={{ background: 'rgba(10,10,10,0.5)', color: '#B8AFA2' }}>
                          {c.mensagem}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {c.documento_path && (
                          <button
                            onClick={() => openVerifDoc(c.documento_path!)}
                            className="inline-flex items-center gap-1 text-xs underline cursor-pointer"
                            style={{ color: '#C9A84C', background: 'none', border: 'none' }}>
                            <FileText className="w-3 h-3" /> Ver documento
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        <span className="text-xs" style={{ color: '#7A736860' }}>
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:flex md:justify-end gap-2 mt-3">
                    <button onClick={() => handleClaim(c.id, 'rejeitar')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] touch-target-lg"
                      style={{ background: 'rgba(217,79,92,0.1)', border: '1px solid rgba(217,79,92,0.25)', color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </button>
                    <button onClick={() => handleClaim(c.id, 'aprovar')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] touch-target-lg"
                      style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50', fontFamily: 'Poppins, sans-serif' }}>
                      <CheckCircle className="w-4 h-4" /> Aprovar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="rounded-2xl p-12 text-center"
      style={{ background: 'rgba(16,16,16,0.5)', border: '1px solid rgba(201,168,76,0.08)' }}>
      <Icon className="w-10 h-10 mx-auto mb-3" style={{ color: '#7A7368', opacity: 0.4 }} />
      <p className="text-sm" style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}>{message}</p>
    </div>
  )
}
