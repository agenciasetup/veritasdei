'use client'

/**
 * Overlay sutil de "presença" sobre a capa do santo — partículas douradas
 * quase imperceptíveis flutuando lentamente.
 *
 * Sem JS, só CSS keyframes. É ornato visual (arte sacra digital),
 * não tem carga devocional nem sugere que "a imagem tem poder".
 * Ver docs/copy-catolica.md §1 P1.
 */
export default function CapaViva() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ mixBlendMode: 'screen' }}
    >
      {/* 5 partículas douradas em posições diferentes */}
      <span className="capaviva-dot capaviva-dot-1" />
      <span className="capaviva-dot capaviva-dot-2" />
      <span className="capaviva-dot capaviva-dot-3" />
      <span className="capaviva-dot capaviva-dot-4" />
      <span className="capaviva-dot capaviva-dot-5" />

      <style jsx>{`
        .capaviva-dot {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,223,130,0.85), rgba(201,168,76,0.2) 60%, transparent 80%);
          filter: blur(0.5px);
          opacity: 0;
        }
        .capaviva-dot-1 {
          top: 18%; left: 22%;
          animation: capaviva-float 14s ease-in-out infinite;
        }
        .capaviva-dot-2 {
          top: 34%; left: 68%;
          animation: capaviva-float 18s ease-in-out infinite 2s;
        }
        .capaviva-dot-3 {
          top: 62%; left: 40%;
          animation: capaviva-float 16s ease-in-out infinite 4s;
        }
        .capaviva-dot-4 {
          top: 78%; left: 82%;
          animation: capaviva-float 20s ease-in-out infinite 6s;
        }
        .capaviva-dot-5 {
          top: 50%; left: 12%;
          animation: capaviva-float 17s ease-in-out infinite 1s;
        }

        @keyframes capaviva-float {
          0%   { opacity: 0; transform: translate(0, 0) scale(0.8); }
          15%  { opacity: 0.5; }
          50%  { opacity: 0.85; transform: translate(8px, -12px) scale(1); }
          85%  { opacity: 0.3; }
          100% { opacity: 0; transform: translate(-4px, -24px) scale(0.6); }
        }

        @media (prefers-reduced-motion: reduce) {
          .capaviva-dot { animation: none; opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
