/**
 * Rate limiter com duas camadas:
 *
 *   1. Upstash Redis (sliding window) — usado quando
 *      `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` estão setados.
 *      Compartilha contador entre todas as instâncias serverless (Vercel
 *      cria uma por cold-start; sem isso, um atacante distribui o abuso
 *      entre instâncias e passa pelo limite local).
 *
 *   2. In-memory per-instance — fallback automático em dev / enquanto o
 *      Upstash não for provisionado. Usa sliding window na Map.
 *
 * A função assíncrona `rateLimit(key, limit, windowMs)` resolve para
 * `true` quando a requisição está DENTRO do limite, `false` quando
 * passou.
 *
 * Todos os chamadores precisam fazer `await`. A versão anterior era
 * síncrona — a migration foi feita no mesmo commit.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Upstash (opcional) ──────────────────────────────────────────────────

function getUpstashClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    return new Redis({ url, token })
  } catch (err) {
    console.warn('[rate-limit] Failed to init Upstash — falling back to in-memory:', err)
    return null
  }
}

// Cache do Ratelimit por (limit, windowMs) — criar um novo a cada call é
// caro. O Map é tiny (poucas configurações distintas no app inteiro).
const rlCache = new Map<string, Ratelimit>()

function getRatelimit(redis: Redis, limit: number, windowMs: number): Ratelimit {
  const k = `${limit}@${windowMs}`
  const cached = rlCache.get(k)
  if (cached) return cached

  // Sliding window: granularidade idêntica ao fallback in-memory para
  // evitar comportamento divergente entre ambientes.
  const windowSec = Math.max(1, Math.round(windowMs / 1000))
  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    // Analytics desabilitado — adiciona writes extras e não usamos ainda.
    analytics: false,
    prefix: 'vd:rl',
  })
  rlCache.set(k, rl)
  return rl
}

// ─── In-memory fallback ──────────────────────────────────────────────────

const requests = new Map<string, number[]>()

function rateLimitLocal(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = requests.get(key) ?? []
  const valid = timestamps.filter(t => now - t < windowMs)

  if (valid.length >= limit) return false

  valid.push(now)
  requests.set(key, valid)

  // Evict oldest entries when map grows too large to prevent memory leak
  if (requests.size > 10000) {
    const iter = requests.keys()
    for (let i = 0; i < 2000; i++) {
      const k = iter.next().value
      if (k !== undefined) requests.delete(k)
    }
  }

  return true
}

// ─── API pública ─────────────────────────────────────────────────────────

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const redis = getUpstashClient()
  if (!redis) {
    return rateLimitLocal(key, limit, windowMs)
  }

  try {
    const rl = getRatelimit(redis, limit, windowMs)
    const { success } = await rl.limit(key)
    return success
  } catch (err) {
    // Network blip ou timeout — fail open para o in-memory em vez de
    // derrubar o endpoint inteiro. Log para diagnóstico.
    console.warn('[rate-limit] Upstash error — falling back to local:', err)
    return rateLimitLocal(key, limit, windowMs)
  }
}
