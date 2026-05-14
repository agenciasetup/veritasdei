'use client'

import { Heart } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import CartaView from './CartaView'
import { RARIDADE_META, type CartaColecao } from '@/types/codex'

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
          <CartaView carta={carta} showDetails width={300} />

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
              {carta.favorita ? 'Na vitrine do perfil' : 'Destacar no perfil'}
            </button>
          )}

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
