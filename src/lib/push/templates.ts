/**
 * Templates de notificações push.
 *
 * Cada template devolve `PushPayload` — o shape que o Service Worker recebe
 * em `self.addEventListener('push')` ([public/sw.js:274]). O `tag` define
 * agrupamento nativo (push nova de mesma tag substitui a anterior na gaveta).
 *
 * Tom: conversacional, como se um amigo estivesse mandando uma mensagem.
 * Sem emojis decorativos (o ✝ do iOS renderiza com gradiente roxo feio).
 * Body curto (<90 char) pra caber sem truncar no lockscreen.
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
  requireInteraction?: boolean
  /** Dedupe_key usada no feed in-app (1 registro por usuário+chave) */
  dedupeKey?: string
}

function pickByDay<T>(arr: T[]): T {
  const d = new Date()
  const idx = d.getDate() + d.getMonth()
  return arr[idx % arr.length]
}

function shortRef(ref: string | null | undefined): string | null {
  if (!ref) return null
  return ref.replace(/^[(\[]|[)\]]$/g, '').trim() || null
}

// ─── Liturgia do dia (manhã) ─────────────────────────────────────────

const liturgiaTitulos = [
  'Bom dia',
  'Começando o dia',
  'A Palavra de hoje',
]

const liturgiaBodiesSemRef = [
  'A liturgia de hoje já tá aqui. Vem começar o dia bem?',
  'Que tal abrir o dia com a Palavra?',
  'Um minuto com a Palavra antes de começar?',
  'O dia fica diferente quando começa com Ele.',
]

const liturgiaBodiesComRef = [
  'Hoje tem {ref}. Vamos ler juntos?',
  'No evangelho de hoje: {ref}. Um momento?',
  'A Palavra de hoje: {ref}. Vem cá.',
]

export function liturgiaHoje(dia: LiturgiaDia | null): PushPayload {
  const evangelho = shortRef(dia?.evangelho?.referencia)
  const primeira = shortRef(dia?.primeira_leitura?.referencia)
  const ref = evangelho || primeira

  const body = ref
    ? pickByDay(liturgiaBodiesComRef).replace('{ref}', ref)
    : pickByDay(liturgiaBodiesSemRef)

  return {
    title: pickByDay(liturgiaTitulos),
    body,
    url: '/liturgia',
    tag: 'liturgia-hoje',
    dedupeKey: `liturgia:${new Date().toISOString().slice(0, 10)}`,
  }
}

// ─── Ângelus (12h) ───────────────────────────────────────────────────

const angelusTitulos = [
  'Meio-dia',
  'Deu 12h',
  'Pausa do almoço',
]

const angelusBodies = [
  'Uma Ave-Maria pelo Ângelus?',
  'Parou pro Ângelus? É rapidinho.',
  'Um minuto com Nossa Senhora antes de seguir.',
  'O Anjo do Senhor anunciou a Maria. Vem rezar.',
]

export function angelus(): PushPayload {
  return {
    title: pickByDay(angelusTitulos),
    body: pickByDay(angelusBodies),
    url: '/oracoes/angelus',
    tag: 'angelus',
    dedupeKey: `angelus:${new Date().toISOString().slice(0, 10)}`,
  }
}

// ─── Novena diária ───────────────────────────────────────────────────

const novenaTitulos = [
  'Sua novena',
  'Hora da novena',
  'Um dia a mais',
]

const novenaBodies = [
  'Não quebra a corrente. Tá na hora.',
  'Um passo a mais hoje. Vamos?',
  'Sua novena te espera. Vem cá.',
  'Perseverar é meio caminho. Bora?',
]

export function novena(opts: { dia?: number; slug?: string | null }): PushPayload {
  const prefix = opts.dia ? `Dia ${opts.dia} de 9 — ` : ''
  return {
    title: pickByDay(novenaTitulos),
    body: prefix + pickByDay(novenaBodies),
    url: '/novenas/minhas',
    tag: 'novena-daily',
    dedupeKey: `novena:${new Date().toISOString().slice(0, 10)}`,
  }
}

// ─── Exame de consciência (noite) ────────────────────────────────────

const exameTitulos = [
  'Antes de dormir',
  'Como foi seu dia?',
  'Fim do dia',
]

const exameBodies = [
  'Vamos olhar o dia juntos antes de descansar?',
  'Um momento de verdade antes do sono.',
  'O que Deus fez por você hoje? E você, por Ele?',
  'Fecha o dia com Ele. É rápido.',
]

export function exame(): PushPayload {
  return {
    title: pickByDay(exameTitulos),
    body: pickByDay(exameBodies),
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
    body: 'Alguém tá intercedendo pelo seu pedido. Que alegria.',
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
    body: 'Uma carta chegou. Abre quando puder.',
    url: `/comunidade/cartas/${opts.cartaId}`,
    tag: `cartas-${opts.cartaId}`,
  }
}

// ─── Test ────────────────────────────────────────────────────────────

export function testar(): PushPayload {
  return {
    title: 'Tudo certo',
    body: 'Funcionou. A partir de agora você recebe os lembretes aqui.',
    url: '/',
    tag: 'test',
  }
}
