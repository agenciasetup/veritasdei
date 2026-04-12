'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { VocacaoIcon } from '@/components/icons/VocacaoIcons'
import {
  CheckSquare, Church, Shield, CheckCircle, XCircle,
  FileText, MapPin, User, ExternalLink, BadgeCheck,
} from 'lucide-react'

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

type Tab = 'verificacoes' | 'paroquias' | 'igrejas-verif'

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
    const { data } = await supabase
      .from('paroquias')
      .select('*, owner:owner_user_id(name, email)')
      .not('verificacao_solicitada_em', 'is', null)
      .eq('verificado', false)
      .order('verificacao_solicitada_em', { ascending: true })
    setIgrejasVerif((data as ParoquiaVerif[]) ?? [])
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (tab === 'verificacoes') fetchVerificacoes()
    else if (tab === 'paroquias') fetchParoquias()
    else fetchIgrejasVerif()
  }, [tab, fetchVerificacoes, fetchParoquias, fetchIgrejasVerif])

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

  const totalPending = verificacoes.length + paroquias.length + igrejasVerif.length

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
                <div key={v.id} className="rounded-2xl p-5"
                  style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <VocacaoIcon vocacao={v.profiles?.vocacao ?? 'leigo'} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}>
                        {v.profiles?.name ?? '—'}
                      </p>
                      <p className="text-xs" style={{ color: '#7A7368' }}>{v.profiles?.email}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}>
                          {v.tipo}
                        </span>
                        {v.profiles?.cidade && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: '#7A7368' }}>
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
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleVerificacao(v.id, 'aprovado')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.2)', color: '#4CAF50', fontFamily: 'Poppins, sans-serif' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                      </button>
                      <button onClick={() => handleVerificacao(v.id, 'rejeitado')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(217,79,92,0.1)', border: '1px solid rgba(217,79,92,0.2)', color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
                        <XCircle className="w-3.5 h-3.5" /> Rejeitar
                      </button>
                    </div>
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
                      <img src={p.foto_url} alt={p.nome} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
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
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleIgrejaVerif(p.id, 'aprovar')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.2)', color: '#4CAF50', fontFamily: 'Poppins, sans-serif' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                      </button>
                      <button onClick={() => handleIgrejaVerif(p.id, 'rejeitar')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(217,79,92,0.1)', border: '1px solid rgba(217,79,92,0.2)', color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
                        <XCircle className="w-3.5 h-3.5" /> Rejeitar
                      </button>
                    </div>
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
                        <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
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
                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => handleParoquia(p.id, 'aprovada')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.2)', color: '#4CAF50', fontFamily: 'Poppins, sans-serif' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                      </button>
                      <button onClick={() => handleParoquia(p.id, 'rejeitada')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{ background: 'rgba(217,79,92,0.1)', border: '1px solid rgba(217,79,92,0.2)', color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
                        <XCircle className="w-3.5 h-3.5" /> Rejeitar
                      </button>
                    </div>
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
