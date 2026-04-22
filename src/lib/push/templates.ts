/**
 * Templates de notificações push.
 *
 * Cada template devolve `PushPayload` — o shape que o Service Worker recebe
 * em `self.addEventListener('push')` ([public/sw.js:274]). O `tag` define
 * agrupamento nativo (push nova de mesma tag substitui a anterior na gaveta).
 *
 * Tom: católico clássico, sem emojis decorativos. Body curto (<90 char) para
 * caber sem truncar no lockscreen do iOS.
 */

import type { LiturgiaDia } from '@/types/liturgia'

export type Categoria =
  | 'liturgia'
  | 'angelus'
  | 'novena'
  | 'exame'
  | 'comunidade'
  | 'cartas'
  | 'test'

export interface PushPayload {
  title: string
  body: string
  url: string
  tag: string
  /** Texto exibido em substituição ao título quando a notificação é agrupada */
  requireInteraction?: boolean
  /** Dedupe_key usada no feed in-app (1 registro por usuário+chave) */
  dedupeKey?: string
}

const intros = [
  'Vigiai e orai',
  'Hoje é dia de graça',
  'Um momento com Deus',
  'Tempo de silêncio',
  'Venha rezar',
]

function pickByDay<T>(arr: T[]): T {
  const day = new Date().getDate() + new Date().getMonth()
  return arr[day % arr.length]
}

function shortRef(ref: string | null | undefined): string | null {
  if (!ref) return null
  // "(At 2,42-47)" → "At 2,42-47"
  return ref.replace(/^[(\[]|[)\]]$/g, '').trim() || null
}

// ─── Liturgia do dia ─────────────────────────────────────────────────

export function liturgiaHoje(dia: LiturgiaDia | null): PushPayload {
  const evangelho = shortRef(dia?.evangelho?.referencia)
  const primeira = shortRef(dia?.primeira_leitura?.referencia)
  const lista = [evangelho, primeira].filter(Boolean).join(' · ')

  const body = lista
    ? `Hoje: ${lista}. Venha meditar a Palavra.`
    : 'Comece o dia com a Palavra de Deus.'

  return {
    title: dia?.titulo ? `Liturgia — ${dia.titulo}` : 'Liturgia do dia',
    body,
    url: '/liturgia',
    tag: 'liturgia-hoje',
    dedupeKey: `liturgia:${new Date().toISOString().slice(0, 10)}`,
  }
}

// ─── Ângelus (12h) ───────────────────────────────────────────────────

const angelusBody = [
  'O Anjo do Senhor anunciou a Maria. E ela concebeu do Espírito Santo.',
  'É meio-dia. Pare um instante e reze o Ângelus.',
  'Ave, Maria, cheia de graça. O Senhor é convosco.',
  'Um minuto com Nossa Senhora antes de seguir o dia.',
]

export function angelus(): PushPayload {
  return {
    title: 'Ângelus Domini',
    body: pickByDay(angelusBody),
    url: '/oracoes/angelus',
    tag: 'angelus',
    dedupeKey: `angelus:${new Date().toISOString().slice(0, 10)}`,
  }
}

// ─── Novena diária ───────────────────────────────────────────────────

const novenaBody = [
  'A perseverança é o caminho da graça. Reze sua novena hoje.',
  'Não interrompa a corrente. Hoje é o seu dia de novena.',
  'Mantenha a cadência. Sua novena espera por você.',
  'Um dia de cada vez, com confiança. Venha rezar.',
]

export function novena(opts: { dia?: number; slug?: string | null }): PushPayload {
  const detalhe = opts.dia ? `Dia ${opts.dia} de 9` : 'Continue sua novena'
  return {
    title: 'Hora da Novena',
    body: `${detalhe} — ${pickByDay(novenaBody)}`,
    url: '/novenas/minhas',
    tag: 'novena-daily',
    dedupeKey: `novena:${new Date().toISOString().slice(0, 10)}`,
  }
}

// ─── Exame de consciência (noite) ────────────────────────────────────

const exameBody = [
  'Como foi seu dia aos olhos de Deus?',
  'Examine sua consciência antes de dormir.',
  'Pare e reveja o dia com o Senhor.',
  'Um momento de verdade antes do descanso.',
]

export function exame(): PushPayload {
  return {
    title: 'Exame de consciência',
    body: pickByDay(exameBody),
    url: '/exame-consciencia',
    tag: 'exame',
    dedupeKey: `exame:${new Date().toISOString().slice(0, 10)}`,
  }
}

// ─── Comunidade ──────────────────────────────────────────────────────

export function comunidadeRezouPorMim(opts: {
  autor: string
  pedidoId: string
}): PushPayload {
  return {
    title: `${opts.autor} rezou por você`,
    body: 'Alguém está intercedendo pelo seu pedido. Que Deus o abençoe.',
    url: `/comunidade/pedidos/${opts.pedidoId}`,
    tag: `comunidade-rezou-${opts.pedidoId}`,
  }
}

export function comunidadeRespondeuCarta(opts: {
  autor: string
  cartaId: string
}): PushPayload {
  return {
    title: `${opts.autor} te respondeu`,
    body: 'Uma carta chegou. Abra quando puder.',
    url: `/comunidade/cartas/${opts.cartaId}`,
    tag: `cartas-${opts.cartaId}`,
  }
}

// ─── Test ────────────────────────────────────────────────────────────

export function testar(): PushPayload {
  const frase = pickByDay(intros)
  return {
    title: '✝ Veritas Dei',
    body: `${frase}. Suas notificações estão ativas.`,
    url: '/',
    tag: 'test',
  }
}
