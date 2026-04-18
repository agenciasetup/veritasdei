'use client'

import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useHaptic } from '@/hooks/useHaptic'
import { createClient } from '@/lib/supabase/client'

/**
 * Botão de favoritar oração — coração dourado, toggle otimista.
 *
 * Persistência: tabela `prayer_favorites` (RLS por user_id, criada
 * no Sprint 1). Toggle via supabase client direto — RLS garante que
 * só o próprio usuário escreve na sua linha.
 *
 * Não-logado → redireciona pra /login com ?redirect preservado.
 * Estado inicial vem de `initiallyFavorited` (server-side).
 */
export default function FavoriteButton({
  itemId,
  initiallyFavorited,
}: {
  itemId: string
  initiallyFavorited: boolean
}) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const haptic = useHaptic()
  const [fav, setFav] = useState(initiallyFavorited)
  const [pending, startTransition] = useTransition()

  // Sincroniza se prop mudar (ex: navegação entre orações)
  useEffect(() => {
    setFav(initiallyFavorited)
  }, [initiallyFavorited])

  const handleClick = async () => {
    if (!isAuthenticated || !user) {
      const current = typeof window !== 'undefined' ? window.location.pathname : '/'
      router.push(`/login?redirect=${encodeURIComponent(current)}`)
      return
    }

    const next = !fav
    setFav(next) // otimista
    haptic.pulse(next ? 'complete' : 'tap')

    startTransition(async () => {
      const supabase = createClient()
      if (!supabase) {
        setFav(!next) // reverte
        return
      }
      if (next) {
        const { error } = await supabase
          .from('prayer_favorites')
          .insert({ user_id: user.id, item_id: itemId })
        if (error && error.code !== '23505' /* unique violation */) {
          setFav(!next)
        }
      } else {
        const { error } = await supabase
          .from('prayer_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId)
        if (error) setFav(!next)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={fav}
      aria-label={fav ? 'Remover dos favoritos' : 'Favoritar oração'}
      className="inline-flex items-center justify-center rounded-full w-9 h-9 transition-all active:scale-90 disabled:opacity-60"
      style={{
        background: fav ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${fav ? 'rgba(201,168,76,0.45)' : 'rgba(201,168,76,0.15)'}`,
      }}
    >
      <Heart
        className="w-4 h-4"
        fill={fav ? 'var(--gold)' : 'transparent'}
        style={{ color: fav ? 'var(--gold)' : 'var(--text-secondary)' }}
        strokeWidth={fav ? 0 : 2}
      />
    </button>
  )
}
