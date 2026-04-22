'use client'

/**
 * 9 círculos dourados (um por dia). Os dias rezados ficam iluminados
 * com preenchimento sólido. Visual sóbrio — sem flame emojis, sem
 * "streak on fire" style. Ver docs/copy-catolica.md §1 P2.
 */
export default function NovenaProgresso({ progresso, diaAtual }: { progresso: string[]; diaAtual: number }) {
  const diasRezados = Math.min(progresso?.length ?? 0, 9)
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: 9 }).map((_, i) => {
        const rezado = i < diasRezados
        const eDiaAtual = !rezado && i === diasRezados && diaAtual === i + 1
        return (
          <div
            key={i}
            aria-label={`Dia ${i + 1}${rezado ? ' · rezado' : eDiaAtual ? ' · hoje' : ''}`}
            className="flex items-center justify-center"
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: rezado
                ? 'rgb(201,168,76)'
                : eDiaAtual
                  ? 'rgba(201,168,76,0.35)'
                  : 'transparent',
              border: rezado
                ? '1px solid rgba(201,168,76,0.9)'
                : '1px solid rgba(242,237,228,0.22)',
              boxShadow: eDiaAtual ? '0 0 10px rgba(201,168,76,0.5)' : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
