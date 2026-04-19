'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Church, Users, Pencil, Newspaper, BadgeCheck,
  UserPlus, Crown, Shield, LogOut, CheckCircle, XCircle, FileText, ExternalLink,
  UserMinus, ArrowUp, ArrowDown,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Field } from '../../cadastrar/components/Field'
import {
  addMemberByEmail,
  changeMemberRole,
  revokeMember,
} from './actions'
import { decideClaim } from '../claim/actions'

type Tab = 'equipe' | 'claims' | 'dados' | 'feed'

interface Member {
  id: string
  user_id: string
  role: 'admin' | 'moderator'
  added_at: string
  added_by: string | null
  profile: {
    id: string
    name: string | null
    email: string | null
    profile_image_url: string | null
    public_handle: string | null
  } | null
}

interface PendingClaim {
  id: string
  user_id: string | null
  nome_solicitante: string
  email_solicitante: string
  whatsapp: string | null
  relacao: string | null
  role_solicitada: 'admin' | 'moderator'
  mensagem: string | null
  documento_path: string | null
  created_at: string
}

interface Paroquia {
  id: string
  nome: string
  cidade: string
  estado: string
  foto_url: string | null
  status: string
  verificado: boolean
}

interface Props {
  paroquia: Paroquia
  currentUserId: string
  myRole: 'admin' | 'moderator'
  isSystemAdmin: boolean
  members: Member[]
  pendingClaims: PendingClaim[]
}

