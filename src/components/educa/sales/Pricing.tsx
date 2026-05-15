'use client'

import { motion } from 'framer-motion'
import { Check, ShieldCheck } from 'lucide-react'
import type { EducaSalesIntervalo, EducaSalesPrice } from '@/lib/educa/server-data'

type Props = {
  prices: EducaSalesPrice[]
  selected: EducaSalesIntervalo
  onSelect: (i: EducaSalesIntervalo) => void
  onAssinar: () => void
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

const NOMES: Record<EducaSalesIntervalo, string> = {
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual',
  unico: 'Único',
}

const SUFIXOS: Record<EducaSalesIntervalo, string> = {
  mensal: 'por mês',
  semestral: 'a cada 6 meses',
  anual: 'por ano',
  unico: 'único',
}

const MESES: Record<EducaSalesIntervalo, number> = {
  mensal: 1,
  semestral: 6,
  anual: 12,
  unico: 1,
}

const INCLUSO = [
  'Trilhas das 3 áreas: Bíblia, Magistério, Patrística',
  'Terço em grupo (sala por código)',
  'Modo debate com IA católica',
  'Grupos de estudo com metas e progresso',
  'Coleção de cartas (santos, doutores, marcos)',
  'Anotações por lição, sequência diária, XP',
]

/**
 * Seção de planos — 3 cards horizontais no desktop, empilhados no mobile.
 * Anual destacado (escala maior, badge "Recomendado", glow gold extra).
 */
export default function Pricing({ prices, selected, onSelect, onAssinar }: Props) {
  const mensal = prices.find(p => p.intervalo === 'mensal')

  return (
    <section
      id="planos"
      className="surface-velvet relative py-20 md:py-28 overflow-hidden"
    >
      {/* Background ornament */}
      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 0%, rgba(201,168,76,0.10), transparent 65%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="eyebrow-label inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 tag-dark mb-6">
            <span className="inline-block w-1 h-1 rounded-full bg-current opacity-70" />
            Planos
          </span>
          <h2
            className="display-cormorant text-3xl sm:text-4xl md:text-5xl leading-[1.05] mb-5"
            style={{ color: '#F5EFE6', textWrap: 'balance' }}
          >
            Um preço.{' '}
            <span className="italic" style={{ color: '#E6D9B5' }}>
              Acesso a tudo.
            </span>
          </h2>
          <p
            className="text-base md:text-lg max-w-2xl mx-auto"
            style={{
              color: 'rgba(242,237,228,0.72)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.6,
            }}
          >
            A diferença entre os planos é só por quanto tempo você assina de
            uma vez. Pague no Pix, cartão (em até 12x) ou boleto. Cancele
            quando quiser.
          </p>
        </motion.div>

        {prices.length === 0 ? (
          <p
            className="text-center text-sm"
            style={{ color: 'rgba(242,237,228,0.6)', fontFamily: 'Poppins, sans-serif' }}
          >
            Planos indisponíveis no momento. Recarregue em alguns instantes.
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto items-stretch">
            {prices
              .filter(p => p.intervalo !== 'unico')
              .map((p, idx) => {
                const isSelected = p.intervalo === selected
                const isAnual = p.intervalo === 'anual'
                const meses = MESES[p.intervalo]
                const porMes = p.amountCents / meses
                const economia =
                  mensal && p.intervalo !== 'mensal'
                    ? Math.round(
                        ((mensal.amountCents * meses - p.amountCents) /
                          (mensal.amountCents * meses)) *
                          100,
                      )
                    : 0

                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    onClick={() => onSelect(p.intervalo)}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    whileHover={{ y: -6 }}
                    className="relative text-left p-6 md:p-7 rounded-2xl transition-all flex flex-col"
                    style={{
                      background: isAnual
                        ? 'linear-gradient(160deg, rgba(28,22,16,0.96), rgba(12,10,8,0.98))'
                        : 'rgba(20,18,14,0.85)',
                      border: isSelected
                        ? '1.5px solid #C9A84C'
                        : isAnual
                          ? '1px solid rgba(201,168,76,0.4)'
                          : '1px solid var(--border-1)',
                      boxShadow: isAnual
                        ? '0 0 0 1px rgba(201,168,76,0.12), 0 30px 80px rgba(0,0,0,0.45), 0 0 60px rgba(201,168,76,0.06)'
                        : '0 12px 32px rgba(0,0,0,0.3)',
                      transform: isAnual ? 'scale(1.02)' : 'none',
                    }}
                  >
                    {isAnual && (
                      <span
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] uppercase"
                        style={{
                          background: 'var(--accent)',
                          color: 'var(--accent-contrast)',
                          fontFamily: 'Cinzel, serif',
                          letterSpacing: '0.2em',
                          fontWeight: 700,
                          boxShadow: '0 6px 16px rgba(201,168,76,0.35)',
                        }}
                      >
                        Recomendado
                      </span>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <span
                        className="eyebrow-label"
                        style={{
                          color: isAnual ? '#D9C077' : 'rgba(242,237,228,0.6)',
                          letterSpacing: '0.22em',
                        }}
                      >
                        {NOMES[p.intervalo]}
                      </span>
                      {economia > 0 && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{
                            background: 'color-mix(in srgb, var(--success) 18%, transparent)',
                            color: 'var(--success)',
                            border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 600,
                          }}
                        >
                          −{economia}%
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                      <span
                        className="display-cinzel tabular-nums"
                        style={{
                          color: '#F5EFE6',
                          fontSize: isAnual ? '40px' : '34px',
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {formatBRL(p.amountCents)}
                      </span>
                      <span
                        className="text-sm"
                        style={{
                          color: 'rgba(242,237,228,0.55)',
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      >
                        {SUFIXOS[p.intervalo]}
                      </span>
                    </div>

                    {p.intervalo !== 'mensal' && (
                      <p
                        className="text-xs mb-5"
                        style={{
                          color: 'rgba(242,237,228,0.55)',
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      >
                        equivale a {formatBRL(Math.round(porMes))} por mês
                      </p>
                    )}
                    {p.intervalo === 'mensal' && <div className="h-5 mb-0" />}

                    <div className="flex-1" />

                    <div
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-[11px]"
                      style={{
                        background: isSelected
                          ? 'var(--accent)'
                          : isAnual
                            ? 'rgba(201,168,76,0.12)'
                            : 'transparent',
                        color: isSelected
                          ? 'var(--accent-contrast)'
                          : isAnual
                            ? '#E6D9B5'
                            : 'rgba(242,237,228,0.85)',
                        border: isSelected
                          ? '1px solid var(--accent)'
                          : '1px solid rgba(201,168,76,0.3)',
                        fontFamily: 'Cinzel, serif',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Selecionado
                        </>
                      ) : (
                        'Escolher'
                      )}
                    </div>
                  </motion.button>
                )
              })}
          </div>
        )}

        {/* Included list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-12 md:mt-14 max-w-3xl mx-auto"
        >
          <p
            className="eyebrow-label text-center mb-5"
            style={{ color: '#D9C077' }}
          >
            ◆ Incluso em todos os planos ◆
          </p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {INCLUSO.map(item => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm"
                style={{
                  color: 'rgba(242,237,228,0.82)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.5,
                }}
              >
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C9A84C' }} />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CTA pra ir pro cadastro */}
        <div className="mt-10 md:mt-12 flex flex-col items-center gap-3">
          <button
            onClick={onAssinar}
            className="btn-gold inline-flex items-center gap-2 rounded-full px-8 py-4 text-[12px] font-semibold"
          >
            Assinar — {NOMES[selected]}
          </button>
          <p
            className="text-[11px] inline-flex items-center gap-1.5"
            style={{ color: 'rgba(242,237,228,0.55)', fontFamily: 'Poppins, sans-serif' }}
          >
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
            Pagamento seguro pela Asaas · Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  )
}
