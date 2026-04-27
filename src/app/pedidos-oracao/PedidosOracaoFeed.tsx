'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Hand, Loader2, Plus } from 'lucide-react'
import PedidoOracaoCard from '@/components/comunhao/PedidoOracaoCard'
import PedidoOracaoSheet from '@/components/comunhao/PedidoOracaoSheet'
import { useAuth } from '@/contexts/AuthContext'
import type { PedidoOracaoPublico } from '@/types/comunhao'

export default function PedidosOracaoFeed({ santoId, santoNome }: { santoId?: string; santoNome?: string }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [pedidos, setPedidos] = useState<(PedidoOracaoPublico & { ja_rezou?: boolean; is_mine?: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = santoId ? `?santo_id=${encodeURIComponent(santoId)}` : ''
      const res = await fetch(`/api/pedidos-oracao${qs}`, { cache: 'no-store' })
      if (res.ok) {
        const j = await res.json() as { pedidos: (PedidoOracaoPublico & { ja_rezou?: boolean; is_mine?: boolean })[] }
        setPedidos(j.pedidos ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [santoId])

  useEffect(() => { void load() }, [load])

  function handlePedir() {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setSheetOpen(true)
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePedir}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium mb-4 active:scale-[0.99] transition-transform"
        style={{
          background: 'rgba(201,168,76,0.14)',
          color: '#C9A84C',
          fontFamily: 'Poppins, sans-serif',
          border: '1px solid rgba(201,168,76,0.35)',
        }}
      >
        <Plus className="w-4 h-4" />
        Pedir oração
      </button>

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(201,168,76,0.6)' }} />
        </div>
      )}

      {!loading && pedidos.length === 0 && (
        <div
          className="text-center py-10 rounded-xl"
          style={{
            background: 'rgba(16,16,16,0.3)',
            border: '1px dashed rgba(242,237,228,0.1)',
            color: 'rgba(242,237,228,0.55)',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.85rem',
          }}
        >
          <Hand className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(201,168,76,0.4)' }} />
          {santoNome
            ? `Seja o primeiro a pedir oração pela intercessão de ${santoNome.split(' ').slice(0, 3).join(' ')}.`
            : 'Nenhum pedido ainda. Seja o primeiro.'}
        </div>
      )}

      {!loading && pedidos.length > 0 && (
        <div className="space-y-3">
          {pedidos.map(p => (
            <PedidoOracaoCard key={p.id} pedido={p} onChanged={load} />
          ))}
        </div>
      )}

      <PedidoOracaoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        santoId={santoId ?? null}
        santoNome={santoNome}
        onCreated={load}
      />
    </div>
  )
}
