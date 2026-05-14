'use client'

/**
 * InviteCard — mecanismo real de convite. Antes a dashboard só tinha
 * "pessoas pra seguir" (vazio pra quase todo mundo). Aqui o usuário
 * compartilha o app de verdade: navigator.share quando disponível,
 * fallback pra copiar o link.
 *
 * É o motor de crescimento — fica sempre visível, não depende de ter rede.
 */

import { useState } from 'react'
import { Check, Share2, UserPlus } from 'lucide-react'

const SHARE_TEXT =
  'Estou estudando a fé católica a fundo no Veritas Educa — trilhas de doutrina, rosário e liturgia num lugar só. Vem comigo:'

export default function InviteCard({
  compact = false,
}: {
  compact?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function handleInvite() {
    const url =
      typeof window !== 'undefined' ? window.location.origin : ''
    const shareData = {
      title: 'Veritas Educa',
      text: SHARE_TEXT,
      url,
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(shareData)
        return
      }
    } catch {
      // usuário cancelou o share nativo — não trata como erro
      return
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      /* silencioso */
    }
  }

  return (
    <div
      className="h-full rounded-[24px] p-6 lg:p-7 flex flex-col"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid rgba(201,168,76,0.2)',
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <UserPlus
          className="w-5 h-5"
          style={{ color: 'var(--accent)' }}
          strokeWidth={1.6}
        />
      </div>

      <p
        className="text-lg mt-3 leading-tight"
        style={{
          color: 'var(--text-1)',
          fontFamily: 'var(--font-elegant)',
          fontWeight: 500,
        }}
      >
        Convide um irmão na fé
      </p>
      {!compact && (
        <p
          className="text-xs mt-1.5"
          style={{ color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}
        >
          Estudar a fé é melhor acompanhado. Chame alguém pra crescer com
          você — e mantenham a sequência juntos.
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleInvite()}
        className="mt-auto pt-5 inline-flex items-center gap-2 text-sm self-start"
        style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Link copiado
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            Compartilhar convite
          </>
        )}
      </button>
    </div>
  )
}
