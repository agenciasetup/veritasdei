'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Archive, Heart, Loader2, Sparkles, Share2, EyeOff } from 'lucide-react'
import type { IntencaoComSanto } from '@/types/devocao'

// A intenção pode vir do banco com `compartilhada_publicamente` — o tipo
// base não inclui ainda, mas fazemos cast abaixo quando necessário.

export default function IntencaoCard({
  intencao,
  onUpdate,
}: {
  intencao: IntencaoComSanto
  onUpdate?: () => void
}) {
  const [working, setWorking] = useState<'graca' | 'arquiva' | null>(null)
  const [reflexao, setReflexao] = useState(intencao.reflexao_graca ?? '')
  const [showReflexao, setShowReflexao] = useState(false)

  async function marcarGraca() {
    if (working) return
    setWorking('graca')
    try {
      await fetch('/api/intencoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: intencao.id,
          status: 'graca_recebida',
          reflexao_graca: reflexao.trim() || null,
        }),
      })
      onUpdate?.()
    } finally {
      setWorking(null)
    }
  }

  async function arquivar() {
    if (working) return
    setWorking('arquiva')
    try {
      await fetch('/api/intencoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: intencao.id, status: 'arquivada' }),
      })
      onUpdate?.()
    } finally {
      setWorking(null)
    }
  }

  const isGraca = intencao.status === 'graca_recebida'
  const isArquivada = intencao.status === 'arquivada'

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: isGraca ? 'rgba(201,168,76,0.08)' : 'rgba(16,16,16,0.5)',
        border: isGraca ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(242,237,228,0.1)',
        opacity: isArquivada ? 0.6 : 1,
      }}
    >
      {intencao.santo && (
        <Link
          href={`/santos/${intencao.santo.slug}`}
          className="flex items-center gap-2 mb-2 text-xs"
          style={{
            color: 'rgba(201,168,76,0.85)',
            fontFamily: 'Poppins, sans-serif',
            textDecoration: 'none',
          }}
        >
          <Heart className="w-3 h-3" />
          {intencao.santo.nome}
        </Link>
      )}

      <p
        className="whitespace-pre-wrap text-sm"
        style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif', lineHeight: 1.5 }}
      >
        {intencao.texto}
      </p>

      {isGraca && intencao.reflexao_graca && (
        <div
          className="mt-3 pt-3 border-t"
          style={{ borderColor: 'rgba(201,168,76,0.2)' }}
        >
          <div
            className="flex items-center gap-1.5 mb-1 text-[11px]"
            style={{
              color: 'rgba(201,168,76,0.9)',
              fontFamily: 'Poppins, sans-serif',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            <Sparkles className="w-3 h-3" />
            Graça recebida
          </div>
          <p
            className="text-xs italic"
            style={{ color: 'rgba(242,237,228,0.8)', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.55 }}
          >
            {intencao.reflexao_graca}
          </p>
        </div>
      )}

      {isGraca && (
        <div
          className="mt-3 text-[10px] italic"
          style={{ color: 'rgba(242,237,228,0.45)', fontFamily: 'Poppins, sans-serif' }}
        >
          Testemunho pessoal. A Igreja reconhece milagres por processo canônico formal.
        </div>
      )}

      {isGraca && <CompartilharToggle intencao={intencao} onUpdate={onUpdate} />}

      <div
        className="flex items-center justify-between mt-3 pt-2 text-[10px]"
        style={{
          color: 'rgba(242,237,228,0.45)',
          fontFamily: 'Poppins, sans-serif',
          borderTop: '1px solid rgba(242,237,228,0.06)',
        }}
      >
        <span>
          {new Date(intencao.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>
        {intencao.status === 'aberta' && (
          <div className="flex items-center gap-2">
            {showReflexao ? (
              <div className="flex flex-col gap-2 w-full">
                <textarea
                  value={reflexao}
                  onChange={e => setReflexao(e.target.value.slice(0, 500))}
                  placeholder="Reflexão sobre a graça recebida (opcional)"
                  rows={2}
                  className="w-full px-2 py-1.5 rounded-lg text-xs resize-none"
                  style={{
                    background: 'rgba(10,10,10,0.5)',
                    border: '1px solid rgba(242,237,228,0.12)',
                    color: '#F2EDE4',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={marcarGraca}
                    disabled={working !== null}
                    className="flex-1 py-1.5 rounded-lg text-[11px]"
                    style={{ background: '#C9A84C', color: '#0A0A0A', fontFamily: 'Poppins, sans-serif', fontWeight: 600 }}
                  >
                    {working === 'graca' ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Confirmar graça'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReflexao(false)}
                    className="py-1.5 px-2 rounded-lg text-[11px]"
                    style={{ background: 'rgba(242,237,228,0.08)', color: 'rgba(242,237,228,0.7)', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowReflexao(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px]"
                  style={{
                    background: 'rgba(201,168,76,0.12)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <Check className="w-3 h-3" />
                  Graça recebida
                </button>
                <button
                  type="button"
                  onClick={arquivar}
                  disabled={working !== null}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px]"
                  style={{
                    background: 'rgba(242,237,228,0.05)',
                    color: 'rgba(242,237,228,0.55)',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <Archive className="w-3 h-3" />
                  Arquivar
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function CompartilharToggle({
  intencao,
  onUpdate,
}: {
  intencao: IntencaoComSanto
  onUpdate?: () => void
}) {
  const compartilhada = Boolean(
    (intencao as IntencaoComSanto & { compartilhada_publicamente?: boolean }).compartilhada_publicamente,
  )
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    if (working) return
    setWorking(true)
    setError(null)
    try {
      const res = await fetch('/api/gracas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intencao_id: intencao.id,
          compartilhada_publicamente: !compartilhada,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null) as { error?: string } | null
        throw new Error(j?.error ?? String(res.status))
      }
      onUpdate?.()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro'
      if (msg === 'reflexao_required') {
        setError('Escreva uma reflexão antes de compartilhar.')
      } else {
        setError('Não foi possível compartilhar.')
      }
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        disabled={working}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors"
        style={{
          background: compartilhada ? 'rgba(201,168,76,0.18)' : 'rgba(242,237,228,0.05)',
          border: `1px solid ${compartilhada ? 'rgba(201,168,76,0.4)' : 'rgba(242,237,228,0.1)'}`,
          color: compartilhada ? '#C9A84C' : 'rgba(242,237,228,0.75)',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {working ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : compartilhada ? (
          <EyeOff className="w-3 h-3" />
        ) : (
          <Share2 className="w-3 h-3" />
        )}
        {compartilhada ? 'Compartilhada · tornar privada' : 'Compartilhar com a comunidade'}
      </button>
      {error && (
        <div
          className="mt-1 text-[11px]"
          style={{ color: 'rgb(220,140,140)', fontFamily: 'Poppins, sans-serif' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
