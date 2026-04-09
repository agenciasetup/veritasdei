'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import AuthGuard from '@/components/auth/AuthGuard'
import {
  ArrowLeft, UserPlus, Trash2, CheckCircle, Clock,
  GraduationCap, Mail, User, Church,
} from 'lucide-react'
import Link from 'next/link'

interface Autorizacao {
  id: string
  email: string
  nome: string | null
  paroquia: string | null
  autorizado_em: string
  usado: boolean
  usado_por: string | null
  usado_em: string | null
}

export default function CatequistasPage() {
  return (
    <AuthGuard>
      <CatequistasContent />
    </AuthGuard>
  )
}

function CatequistasContent() {
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [autorizacoes, setAutorizacoes] = useState<Autorizacao[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [paroquia, setParoquia] = useState('')

  const canAuthorize =
    profile?.verified === true &&
    ['padre', 'bispo', 'cardeal', 'papa'].includes(profile?.vocacao ?? '')

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (!supabase || !user) return
    loadAutorizacoes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function loadAutorizacoes() {
    if (!supabase || !user) return
    const { data } = await supabase
      .from('catequistas_autorizados')
      .select('id, email, nome, paroquia, autorizado_em, usado, usado_por, usado_em')
      .eq('padre_id', user.id)
      .order('autorizado_em', { ascending: false })
    setAutorizacoes((data as Autorizacao[]) ?? [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !user || !email.trim()) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const { error: insertError } = await supabase
      .from('catequistas_autorizados')
      .insert({
        padre_id: user.id,
        email: email.trim().toLowerCase(),
        nome: nome.trim() || null,
        paroquia: paroquia.trim() || null,
      })

    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
        setError('Este email ja foi autorizado.')
      } else if (insertError.message.includes('violates row-level')) {
        setError('Apenas padres verificados podem autorizar catequistas.')
      } else {
        setError(insertError.message)
      }
      setSubmitting(false)
      return
    }

    setSuccess(`Autorizacao para ${email.trim()} registrada com sucesso!`)
    setEmail('')
    setNome('')
    setParoquia('')
    setSubmitting(false)
    loadAutorizacoes()
  }

  const handleDelete = async (id: string) => {
    if (!supabase) return
    const { error } = await supabase
      .from('catequistas_autorizados')
      .delete()
      .eq('id', id)

    if (!error) {
      setAutorizacoes(prev => prev.filter(a => a.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,168,76,0.2)', borderTopColor: '#C9A84C' }}
        />
      </div>
    )
  }

  // Access check
  if (!canAuthorize && !isAdmin) {
    return (
      <div className="min-h-screen px-4 md:px-8 py-8 relative">
        <div className="bg-glow" />
        <div className="max-w-2xl mx-auto relative z-10">
          <Link
            href="/perfil"
            className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
            style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Perfil
          </Link>
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <GraduationCap className="w-16 h-16 mx-auto mb-4" style={{ color: '#7A7368' }} />
            <h2
              className="text-lg font-bold mb-2"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Acesso Restrito
            </h2>
            <p
              className="text-sm"
              style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
            >
              Apenas padres, bispos e cardeais verificados podem autorizar catequistas.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />
      <div className="max-w-2xl mx-auto relative z-10">
        <Link
          href="/perfil"
          className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-80"
          style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Perfil
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
          >
            <GraduationCap className="w-6 h-6" style={{ color: '#C9A84C' }} />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C' }}
            >
              Autorizar Catequistas
            </h1>
            <p className="text-sm mt-1" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
              Registre o email dos catequistas da sua paroquia
            </p>
          </div>
        </div>

        {/* Info */}
        <div
          className="rounded-xl p-4 flex items-start gap-3 mb-6"
          style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.1)' }}
        >
          <GraduationCap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C9A84C' }} />
          <p className="text-sm" style={{ color: '#B8AFA2', fontFamily: 'Poppins, sans-serif' }}>
            Quando um catequista se cadastrar no Veritas Dei com o email autorizado e escolher a vocacao &quot;Catequista&quot;, ele sera verificado automaticamente.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4 mb-8"
          style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
        >
          <h3
            className="text-base font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
          >
            Nova Autorizacao
          </h3>

          {/* Email (required) */}
          <div>
            <label
              className="block text-xs mb-2 tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
            >
              Email do Catequista *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7A7368' }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="catequista@email.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Name (optional) */}
          <div>
            <label
              className="block text-xs mb-2 tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
            >
              Nome (opcional)
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7A7368' }} />
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Nome do catequista"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Parish (optional) */}
          <div>
            <label
              className="block text-xs mb-2 tracking-wider uppercase"
              style={{ fontFamily: 'Cinzel, serif', color: '#B8AFA2' }}
            >
              Paroquia (opcional)
            </label>
            <div className="relative">
              <Church className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7A7368' }} />
              <input
                type="text"
                value={paroquia}
                onChange={e => setParoquia(e.target.value)}
                placeholder="Nome da paroquia"
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(10,10,10,0.6)',
                  border: '1px solid rgba(201,168,76,0.12)',
                  color: '#F2EDE4',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm" style={{ color: '#66BB6A', fontFamily: 'Poppins, sans-serif' }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
            style={{
              fontFamily: 'Cinzel, serif',
              background:
                !email.trim() || submitting
                  ? 'rgba(201,168,76,0.1)'
                  : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
              color: !email.trim() || submitting ? '#7A7368' : '#0A0A0A',
              cursor: !email.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <div
                className="w-4 h-4 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(10,10,10,0.3)', borderTopColor: '#0A0A0A' }}
              />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Autorizar Catequista
              </>
            )}
          </button>
        </form>

        {/* List */}
        <div>
          <h3
            className="text-base font-bold tracking-wider uppercase mb-4"
            style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
          >
            Autorizacoes ({autorizacoes.length})
          </h3>

          {autorizacoes.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
            >
              <GraduationCap className="w-12 h-12 mx-auto mb-3" style={{ color: '#7A7368' }} />
              <p
                className="text-sm"
                style={{ color: '#7A7368', fontFamily: 'Poppins, sans-serif' }}
              >
                Nenhum catequista autorizado ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {autorizacoes.map(auth => (
                <div
                  key={auth.id}
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{
                    background: auth.usado ? 'rgba(76,175,80,0.05)' : 'rgba(16,16,16,0.7)',
                    border: auth.usado
                      ? '1px solid rgba(76,175,80,0.15)'
                      : '1px solid rgba(201,168,76,0.1)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: auth.usado
                        ? 'rgba(76,175,80,0.1)'
                        : 'rgba(201,168,76,0.08)',
                    }}
                  >
                    {auth.usado ? (
                      <CheckCircle className="w-5 h-5" style={{ color: '#66BB6A' }} />
                    ) : (
                      <Clock className="w-5 h-5" style={{ color: '#C9A84C' }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {auth.nome || auth.email}
                      </span>
                      {auth.usado && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(76,175,80,0.1)',
                            color: '#66BB6A',
                            border: '1px solid rgba(76,175,80,0.2)',
                          }}
                        >
                          Verificado
                        </span>
                      )}
                      {!auth.usado && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(201,168,76,0.08)',
                            color: '#C9A84C',
                            border: '1px solid rgba(201,168,76,0.15)',
                          }}
                        >
                          Pendente
                        </span>
                      )}
                    </div>
                    {auth.nome && (
                      <p className="text-xs truncate" style={{ color: '#7A7368' }}>
                        {auth.email}
                      </p>
                    )}
                    {auth.paroquia && (
                      <p className="text-xs" style={{ color: '#7A7368' }}>
                        {auth.paroquia}
                      </p>
                    )}
                    <p className="text-[10px] mt-1" style={{ color: '#5A5550' }}>
                      Autorizado em {new Date(auth.autorizado_em).toLocaleDateString('pt-BR')}
                      {auth.usado_em && ` · Verificado em ${new Date(auth.usado_em).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>

                  {!auth.usado && (
                    <button
                      onClick={() => handleDelete(auth.id)}
                      className="flex-shrink-0 p-2 rounded-lg transition-colors hover:opacity-80"
                      style={{ color: '#D94F5C' }}
                      title="Remover autorizacao"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
