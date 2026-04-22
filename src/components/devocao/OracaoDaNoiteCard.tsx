'use client'

import { useEffect, useState } from 'react'
import { Moon, Star } from 'lucide-react'

/**
 * Card que aparece APENAS durante a noite (22h–5h local) — Completas
 * tradicionais da Igreja. Oração ao Anjo da Guarda em versão curta.
 *
 * Doutrinalmente ortodoxo: Completas são oração oficial da Igreja
 * (Liturgia das Horas) para o fim do dia. Oração ao Anjo da Guarda é
 * devoção tradicional aprovada (CIC §336).
 *
 * Respeita prefers-reduced-motion.
 */
export default function OracaoDaNoiteCard() {
  const [ehNoite, setEhNoite] = useState(false)

  useEffect(() => {
    function check() {
      const h = new Date().getHours()
      setEhNoite(h >= 22 || h < 5)
    }
    check()
    // Re-checa a cada 10 min (caso o user deixe o app aberto passando da virada)
    const interval = setInterval(check, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (!ehNoite) return null

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 75% 25%, rgba(74,111,165,0.28) 0%, transparent 55%), linear-gradient(140deg, rgba(10,10,25,0.85) 0%, rgba(16,16,30,0.92) 55%, rgba(10,10,18,0.95) 100%)',
        border: '1px solid rgba(74,111,165,0.35)',
      }}
    >
      {/* Estrelas decorativas */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <span className="noite-star noite-star-1" />
        <span className="noite-star noite-star-2" />
        <span className="noite-star noite-star-3" />
        <span className="noite-star noite-star-4" />
      </div>

      <div className="relative flex items-center gap-2 mb-3">
        <Moon className="w-4 h-4" style={{ color: 'rgba(180,200,235,0.9)' }} />
        <div
          style={{
            fontFamily: 'Poppins, sans-serif',
            color: 'rgba(180,200,235,0.85)',
            fontSize: '0.7rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Noite · Oração do fim do dia
        </div>
      </div>

      <div
        className="relative whitespace-pre-wrap text-center px-2"
        style={{
          fontFamily: 'Cinzel, Georgia, serif',
          color: 'rgba(242,237,228,0.88)',
          fontSize: '0.92rem',
          lineHeight: 1.75,
          fontStyle: 'italic',
        }}
      >
        {`Santo Anjo do Senhor,
meu zeloso guardador,
já que a ti me confiou a piedade divina,
sempre me rege, me guarde, me governe, me ilumine.
Amém.`}
      </div>

      <div
        className="relative mt-4 text-[10px] text-center italic"
        style={{
          color: 'rgba(180,200,235,0.55)',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        Que anjos santos velem por seu sono.
      </div>

      <style jsx>{`
        .noite-star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(200, 220, 255, 0.9);
          box-shadow: 0 0 4px rgba(200, 220, 255, 0.7);
          opacity: 0;
          animation: noite-twinkle 5s ease-in-out infinite;
        }
        .noite-star-1 { top: 15%; left: 12%; animation-delay: 0s; }
        .noite-star-2 { top: 25%; left: 85%; animation-delay: 1.5s; }
        .noite-star-3 { top: 70%; left: 8%;  animation-delay: 3s; }
        .noite-star-4 { top: 82%; left: 92%; animation-delay: 2s; }

        @keyframes noite-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.4); }
        }

        @media (prefers-reduced-motion: reduce) {
          .noite-star { animation: none; opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
