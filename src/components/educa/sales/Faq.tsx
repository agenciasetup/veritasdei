'use client'

/**
 * FAQ curto antes do cadastro — corta as objeções mais comuns.
 *
 * Cada item é um <details> nativo (acessível e zero-JS além do toggle do
 * browser). Sem framer-motion no abre/fecha pra ficar leve e previsível.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

type Item = {
  q: string
  a: string
}

const FAQ: Item[] = [
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Você cancela dentro do seu perfil em qualquer momento — sem fidelidade, sem multa. O acesso permanece ativo até o fim do período já pago.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. A plataforma é mobile-first: roda no navegador do celular e dá pra instalar como app (PWA) no Android e iOS. No desktop também funciona em qualquer navegador moderno.',
  },
  {
    q: 'E se eu não conseguir manter o ritmo?',
    a: 'O Veritas Educa foi feito pra constância, não pressa. Faça uma lição por semana ou três por dia — o app guarda o ponto onde você parou e cria missões diárias curtas pra te ajudar a voltar.',
  },
  {
    q: 'Quais são as formas de pagamento?',
    a: 'Pix, cartão de crédito (em até 12x, sujeito a juros conforme parcelas) e boleto bancário. Processamento pela Asaas, com certificação PCI Level 1.',
  },
  {
    q: 'Qual a idade mínima?',
    a: 'A partir de 14 anos completos. Adolescentes entre 14 e 17 fazem o cadastro com consentimento do responsável legal (LGPD).',
  },
  {
    q: 'Existe garantia?',
    a: 'Pela legislação brasileira (CDC), você tem 7 dias de arrependimento após a contratação. Solicite o reembolso direto no seu perfil ou pelo suporte; devolvemos integralmente.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: 'var(--surface-1)' }}
    >
      {/* Surface plano pra evitar vinheta repetida depois do Pricing (velvet). */}
      <div
        className="absolute inset-0 pointer-events-none -z-0"
        style={{
          background:
            'radial-gradient(60% 40% at 50% 0%, rgba(201,168,76,0.08), transparent 65%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10 md:mb-12"
        >
          <span className="eyebrow-label inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 tag-dark mb-6">
            <span className="inline-block w-1 h-1 rounded-full bg-current opacity-70" />
            Dúvidas frequentes
          </span>
          <h2
            className="display-cormorant text-3xl sm:text-4xl md:text-5xl leading-[1.05]"
            style={{ color: '#F5EFE6', textWrap: 'balance' }}
          >
            Tire a dúvida{' '}
            <span className="italic" style={{ color: '#E6D9B5' }}>
              antes de assinar.
            </span>
          </h2>
        </motion.div>

        <div className="flex flex-col gap-3">
          {FAQ.map((item, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(20,18,14,0.7)',
                  border: '1px solid var(--border-1)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors"
                  aria-expanded={isOpen}
                  style={{
                    color: '#F5EFE6',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                  }}
                >
                  <span className="text-base">{item.q}</span>
                  <ChevronDown
                    className="w-4 h-4 flex-shrink-0 transition-transform"
                    style={{
                      color: '#C9A84C',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
                {isOpen && (
                  <div
                    className="px-5 pb-5 -mt-1 text-sm leading-relaxed"
                    style={{
                      color: 'rgba(242,237,228,0.78)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {item.a}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
