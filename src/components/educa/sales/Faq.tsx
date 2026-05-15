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
    q: 'Como são as aulas?',
    a: 'Lições em texto, organizadas em catálogo navegável igual a uma plataforma de streaming. São 14 pilares (Dogmas, Sacramentos, Mandamentos, Orações, Defesa da Fé…) que abrem em 63 tópicos e 136 subtópicos. Você abre o pilar, escolhe o tópico, lê a lição no seu ritmo e o app guarda onde parou.',
  },
  {
    q: 'Vai me ajudar a defender minha fé?',
    a: 'Vai. Tem três coisas trabalhando juntas: o Modo Debate — uma IA assume o papel de protestante e te questiona sobre Maria, Eucaristia, papado, Bíblia sozinha; você responde e ela mostra um placar do seu argumento. Junto, a trilha de Defesa da Fé (apologética católica) e o pilar de Dogmas te dão a base. No fim, você defende a fé porque entendeu o porquê — não porque decorou frase pronta.',
  },
  {
    q: 'E se eu não conseguir manter o ritmo?',
    a: 'O app foi feito pra constância, não pressa. Pode fazer uma lição por semana ou cinco por dia — você decide. O app guarda o ponto onde parou e te lembra de voltar com missões curtas (5 a 10 minutos) pra você não perder o fio sem se sentir cobrado.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. Abre no navegador do celular como qualquer site — Android ou iPhone, dá no mesmo. Computador também funciona com a mesma conta.',
  },
  {
    q: 'Quais são as formas de pagamento?',
    a: 'Pix, cartão de crédito (parcelado em até 12x) ou boleto. Tudo processado pela Asaas, com pagamento seguro.',
  },
  {
    q: 'Tem garantia?',
    a: 'Tem 7 dias. É o prazo do Código de Defesa do Consumidor pra arrependimento — pede o reembolso pelo seu perfil ou pelo suporte e devolvemos integral, sem perguntar o porquê.',
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
