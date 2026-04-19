'use client'

import Link from 'next/link'
import { HandHeart, Bell } from 'lucide-react'
import { usePropositos } from '@/contexts/PropositosContext'
import { diffDays, localDateString } from '@/lib/propositos'
import { useEffect, useMemo, useRef } from 'react'

/**
 * Lembretes calculados 100% no cliente, sem push. Serve como ponte
 * até as notificações reais (Fase 2).
 *
 * Regras atuais:
 *  - "Faz N dias desde sua última confissão" quando o propósito de
 *    confissão existe e a última log é há mais de `lembrete_confissao_dias`
 *    (default 30). Mostra mesmo com propósito inativo — é pastoral.
 *  - "É sexta — dia de penitência" em sextas-feiras.
 *  - "Hora de rezar o terço" se o propósito de rosário não foi cumprido
 *    hoje após as 17h.
 */

interface Lembrete {
  id: string
  icon: typeof Bell
  titulo: string
  subtitulo: string
  href: string
  tom: 'info' | 'alerta'
}

export default function LembretesCard() {
  const { propositos, logs, today } = usePropositos()
  const sentFingerprintRef = useRef<string>('')

  const lembretes = useMemo<Lembrete[]>(() => {
    const out: Lembrete[] = []

    // Confissão
    const confissao = propositos.find(p => p.tipo === 'confissao')
    if (confissao) {
      const ultima = logs
        .filter(l => l.proposito_id === confissao.id)
        .sort((a, b) => (a.feito_em < b.feito_em ? 1 : -1))[0]
      const dias = ultima ? diffDays(today, ultima.feito_em) : 60
      if (dias >= 30) {
        out.push({
          id: 'confissao',
          icon: HandHeart,
          titulo: ultima
            ? `Faz ${dias} dias que você não se confessa`
            : 'Você ainda não confessou este mês',
          subtitulo: 'Encontre uma igreja com horário de confissão',
          href: '/paroquias/buscar?mode=nearby',
          tom: 'alerta',
        })
      }
    }

    // Sexta-feira
    const hoje = new Date()
    if (hoje.getDay() === 5) {
      out.push({
        id: 'sexta',
        icon: Bell,
        titulo: 'Hoje é sexta-feira',
        subtitulo: 'Dia de penitência em comunhão com a Paixão',
        href: '/calendario',
        tom: 'info',
      })
    }

    // Terço do dia (após 17h, se propósito ativo e sem check-in hoje)
    const rosario = propositos.find(p => p.tipo === 'rosario' && p.ativo)
    if (rosario && hoje.getHours() >= 17 && !rosario.feito_hoje) {
      out.push({
        id: 'terco',
        icon: Bell,
        titulo: 'Hora de rezar o Santo Rosário',
        subtitulo: 'Um mistério hoje em família ou sozinho',
        href: '/rosario',
        tom: 'info',
      })
    }

    return out
  }, [propositos, logs, today])

  // Alimenta o feed persistente de notificações com dedupe diário.
  useEffect(() => {
    if (lembretes.length === 0) return
    const dayKey = localDateString(new Date())
    const fingerprint = `${dayKey}:${lembretes.map((l) => l.id).join(',')}`
    if (sentFingerprintRef.current === fingerprint) return
    sentFingerprintRef.current = fingerprint
    void fetch('/api/notificacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        lembretes.map((l) => ({
          type: l.id,
          title: l.titulo,
          body: l.subtitulo,
          target_url: l.href,
          source: 'home_reminder',
          dedupe_key: `home-reminder:${l.id}:${dayKey}`,
          payload: { tone: l.tom },
        })),
      ),
    }).catch(() => {
      // Não bloqueia a experiência da home se falhar.
    })
  }, [lembretes])

  if (lembretes.length === 0) return null

  return (
    <section className="px-4 mb-4 md:!px-0 md:mb-6">
      <h2 className="px-1 mb-3 ios-eyebrow uppercase" style={{ letterSpacing: '0.06em' }}>
        Lembretes
      </h2>
      <div className="flex flex-col gap-2 stagger-in">
        {lembretes.map((l) => {
          const Icon = l.icon
          const accent = l.tom === 'alerta' ? '#D94F5C' : '#C9A84C'
          return (
            <Link
              key={l.id}
              href={l.href}
              className="ios-surface flex items-center gap-3 p-3.5 active:scale-[0.99] transition-transform"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${accent}15`,
                  color: accent,
                  border: `1px solid ${accent}22`,
                }}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13.5px] leading-snug"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                  }}
                >
                  {l.titulo}
                </p>
                <p
                  className="text-[12px] truncate mt-0.5"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
                >
                  {l.subtitulo}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
