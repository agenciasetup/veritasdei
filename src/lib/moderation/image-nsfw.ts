/**
 * Classificador NSFW de imagens via Cloudflare Workers AI. A imagem é
 * baixada do CDN público do R2 (URL já disponível no build dos assets) e
 * enviada como bytes ao modelo. O modelo padrão é um classificador de
 * imagens que devolve probabilidades por rótulo; extraímos o primeiro
 * rótulo que casa com nosso conjunto NSFW.
 *
 * Se CF_ACCOUNT_ID ou CF_WORKERS_AI_TOKEN não estiverem configurados, a
 * função retorna `{ available: false }` e o caller decide o que fazer
 * (tipicamente pular a moderação em dev local).
 */

const DEFAULT_MODEL = process.env.CF_NSFW_MODEL || '@cf/microsoft/resnet-50'
const NSFW_LABELS_SUBSTRINGS = [
  'pornography',
  'explicit',
  'nsfw',
  'nudity',
  'naked',
  'topless',
  'sex',
  'lingerie',
  'bikini',
  'swimsuit',
  'underwear',
]

export type NsfwScanResult =
  | { available: false; reason: string }
  | {
      available: true
      safe: boolean
      score: number
      labels: Array<{ label: string; score: number }>
      provider: string
      raw?: unknown
    }

export function isNsfwProviderConfigured(): boolean {
  return Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_WORKERS_AI_TOKEN)
}

async function downloadImage(url: string, timeoutMs = 4000): Promise<ArrayBuffer | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

type WorkersAiResponse = {
  success?: boolean
  result?: Array<{ label: string; score: number }>
  errors?: unknown
}

export async function scanImage(publicUrl: string, opts?: { timeoutMs?: number }): Promise<NsfwScanResult> {
  if (!isNsfwProviderConfigured()) {
    return { available: false, reason: 'provider_not_configured' }
  }

  const bytes = await downloadImage(publicUrl, opts?.timeoutMs ?? 4000)
  if (!bytes) {
    return { available: false, reason: 'download_failed' }
  }

  const accountId = process.env.CF_ACCOUNT_ID!
  const token = process.env.CF_WORKERS_AI_TOKEN!
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${DEFAULT_MODEL}`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: bytes,
    })

    if (!res.ok) {
      return { available: false, reason: `upstream_${res.status}` }
    }

    const body = (await res.json()) as WorkersAiResponse
    const labels = Array.isArray(body.result) ? body.result : []

    const nsfwHit = labels.find((item) =>
      NSFW_LABELS_SUBSTRINGS.some((needle) => item.label?.toLowerCase().includes(needle)),
    )

    const score = nsfwHit?.score ?? 0
    const safe = !nsfwHit || score < 0.45

    return {
      available: true,
      safe,
      score,
      labels,
      provider: DEFAULT_MODEL,
      raw: body,
    }
  } catch (err) {
    return { available: false, reason: err instanceof Error ? err.message : 'unknown_error' }
  }
}
