'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, Loader2, Plus } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'
import IntencaoCard from '@/components/devocao/IntencaoCard'
import OferecerIntencaoSheet from '@/components/devocao/OferecerIntencaoSheet'
import { useAuth } from '@/contexts/AuthContext'
import type { IntencaoComSanto, IntencaoStatus } from '@/types/devocao'

const TABS: { value: IntencaoStatus | 'todas'; label: string }[] = [
  { value: 'aberta', label: 'Abertas' },
  { value: 'graca_recebida', label: 'Graças recebidas' },
  { value: 'arquivada', label: 'Arquivadas' },
]

export default function IntencoesPage() {
  return (
    <AuthGuard>
      <IntencoesInner />
    </AuthGuard>
  )
}

function IntencoesInner() {
  const { profile } = useAuth()
  const [intencoes, setIntencoes] = useState<IntencaoComSanto[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<IntencaoStatus | 'todas'>('aberta')
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = tab === 'todas' ? '' : `?status=${tab}`
      const res = await fetch(`/api/intencoes${qs}`, { cache: 'no-store' })
      if (res.ok) {
        const j = await res.json() as { intencoes: IntencaoComSanto[] }
        setIntencoes(j.intencoes ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { void load() }, [load])

  return (
    <main className="min-h-screen pb-24 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/perfil"
            className="inline-flex items-center gap-1 text-xs"
            style={{ color: 'rgba(242,237,228,0.6)', fontFamily: 'Poppins, sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Perfil
          </Link>
        </div>

        <header className="mb-6">
          <h1
            className="tracking-[0.05em]"
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: '#F2EDE4',
              fontSize: '1.75rem',
              fontWeight: 600,
            }}
          >
            Minhas Intenções
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'rgba(242,237,228,0.6)', fontFamily: 'Poppins, sans-serif' }}
          >
            Intenções que você ofereceu ao Senhor. Privadas — só você vê.
          </p>
        </header>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase mb-5 active:scale-[0.99] transition-transform"
          style={{
            background: '#C9A84C',
            color: '#0A0A0A',
            fontFamily: 'Cinzel, Georgia, serif',
          }}
        >
          <Plus className="w-4 h-4" />
          Nova intenção
        </button>

        <div
          className="flex gap-1 mb-4 p-1 rounded-xl overflow-x-auto"
          style={{ background: 'rgba(16,16,16,0.5)', border: '1px solid rgba(242,237,228,0.08)' }}
        >
          {TABS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className="flex-1 min-w-fit whitespace-nowrap py-2 px-3 rounded-lg text-xs"
              style={{
                background: tab === t.value ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: tab === t.value ? '#C9A84C' : 'rgba(242,237,228,0.6)',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: tab === t.value ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(201,168,76,0.6)' }} />
          </div>
        )}

        {!loading && intencoes.length === 0 && (
          <div
            className="text-center py-12 rounded-xl"
            style={{
              background: 'rgba(16,16,16,0.3)',
              border: '1px dashed rgba(242,237,228,0.1)',
              color: 'rgba(242,237,228,0.55)',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
            }}
          >
            <Heart className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(201,168,76,0.4)' }} />
            {tab === 'aberta'
              ? 'Nenhuma intenção em aberto. Toque em "Nova intenção" para começar.'
              : tab === 'graca_recebida'
                ? 'Você ainda não marcou intenções como graças recebidas.'
                : 'Nenhuma intenção arquivada.'}
          </div>
        )}

        {!loading && intencoes.length > 0 && (
          <div className="space-y-3">
            {intencoes.map(i => (
              <IntencaoCard key={i.id} intencao={i} onUpdate={load} />
            ))}
          </div>
        )}
      </div>

      <OferecerIntencaoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        santoId={profile?.santo_devocao_id ?? null}
        onCreated={load}
      />
    </main>
  )
}
