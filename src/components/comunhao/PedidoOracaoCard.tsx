'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Hand, Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import BotaoReportar from './BotaoReportar'
import PedidoOracaoSheet from './PedidoOracaoSheet'
import type { PedidoOracaoPublico } from '@/types/comunhao'

interface Props {
  pedido: PedidoOracaoPublico & {
    ja_rezou?: boolean
    is_mine?: boolean
    santo_nome?: string | null
    santo_slug?: string | null
  }
  onChanged?: () => void
}

export default function PedidoOracaoCard({ pedido, onChanged }: Props) {
  const [rezou, setRezou] = useState(Boolean(pedido.ja_rezou))
  const [totalRezas, setTotalRezas] = useState(pedido.total_rezas)
  const [saving, setSaving] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/pedidos-oracao?id=${encodeURIComponent(pedido.id)}`, {
        method: 'DELETE',
      })
      if (res.ok) onChanged?.()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
      setMenuOpen(false)
    }
  }

  async function toggleRezei() {
    if (saving) return
    setSaving(true)
    const prevRezou = rezou
    const prevTotal = totalRezas
    // Optimistic
    setRezou(!prevRezou)
    setTotalRezas(prevRezou ? prevTotal - 1 : prevTotal + 1)
    try {
      const res = await fetch('/api/pedidos-oracao/rezei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido_id: pedido.id }),
      })
      if (!res.ok) throw new Error(String(res.status))
      onChanged?.()
    } catch {
      // Rollback
      setRezou(prevRezou)
      setTotalRezas(prevTotal)
    } finally {
      setSaving(false)
    }
  }

  const autorDisplay = pedido.anonimo
    ? 'Um irmão pede oração'
    : pedido.autor_nome || 'Um irmão pede oração'

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(16,16,16,0.6)',
        border: '1px solid rgba(242,237,228,0.1)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {!pedido.anonimo && pedido.autor_avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pedido.autor_avatar}
            alt=""
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ background: 'rgba(242,237,228,0.1)' }}
          />
        )}
        <span
          className="text-xs truncate flex-1"
          style={{ color: 'rgba(242,237,228,0.8)', fontFamily: 'Poppins, sans-serif' }}
        >
          {autorDisplay}
          {pedido.is_mine && (
            <span
              className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
              style={{
                background: 'rgba(201,168,76,0.15)',
                color: 'rgba(201,168,76,0.9)',
              }}
            >
              meu pedido
            </span>
          )}
        </span>
        {pedido.is_mine && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Opções"
              className="p-1 rounded hover:bg-[rgba(242,237,228,0.06)]"
              style={{ color: 'rgba(242,237,228,0.55)' }}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Fechar menu"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-10"
                  style={{ background: 'transparent' }}
                />
                <div
                  className="absolute right-0 top-7 z-20 min-w-[140px] rounded-lg overflow-hidden"
                  style={{
                    background: 'rgba(20,20,20,0.98)',
                    border: '1px solid rgba(242,237,228,0.12)',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => { setEditOpen(true); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[rgba(242,237,228,0.05)]"
                    style={{ color: 'rgba(242,237,228,0.85)', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[rgba(180,40,40,0.12)]"
                    style={{ color: 'rgb(220,140,140)', fontFamily: 'Poppins, sans-serif' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Apagar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p
        className="whitespace-pre-wrap text-sm mb-3"
        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', lineHeight: 1.55 }}
      >
        {pedido.texto}
      </p>

      {pedido.santo_slug && pedido.santo_nome && (
        <div className="mb-3">
          <Link
            href={`/santos/${pedido.santo_slug}`}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(201,168,76,0.1)',
              color: 'rgba(201,168,76,0.85)',
              fontFamily: 'Poppins, sans-serif',
              textDecoration: 'none',
            }}
          >
            Pela intercessão de {pedido.santo_nome}
          </Link>
        </div>
      )}

      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid rgba(242,237,228,0.06)' }}
      >
        <button
          type="button"
          onClick={toggleRezei}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors active:scale-95"
          style={{
            background: rezou ? 'rgba(201,168,76,0.18)' : 'rgba(242,237,228,0.05)',
            border: `1px solid ${rezou ? 'rgba(201,168,76,0.45)' : 'rgba(242,237,228,0.1)'}`,
            color: rezou ? '#C9A84C' : 'rgba(242,237,228,0.75)',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 500,
          }}
        >
          {saving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Hand className="w-3 h-3" />
          )}
          {rezou ? 'Rezei por sua intenção' : 'Rezar por esta intenção'}
          {totalRezas > 0 && (
            <span
              style={{
                color: rezou ? '#C9A84C' : 'rgba(242,237,228,0.55)',
                fontWeight: 600,
              }}
            >
              · {totalRezas}
            </span>
          )}
        </button>

        <BotaoReportar conteudoTipo="pedido_oracao" conteudoId={pedido.id} />
      </div>

      {confirmDelete && (
        <div
          className="mt-3 rounded-lg p-3 flex items-center gap-2"
          style={{
            background: 'rgba(180,40,40,0.1)',
            border: '1px solid rgba(180,40,40,0.3)',
          }}
        >
          <span
            className="text-xs flex-1"
            style={{ color: 'rgba(242,237,228,0.85)', fontFamily: 'Poppins, sans-serif' }}
          >
            Apagar este pedido?
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-[11px] px-2.5 py-1 rounded inline-flex items-center gap-1"
            style={{
              background: 'rgba(180,40,40,0.25)',
              color: 'rgb(230,160,160)',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
            }}
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Apagar
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-[11px] px-2 py-1"
            style={{ color: 'rgba(242,237,228,0.55)', fontFamily: 'Poppins, sans-serif' }}
          >
            Cancelar
          </button>
        </div>
      )}

      <PedidoOracaoSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        editPedidoId={pedido.id}
        initialTexto={pedido.texto}
        initialAnonimo={pedido.anonimo}
        onCreated={onChanged}
      />
    </div>
  )
}
