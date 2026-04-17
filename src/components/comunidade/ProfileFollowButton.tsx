'use client'

import { useState } from 'react'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'

interface Props {
  profileId: string
  initialFollowing: boolean
}

/**
 * Botão de Seguir/Seguindo com optimistic UI e rollback em erro.
 * Usado no header do PublicProfileView.
 */
export default function ProfileFollowButton({
  profileId,
  initialFollowing,
}: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    if (pending) return
    const willFollow = !following
    setFollowing(willFollow)
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/comunidade/follows/${profileId}`, {
        method: willFollow ? 'POST' : 'DELETE',
      })
      if (!res.ok) throw new Error('Falha ao atualizar')
    } catch (e) {
      setFollowing(!willFollow)
      setError(e instanceof Error ? e.message : 'Erro')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-[0.12em] disabled:opacity-60"
        style={{
          background: following
            ? 'rgba(16,16,16,0.78)'
            : 'linear-gradient(135deg, #C9A84C 0%, #A88B3A 100%)',
          border: following
            ? '1px solid rgba(201,168,76,0.35)'
            : '1px solid rgba(201,168,76,0.6)',
          color: following ? '#C9A84C' : '#0A0A0A',
          fontFamily: following ? 'Poppins, sans-serif' : 'Cinzel, serif',
        }}
      >
        {pending
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : following
            ? <UserMinus className="w-3.5 h-3.5" />
            : <UserPlus className="w-3.5 h-3.5" />}
        {following ? 'Seguindo' : 'Seguir'}
      </button>
      {error && (
        <span className="text-xs" style={{ color: '#D94F5C', fontFamily: 'Poppins, sans-serif' }}>
          {error}
        </span>
      )}
    </div>
  )
}
