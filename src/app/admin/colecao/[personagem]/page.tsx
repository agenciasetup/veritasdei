'use client'

/**
 * /admin/colecao/[personagem] — gestão das cartas de um personagem da Coleção.
 *
 * Lista as cartas (com preview), abre o <CartaEditor> para criar/editar e
 * permite excluir. O editor traz o construtor visual de regras e o preview
 * ao vivo. Acesso gateado por AdminLayout (role=admin) + RLS.
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCodexCatalogo } from '@/lib/colecao/useCodexCatalog'
import CartaView from '@/components/colecao/CartaView'
import CartaEditor from '@/components/admin/colecao/CartaEditor'
import type { Carta, Personagem } from '@/types/colecao'

export default function AdminPersonagemCartasPage() {
  const params = useParams<{ personagem: string }>()
  const slug = params?.personagem
  const catalogo = useCodexCatalogo()

  const [personagem, setPersonagem] = useState<Personagem | null>(null)
  const [cartas, setCartas] = useState<Carta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Carta | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    if (!supabase || !slug) return
    setLoading(true)
    const { data: pers, error: pErr } = await supabase
      .from('personagens')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
    if (pErr || !pers) {
      setError(pErr?.message ?? 'Personagem não encontrado.')
      setLoading(false)
      return
    }
    setPersonagem(pers as Personagem)
    const { data: cs, error: cErr } = await supabase
      .from('cartas')
      .select('*')
      .eq('personagem_id', (pers as Personagem).id)
      .order('ordem')
    if (cErr) setError(cErr.message)
    else setCartas((cs as Carta[]) ?? [])
    setLoading(false)
  }, [slug])

  useEffect(() => {
    queueMicrotask(() => void load())
  }, [load])

  async function remove(c: Carta) {
    const supabase = createClient()
    if (!supabase) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Excluir a carta "${c.nome}" definitivamente?`)
    ) {
      return
    }
    const { error: e } = await supabase.from('cartas').delete().eq('id', c.id)
    if (e) setError(e.message)
    else await load()
  }

  function onSaved() {
    setEditing(null)
    setCreating(false)
    void load()
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/admin/colecao"
        className="inline-flex items-center gap-2 text-sm mb-4"
        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar aos personagens
      </Link>

      {loading && !personagem ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#C9A84C' }} />
        </div>
      ) : !personagem ? (
        <p className="text-sm" style={{ color: '#D64F5C' }}>
          {error ?? 'Personagem não encontrado.'}
        </p>
      ) : (
        <>
          <header className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1
                className="text-xl font-bold"
                style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
              >
                {personagem.nome}
              </h1>
              <p
                className="text-xs"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                {cartas.length} carta(s) · {personagem.total_cartas} publicada(s)
              </p>
            </div>
            {!creating && !editing && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm flex-shrink-0"
                style={{
                  background: '#C9A84C',
                  color: '#0F0E0C',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                }}
              >
                <Plus className="w-4 h-4" />
                Nova carta
              </button>
            )}
          </header>

          {error && (
            <div
              className="mb-4 p-3 rounded-xl text-sm"
              style={{
                background: 'rgba(214,79,92,0.12)',
                border: '1px solid rgba(214,79,92,0.3)',
                color: '#D64F5C',
              }}
            >
              {error}
            </div>
          )}

          {(creating || editing) && (
            <CartaEditor
              personagemId={personagem.id}
              carta={editing}
              catalogo={catalogo}
              proximaOrdem={(cartas.at(-1)?.ordem ?? -1) + 1}
              onSaved={onSaved}
              onCancel={() => {
                setEditing(null)
                setCreating(false)
              }}
            />
          )}

          {!creating && !editing && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cartas.map((c) => (
                <div key={c.id} className="flex flex-col gap-2">
                  <CartaView carta={c} width={200} />
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-[10px] uppercase tracking-wide truncate"
                      style={{
                        color:
                          c.status === 'publicado' ? '#66BB6A' : '#8A8378',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {c.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        aria-label="Editar carta"
                        className="p-1.5 rounded-lg"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: '#C9A84C',
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c)}
                        aria-label="Excluir carta"
                        className="p-1.5 rounded-lg"
                        style={{
                          background: 'rgba(214,79,92,0.1)',
                          color: '#D64F5C',
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cartas.length === 0 && (
                <div
                  className="col-span-full rounded-2xl p-8 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(201,168,76,0.2)',
                  }}
                >
                  <p
                    className="text-sm"
                    style={{
                      color: '#8A8378',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    Nenhuma carta ainda. Crie a primeira variação.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