export default function GerenciarClient({
  paroquia, currentUserId, myRole, isSystemAdmin, members, pendingClaims,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>('equipe')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'moderator'>('moderator')

  const canManageTeam = myRole === 'admin' || isSystemAdmin
  const canPost = paroquia.verificado

  function runAction(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  async function openDoc(path: string) {
    const { data } = await supabase.storage
      .from('paroquia-documentos')
      .createSignedUrl(path, 600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const adminCount = members.filter(m => m.role === 'admin').length

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="bg-glow" aria-hidden />
      <div className="max-w-4xl mx-auto relative z-10 px-4 md:px-8 pt-6">
        <Link
          href={`/paroquias/${paroquia.id}`}
          className="inline-flex items-center gap-2 text-sm mb-4"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Voltar à página
        </Link>

        {/* Header */}
        <div
          className="rounded-2xl p-5 mb-6 flex gap-4 items-center"
          style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.15)' }}
        >
          {paroquia.foto_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={paroquia.foto_url} alt={paroquia.nome} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
              <Church className="w-6 h-6" style={{ color: '#C9A84C' }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold" style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-primary)' }}>
              {paroquia.nome}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {paroquia.cidade}, {paroquia.estado}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: myRole === 'admin' ? 'rgba(107,29,42,0.18)' : 'rgba(201,168,76,0.08)',
                  color: myRole === 'admin' ? '#D94F5C' : '#C9A84C',
                }}
              >
                Você é {myRole === 'admin' ? 'administrador' : 'moderador'}
              </span>
              {!paroquia.verificado && (
                <span className="text-xs" style={{ color: '#7A7368' }}>
                  Aguardando verificação — feed bloqueado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-2xl mb-6 overflow-x-auto"
          style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(201,168,76,0.1)' }}
        >
          {[
            { key: 'equipe' as Tab, icon: Users, label: 'Equipe' },
            { key: 'claims' as Tab, icon: BadgeCheck, label: `Pedidos${pendingClaims.length > 0 ? ` (${pendingClaims.length})` : ''}` },
            { key: 'dados' as Tab, icon: Pencil, label: 'Dados' },
            { key: 'feed' as Tab, icon: Newspaper, label: 'Feed' },
          ].map(({ key, icon: Icon, label }) => {
            const active = tab === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs tracking-wider uppercase whitespace-nowrap transition-all"
                style={{
                  fontFamily: 'var(--font-elegant)',
                  background: active ? 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)' : 'transparent',
                  color: active ? '#0A0A0A' : '#7A7368',
                  border: 'none',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            )
          })}
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm mb-4"
            style={{
              background: 'rgba(107,29,42,0.15)',
              border: '1px solid rgba(107,29,42,0.3)',
              color: '#D94F5C',
              fontFamily: 'var(--font-body)',
            }}
          >
            {error}
          </div>
        )}

        {/* ── EQUIPE ───────────────────────────────────────────── */}
        {tab === 'equipe' && (
          <div className="space-y-4">
            {canManageTeam && (
              <div
                className="rounded-2xl p-5 space-y-3"
                style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.15)' }}
              >
                <h3 className="text-sm font-semibold tracking-wide uppercase flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-elegant)', color: '#C9A84C' }}>
                  <UserPlus className="w-4 h-4" /> Adicionar membro
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  A pessoa já precisa ter uma conta no Veritas Dei. Busque pelo email dela.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                  <Field
                    label="Email do usuário"
                    value={inviteEmail}
                    onChange={setInviteEmail}
                    placeholder="email@exemplo.com"
                    inputMode="email"
                  />
                  <div>
                    <label
                      className="block text-xs mb-2 tracking-wider uppercase"
                      style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
                    >
                      Função
                    </label>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value as 'admin' | 'moderator')}
                      className="w-full px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: 'rgba(10,10,10,0.6)',
                        border: '1px solid rgba(201,168,76,0.12)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        outline: 'none',
                      }}
                    >
                      <option value="moderator">Moderador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={pending || !inviteEmail.trim()}
                    onClick={() =>
                      runAction(async () => {
                        const r = await addMemberByEmail({
                          paroquiaId: paroquia.id,
                          email: inviteEmail.trim(),
                          role: inviteRole,
                        })
                        if (r.ok) setInviteEmail('')
                        return r
                      })
                    }
                    className="px-4 py-3 rounded-xl text-sm font-semibold touch-target-lg disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                      color: '#0F0E0C',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {members.map(m => {
                const isMe = m.user_id === currentUserId
                const name = m.profile?.name ?? m.profile?.email ?? m.user_id.slice(0, 8)
                const canActOnThis = canManageTeam && (!isMe || myRole === 'admin')
                const isLastAdmin = m.role === 'admin' && adminCount <= 1
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3"
                    style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {m.profile?.profile_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={m.profile.profile_image_url}
                          alt={name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
                        >
                          <span
                            className="text-xs"
                            style={{ color: '#C9A84C', fontFamily: 'var(--font-body)' }}
                          >
                            {(m.profile?.name ?? '?').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#F2EDE4', fontFamily: 'var(--font-body)' }}>
                          {name}
                          {isMe && <span className="ml-1.5 text-xs" style={{ color: '#7A7368' }}>(você)</span>}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#7A7368' }}>
                          {m.profile?.email}
                        </p>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          background: m.role === 'admin' ? 'rgba(107,29,42,0.18)' : 'rgba(201,168,76,0.08)',
                          color: m.role === 'admin' ? '#D94F5C' : '#C9A84C',
                        }}
                      >
                        {m.role === 'admin' ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {m.role === 'admin' ? 'Admin' : 'Moderador'}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {canActOnThis && m.role === 'moderator' && (
                        <button
                          type="button"
                          onClick={() =>
                            runAction(() =>
                              changeMemberRole({ memberId: m.id, newRole: 'admin' }),
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs active:scale-[0.98]"
                          style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C' }}
                          disabled={pending}
                        >
                          <ArrowUp className="w-3 h-3" /> Promover
                        </button>
                      )}
                      {canActOnThis && m.role === 'admin' && !isLastAdmin && (
                        <button
                          type="button"
                          onClick={() =>
                            runAction(() =>
                              changeMemberRole({ memberId: m.id, newRole: 'moderator' }),
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs active:scale-[0.98]"
                          style={{ background: 'rgba(201,168,76,0.05)', color: '#7A7368' }}
                          disabled={pending}
                        >
                          <ArrowDown className="w-3 h-3" /> Rebaixar
                        </button>
                      )}
                      {canActOnThis && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isLastAdmin) {
                              setError('Esta igreja ficaria sem administrador. Promova outro antes.')
                              return
                            }
                            if (!confirm(`Remover ${name} da equipe?`)) return
                            runAction(() => revokeMember({ memberId: m.id }))
                          }}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs active:scale-[0.98]"
                          style={{ background: 'rgba(217,79,92,0.1)', color: '#D94F5C' }}
                          disabled={pending}
                        >
                          <UserMinus className="w-3 h-3" /> Remover
                        </button>
                      )}
                      {isMe && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isLastAdmin) {
                              setError('Você é o último admin. Promova outro antes de sair.')
                              return
                            }
                            if (!confirm('Deixar de administrar esta igreja?')) return
                            runAction(() => revokeMember({ memberId: m.id }))
                          }}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs active:scale-[0.98]"
                          style={{ background: 'rgba(107,29,42,0.12)', color: '#D94F5C' }}
                          disabled={pending}
                        >
                          <LogOut className="w-3 h-3" /> Sair
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── CLAIMS ───────────────────────────────────────────── */}
        {tab === 'claims' && (
          <div className="space-y-3">
            {pendingClaims.length === 0 && (
              <p
                className="text-center text-sm py-8"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
              >
                Nenhum pedido pendente para esta igreja.
              </p>
            )}
            {pendingClaims.map(c => (
              <div
                key={c.id}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold" style={{ color: '#F2EDE4', fontFamily: 'var(--font-body)' }}>
                        {c.nome_solicitante}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: c.role_solicitada === 'admin' ? 'rgba(107,29,42,0.18)' : 'rgba(201,168,76,0.08)',
                          color: c.role_solicitada === 'admin' ? '#D94F5C' : '#C9A84C',
                        }}
                      >
                        Quer ser {c.role_solicitada === 'admin' ? 'administrador' : 'moderador'}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#7A7368' }}>{c.email_solicitante}</p>
                    {c.whatsapp && <p className="text-xs" style={{ color: '#7A7368' }}>WhatsApp: {c.whatsapp}</p>}
                    {c.relacao && <p className="text-xs mt-1" style={{ color: '#B8AFA2' }}>Relação: {c.relacao}</p>}
                    {c.mensagem && (
                      <p className="text-xs mt-2 p-2 rounded-lg whitespace-pre-wrap"
                        style={{ background: 'rgba(10,10,10,0.5)', color: '#B8AFA2' }}>
                        {c.mensagem}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {c.documento_path && (
                        <button
                          type="button"
                          onClick={() => openDoc(c.documento_path!)}
                          className="inline-flex items-center gap-1 text-xs underline"
                          style={{ color: '#C9A84C', background: 'none', border: 'none' }}
                        >
                          <FileText className="w-3 h-3" /> Ver documento <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      <span className="text-xs" style={{ color: '#7A736860' }}>
                        {new Date(c.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {c.role_solicitada === 'admin' && !isSystemAdmin && (
                      <p className="text-[11px] mt-2" style={{ color: '#7A7368' }}>
                        Pedidos de administrador só podem ser aprovados pelo time Veritas Dei.
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:flex md:justify-end gap-2 mt-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      const notas = (prompt('Motivo da recusa (opcional):') ?? '').trim() || null
                      runAction(() => decideClaim({ claimId: c.id, action: 'rejeitar', adminNotas: notas }))
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium touch-target-lg"
                    style={{ background: 'rgba(217,79,92,0.1)', border: '1px solid rgba(217,79,92,0.25)', color: '#D94F5C', fontFamily: 'var(--font-body)' }}
                  >
                    <XCircle className="w-4 h-4" /> Rejeitar
                  </button>
                  {(c.role_solicitada === 'moderator' || isSystemAdmin) && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => runAction(() => decideClaim({ claimId: c.id, action: 'aprovar' }))}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium touch-target-lg"
                      style={{ background: 'rgba(76,175,80,0.12)', border: '1px solid rgba(76,175,80,0.3)', color: '#4CAF50', fontFamily: 'var(--font-body)' }}
                    >
                      <CheckCircle className="w-4 h-4" /> Aprovar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DADOS ────────────────────────────────────────────── */}
        {tab === 'dados' && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <Pencil className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C', opacity: 0.7 }} />
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Edite todas as informações da igreja (horários, fotos, contatos, história).
            </p>
            <Link
              href={`/paroquias/${paroquia.id}/editar`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                color: '#0F0E0C',
                fontFamily: 'var(--font-body)',
              }}
            >
              <Pencil className="w-4 h-4" /> Abrir editor
            </Link>
          </div>
        )}

        {/* ── FEED ─────────────────────────────────────────────── */}
        {tab === 'feed' && (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.1)' }}
          >
            <Newspaper className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C', opacity: 0.7 }} />
            {canPost ? (
              <>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  Crie avisos e publicações visíveis no perfil da igreja.
                </p>
                <Link
                  href={`/paroquias/${paroquia.id}/publicar`}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: 'linear-gradient(180deg, #C9A84C, #A88437)',
                    color: '#0F0E0C',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <Newspaper className="w-4 h-4" /> Publicar aviso
                </Link>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                O feed será liberado assim que a verificação da igreja for concluída.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
