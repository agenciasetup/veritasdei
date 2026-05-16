'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

/**
 * Botão "Equipar como vitrine" — chama o RPC `fn_equipar_carta`, que valida
 * ownership no servidor antes de salvar `user_gamification.equipped_carta_id`.
 * A carta equipada aparece como chip ao lado do nome do usuário (perfil,
 * comunidade, jornada).
 */
export default function EquipCartaButton({ cartaId }: { cartaId: string }) {
  const { user } = useAuth()
  const [equipada, setEquipada] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const supabase = createClient()
    if (!supabase) return
    void supabase
      .from('user_gamification')
      .select('equipped_carta_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then((res: { data: { equipped_carta_id: string | null } | null }) => {
        setEquipada(res.data?.equipped_carta_id === cartaId)
      })
  }, [user?.id, cartaId])

  if (!user?.id) return null

  async function alternar() {
    if (loading) return
    setLoading(true)
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }
    const proxima = !equipada
    const { error } = await supabase.rpc('fn_equipar_carta', {
      p_carta_id: proxima ? cartaId : null,
    })
    if (!error) setEquipada(proxima)
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={loading || equipada === null}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
      style={{
        background: equipada
          ? 'rgba(201,168,76,0.15)'
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${equipada ? 'rgba(201,168,76,0.5)' : 'rgba(242,237,228,0.1)'}`,
        color: equipada ? '#C9A84C' : '#8A8378',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <Sparkles
        className="w-4 h-4"
        style={{ fill: equipada ? '#C9A84C' : 'transparent' }}
      />
      {equipada ? 'Na vitrine do perfil' : 'Mostrar no perfil'}
    </button>
  )
}
