/**
 * Simple in-memory rate limiter for API routes.
 * Tracks requests per key (e.g. user ID) within a sliding window.
 * NOTE: This resets on server restart and is per-instance only.
 * For production at scale, replace with Redis (e.g. Upstash).
 */

const requests = new Map<string, number[]>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = requests.get(key) ?? []

  // Remove expired entries
  const valid = timestamps.filter(t => now - t < windowMs)

  if (valid.length >= limit) {
    return false // rate limited
  }

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

  return true // allowed
}
