'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Feather, Loader2, Plus, Trash2 } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'
import CartaSantoSheet from '@/components/comunhao/CartaSantoSheet'
import { useAuth } from '@/contexts/AuthContext'
import type { CartaSantoComSanto } from '@/types/comunhao'

export default function CartasPage() {
  return (
    <AuthGuard>
      <CartasInner />
    </AuthGuard>
  )
}

function CartasInner() {
  const { profile } = useAuth()
  const [cartas, setCartas] = useState<CartaSantoComSanto[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [santoName, setSantoName] = useState<string | undefined>(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cartas', { cache: 'no-store' })
      if (res.ok) {
        const j = await res.json() as { cartas: CartaSantoComSanto[] }
        setCartas(j.cartas ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Busca nome do santo de devoção pra passar ao sheet (placeholder)
  useEffect(() => {
    if (!profile?.santo_devocao_id) return
    fetch(`/api/santos/buscar?top=1`, { cache: 'force-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        const s = j?.santos?.find((x: { id: string; nome: string }) => x.id === profile.santo_devocao_id)
        if (s) setSantoName(s.nome)
      })
      .catch(() => {})
  }, [profile?.santo_devocao_id])

  async function remove(id: string) {
    if (!confirm('Apagar esta carta?')) return
    setDeleting(id)
    try {
      await fetch(`/api/cartas?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      await load()
    } finally {
      setDeleting(null)
    }
  }

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
            Cartas ao Santo
          </h1>
          <p
            className="text-sm mt-1 italic"
            style={{ color: 'rgba(242,237,228,0.65)', fontFamily: 'Cormorant Garamond, serif', fontSize: '0.9rem' }}
          >
            Tradição de Santa Teresinha — diálogo epistolar de devoção. Privado, só você vê.
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
          Nova carta
        </button>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(201,168,76,0.6)' }} />
          </div>
        )}

        {!loading && cartas.length === 0 && (
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
            <Feather className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgba(201,168,76,0.4)' }} />
            Ainda não há cartas. Comece uma tocando em &ldquo;Nova carta&rdquo;.
          </div>
        )}

        {!loading && cartas.length > 0 && (
          <div className="space-y-3">
            {cartas.map(c => (
              <article
                key={c.id}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(16,16,16,0.5)',
                  border: '1px solid rgba(242,237,228,0.1)',
                }}
              >
                {c.santo && (
                  <Link
                    href={`/santos/${c.santo.slug}`}
                    className="inline-flex items-center gap-1.5 text-[11px] mb-2 px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(201,168,76,0.1)',
                      color: 'rgba(201,168,76,0.85)',
                      fontFamily: 'Poppins, sans-serif',
                      textDecoration: 'none',
                    }}
                  >
                    a {c.santo.nome}
                  </Link>
                )}
                <div
                  className="whitespace-pre-wrap italic"
                  style={{
                    color: '#F2EDE4',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '0.95rem',
                    lineHeight: 1.65,
                  }}
                >
                  {c.texto}
                </div>
                <div
                  className="flex items-center justify-between mt-3 pt-2 text-[11px]"
                  style={{
                    color: 'rgba(242,237,228,0.45)',
                    fontFamily: 'Poppins, sans-serif',
                    borderTop: '1px solid rgba(242,237,228,0.06)',
                  }}
                >
                  <span>
                    {new Date(c.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    disabled={deleting === c.id}
                    className="inline-flex items-center gap-1 hover:opacity-100 opacity-60 transition-opacity"
                    aria-label="Apagar carta"
                  >
                    {deleting === c.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <CartaSantoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        santoId={profile?.santo_devocao_id ?? null}
        santoNome={santoName}
        onCreated={load}
      />
    </main>
  )
}
