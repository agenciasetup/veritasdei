'use client'

import { useState } from 'react'
import { Copy, ExternalLink, Heart, QrCode, ShieldCheck } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import CartaView from './CartaView'
import EquipCartaButton from './EquipCartaButton'
import { RARIDADE_META, type CartaColecao } from '@/types/colecao'

// Detalhe completo de uma carta desbloqueada: a face grande + lore, autoridade
// doutrinária, recompensas e o botão de favoritar (vitrine do perfil).

export default function CartaDetailSheet({
  carta,
  open,
  onClose,
  onToggleFavorita,
}: {
  carta: CartaColecao | null
  open: boolean
  onClose: () => void
  onToggleFavorita?: (cartaId: string) => void
}) {
  const meta = carta ? RARIDADE_META[carta.raridade] : null
  const accent = carta?.cor_accent || meta?.cor || '#C9A84C'

  return (
    <Sheet open={open} onDismiss={onClose} label="Detalhe da carta" detents={[0.92]}>
      {carta && (
        <div className="flex flex-col items-center gap-5 px-4 pb-8">
          <CartaView carta={carta} width={300} serialNumber={carta.serial_number} />

          <div className="flex flex-wrap items-center justify-center gap-2">
            {onToggleFavorita && (
              <button
                type="button"
                onClick={() => onToggleFavorita(carta.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{
                  background: carta.favorita
                    ? 'rgba(214,79,92,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${carta.favorita ? 'rgba(214,79,92,0.4)' : 'rgba(242,237,228,0.1)'}`,
                  color: carta.favorita ? '#E0707D' : '#8A8378',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                <Heart
                  className="w-4 h-4"
                  style={{ fill: carta.favorita ? '#E0707D' : 'transparent' }}
                />
                {carta.favorita ? 'Favorita' : 'Favoritar'}
              </button>
            )}
            <EquipCartaButton cartaId={carta.id} />
          </div>

          <Certificado carta={carta} accent={accent} />

          <div className="w-full max-w-md space-y-4">
            {carta.autoridade_doutrinaria && (
              <Bloco
                titulo="Autoridade doutrinária"
                accent={accent}
                texto={carta.autoridade_doutrinaria}
              />
            )}
            {carta.efeito_simbolico && (
              <Bloco
                titulo="Efeito simbólico"
                accent={accent}
                texto={carta.efeito_simbolico}
              />
            )}
            {carta.recompensa.length > 0 && (
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.18em] mb-1"
                  style={{ color: accent, fontFamily: 'Poppins, sans-serif' }}
                >
                  Recompensa
                </p>
                <ul className="space-y-0.5">
                  {carta.recompensa.map((r, i) => (
                    <li
                      key={i}
                      className="text-sm"
                      style={{
                        color: '#C9C2B4',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      • {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {carta.lore && (
              <p
                className="text-sm italic leading-relaxed"
                style={{
                  color: '#9A9388',
                  fontFamily: 'Cormorant Garamond, serif',
                }}
              >
                “{carta.lore}”
              </p>
            )}
            {(carta.concilio || carta.virtude) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {carta.concilio && (
                  <Etiqueta texto={carta.concilio} accent={accent} />
                )}
                {carta.virtude && (
                  <Etiqueta texto={carta.virtude} accent={accent} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}

function Bloco({
  titulo,
  texto,
  accent,
}: {
  titulo: string
  texto: string
  accent: string
}) {
  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-[0.18em] mb-1"
        style={{ color: accent, fontFamily: 'Poppins, sans-serif' }}
      >
        {titulo}
      </p>
      <p
        className="text-sm leading-relaxed"
        style={{ color: '#C9C2B4', fontFamily: 'Poppins, sans-serif' }}
      >
        {texto}
      </p>
    </div>
  )
}

/**
 * Certificado de Autenticidade — bloco "NFT-style" mostrando o número de
 * série, o token público (link e QR) e o hash da assinatura. O usuário
 * pode copiar o link ou o token; qualquer pessoa com o link consegue
 * verificar a autenticidade em /c/<token>.
 */
function Certificado({
  carta,
  accent,
}: {
  carta: CartaColecao
  accent: string
}) {
  const [copiado, setCopiado] = useState<'link' | 'hash' | null>(null)
  const [verQr, setVerQr] = useState(false)

  const origem =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://veritasdei.com.br'
  const url = `${origem}/c/${carta.token}`

  async function copiar(texto: string, tipo: 'link' | 'hash') {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(tipo)
      setTimeout(() => setCopiado(null), 1600)
    } catch {
      // ignora — alguns navegadores embedded bloqueiam
    }
  }

  const data = new Date(carta.minted_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // QR via API pública sem dependências (libra um <img>); o conteúdo é o
  // próprio link público de verificação.
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&bgcolor=15120c&color=${encodeURIComponent(
    accent.replace('#', ''),
  )}&data=${encodeURIComponent(url)}`

  return (
    <div
      className="w-full max-w-md rounded-2xl p-4"
      style={{
        background:
          'linear-gradient(160deg, rgba(30,26,19,0.6) 0%, rgba(15,12,8,0.85) 100%)',
        border: `1px solid ${accent}33`,
        boxShadow: `inset 0 1px 0 ${accent}11`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4" style={{ color: accent }} />
        <h4
          className="uppercase tracking-[0.2em] text-[10px]"
          style={{ color: accent, fontFamily: 'Cinzel, serif' }}
        >
          Certificado de Autenticidade
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Linha label="Série" valor={`#${String(carta.serial_number).padStart(3, '0')}`} accent={accent} />
        <Linha label="Cunhada em" valor={data} accent={accent} />
      </div>

      <div className="space-y-2">
        <div>
          <p
            className="text-[9px] uppercase tracking-[0.18em] mb-1"
            style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
          >
            Token público
          </p>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(242,237,228,0.08)',
            }}
          >
            <code
              className="text-[12px] flex-1 truncate tabular-nums"
              style={{ color: '#E7DED1', fontFamily: 'monospace' }}
            >
              {carta.token}
            </code>
            <button
              type="button"
              onClick={() => copiar(url, 'link')}
              className="text-[10px] uppercase tracking-[0.1em] inline-flex items-center gap-1"
              style={{ color: accent, fontFamily: 'Poppins, sans-serif' }}
              aria-label="Copiar link de verificação"
            >
              <Copy className="w-3 h-3" />
              {copiado === 'link' ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={`/c/${carta.token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]"
            style={{
              background: `${accent}15`,
              border: `1px solid ${accent}55`,
              color: accent,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Página de verificação
          </a>
          <button
            type="button"
            onClick={() => setVerQr((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(242,237,228,0.1)',
              color: '#C9C2B4',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <QrCode className="w-3.5 h-3.5" />
            {verQr ? 'Ocultar QR' : 'Mostrar QR'}
          </button>
        </div>

        {verQr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrSrc}
            alt={`QR code do certificado ${carta.token}`}
            width={220}
            height={220}
            className="mx-auto mt-3 rounded-lg"
            style={{ border: `1px solid ${accent}33` }}
          />
        )}

        <details className="mt-2">
          <summary
            className="text-[10px] uppercase tracking-[0.18em] cursor-pointer select-none"
            style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif' }}
          >
            Detalhes técnicos
          </summary>
          <div className="mt-2 space-y-1.5">
            <div>
              <p
                className="text-[9px] uppercase tracking-[0.18em] mb-1"
                style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif' }}
              >
                Hash HMAC-SHA256
              </p>
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(242,237,228,0.06)',
                }}
              >
                <code
                  className="text-[10px] flex-1 break-all"
                  style={{ color: '#9A9388', fontFamily: 'monospace' }}
                >
                  {carta.signature}
                </code>
                <button
                  type="button"
                  onClick={() => copiar(carta.signature, 'hash')}
                  className="text-[10px] uppercase tracking-[0.1em] inline-flex items-center gap-1 flex-shrink-0"
                  style={{ color: accent, fontFamily: 'Poppins, sans-serif' }}
                  aria-label="Copiar hash"
                >
                  <Copy className="w-3 h-3" />
                  {copiado === 'hash' ? 'Ok' : ''}
                </button>
              </div>
            </div>
            <p
              className="text-[10px] italic mt-2"
              style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif' }}
            >
              A assinatura é gerada por um segredo do servidor sobre seu ID,
              o ID da carta, o número de série e a data de cunhagem. Sem o
              segredo, ninguém consegue forjá-la — qualquer pessoa pode
              verificar abrindo o link público acima.
            </p>
          </div>
        </details>
      </div>
    </div>
  )
}

function Linha({
  label,
  valor,
  accent,
}: {
  label: string
  valor: string
  accent: string
}) {
  return (
    <div>
      <p
        className="text-[9px] uppercase tracking-[0.18em] mb-1"
        style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </p>
      <p
        className="text-[13px] tabular-nums"
        style={{
          color: '#F2EDE4',
          fontFamily: 'Cinzel, serif',
          textShadow: `0 0 8px ${accent}22`,
        }}
      >
        {valor}
      </p>
    </div>
  )
}

function Etiqueta({ texto, accent }: { texto: string; accent: string }) {
  return (
    <span
      className="px-2.5 py-1 rounded-lg text-[11px]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${accent}33`,
        color: '#9A9388',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {texto}
    </span>
  )
}
