import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Church, Crown, Plus, Shield } from 'lucide-react'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Minhas igrejas — Veritas Dei',
}

export default async function MinhasIgrejasPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/conta/minhas-igrejas')

  const { data: memberships } = await supabase
    .from('paroquia_members')
    .select(
      'id, role, added_at, paroquia:paroquias(id, nome, cidade, estado, foto_url, verificado, status)',
    )
    .eq('user_id', user.id)
    .is('revoked_at', null)
    .order('added_at', { ascending: false })
    .returns<
      Array<{
        id: string
        role: 'admin' | 'moderator'
        added_at: string
        paroquia: {
          id: string
          nome: string
          cidade: string
          estado: string
          foto_url: string | null
          verificado: boolean
          status: string
        } | null
      }>
    >()

  const { data: pendingClaims } = await supabase
    .from('paroquia_claims')
    .select(
      'id, status, role_solicitada, created_at, paroquia:paroquias(id, nome, cidade, estado, foto_url)',
    )
    .eq('user_id', user.id)
    .eq('status', 'pendente')
    .order('created_at', { ascending: false })
    .returns<
      Array<{
        id: string
        status: string
        role_solicitada: 'admin' | 'moderator'
        created_at: string
        paroquia: {
          id: string
          nome: string
          cidade: string
          estado: string
          foto_url: string | null
        } | null
      }>
    >()

  const activeMemberships = (memberships ?? []).filter(m => m.paroquia !== null)

  return (
    <div className="min-h-screen pb-24 relative">
      <div className="bg-glow" aria-hidden />
      <div className="max-w-3xl mx-auto relative z-10 px-4 md:px-8 pt-6">
        <Link
          href="/paroquias"
          className="inline-flex items-center gap-2 text-sm mb-4"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Igrejas
        </Link>

        <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
          <div className="flex items-center gap-3">
            <Church className="w-6 h-6" style={{ color: '#C9A84C' }} />
            <h1
              className="text-2xl md:text-3xl font-semibold"
              style={{ fontFamily: 'var(--font-elegant)', color: 'var(--text-primary)' }}
            >
              Minhas igrejas
            </h1>
          </div>
          <Link
            href="/paroquias/sugerir"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: 'linear-gradient(180deg, #C9A84C, #A88437)',
              color: '#0F0E0C',
              fontFamily: 'var(--font-body)',
            }}
          >
            <Plus className="w-4 h-4" /> Sugerir igreja
          </Link>
        </div>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
        >
          Igrejas onde você é administrador, moderador ou tem uma reivindicação em análise.
        </p>

        {activeMemberships.length === 0 && (!pendingClaims || pendingClaims.length === 0) && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(16,16,16,0.6)', border: '1px dashed rgba(201,168,76,0.15)' }}
          >
            <Church className="w-10 h-10 mx-auto mb-3" style={{ color: '#C9A84C', opacity: 0.4 }} />
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Você ainda não representa nenhuma igreja.
            </p>
            <Link
              href="/paroquias"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.15)',
                color: '#C9A84C',
                fontFamily: 'var(--font-body)',
              }}
            >
              Explorar igrejas
            </Link>
          </div>
        )}

        {activeMemberships.length > 0 && (
          <>
            <h2
              className="text-xs tracking-wider uppercase mb-3 mt-6"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
            >
              Onde você é representante
            </h2>
            <div className="space-y-3">
              {activeMemberships.map(m => (
                <Link
                  key={m.id}
                  href={`/paroquias/${m.paroquia!.id}/gerenciar`}
                  className="rounded-2xl p-4 flex items-center gap-4 transition-all hover:opacity-95 active:scale-[0.995]"
                  style={{ background: 'rgba(16,16,16,0.7)', border: '1px solid rgba(201,168,76,0.12)' }}
                >
                  {m.paroquia!.foto_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={m.paroquia!.foto_url}
                      alt={m.paroquia!.nome}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                      <Church className="w-6 h-6" style={{ color: '#C9A84C' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#F2EDE4', fontFamily: 'var(--font-body)' }}>
                      {m.paroquia!.nome}
                    </p>
                    <p className="text-xs" style={{ color: '#7A7368' }}>
                      {m.paroquia!.cidade}, {m.paroquia!.estado}
                      {!m.paroquia!.verificado && ' • Aguardando verificação'}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                    style={{
                      background: m.role === 'admin' ? 'rgba(107,29,42,0.18)' : 'rgba(201,168,76,0.08)',
                      color: m.role === 'admin' ? '#D94F5C' : '#C9A84C',
                    }}
                  >
                    {m.role === 'admin' ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {m.role === 'admin' ? 'Admin' : 'Moderador'}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        {pendingClaims && pendingClaims.length > 0 && (
          <>
            <h2
              className="text-xs tracking-wider uppercase mb-3 mt-8"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}
            >
              Reivindicações em análise
            </h2>
            <div className="space-y-3">
              {pendingClaims.filter(c => c.paroquia !== null).map(c => (
                <div
                  key={c.id}
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{ background: 'rgba(16,16,16,0.6)', border: '1px dashed rgba(201,168,76,0.18)' }}
                >
                  {c.paroquia!.foto_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={c.paroquia!.foto_url}
                      alt={c.paroquia!.nome}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 opacity-80"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(201,168,76,0.06)' }}>
                      <Church className="w-5 h-5" style={{ color: '#C9A84C', opacity: 0.6 }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: '#B8AFA2', fontFamily: 'var(--font-body)' }}>
                      {c.paroquia!.nome}
                    </p>
                    <p className="text-xs" style={{ color: '#7A7368' }}>
                      Pedido de {c.role_solicitada === 'admin' ? 'administrador' : 'moderador'} •
                      {' '}{new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Link
                    href={`/paroquias/${c.paroquia!.id}`}
                    className="text-xs underline flex-shrink-0"
                    style={{ color: '#C9A84C' }}
                  >
                    Ver igreja
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
