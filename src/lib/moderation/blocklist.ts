/**
 * Blocklist de domínios proibidos em posts e perfis da comunidade. A lista
 * estática cobre os casos mais comuns; a tabela moderation_blocklist permite
 * adicionar domínios extras em runtime (admin-only).
 *
 * Escopo: pornografia, camming, "conteúdo adulto" genérico, sites de
 * phishing/scam conhecidos. O match é feito no host (sem depender de
 * protocolo ou path) — subdomínios também batem (ex.: foo.pornhub.com).
 */

export const STATIC_DOMAIN_BLOCKLIST: ReadonlyArray<string> = [
  // Pornografia clássica
  'pornhub.com',
  'youporn.com',
  'redtube.com',
  'xvideos.com',
  'xnxx.com',
  'xhamster.com',
  'spankbang.com',
  'tnaflix.com',
  'beeg.com',
  'tube8.com',
  'brazzers.com',
  'naughtyamerica.com',
  'bangbros.com',
  'vixen.com',
  'realitykings.com',
  'kink.com',
  'motherless.com',
  'eporner.com',
  'hentaihaven.xxx',
  'nhentai.net',
  // Camming / live adulto
  'chaturbate.com',
  'myfreecams.com',
  'camsoda.com',
  'bongacams.com',
  'stripchat.com',
  'livejasmin.com',
  'streamate.com',
  // Assinatura adulta
  'onlyfans.com',
  'fansly.com',
  'fanvue.com',
  'justforfans.app',
  'justfor.fans',
  'privacy.com.br',
  'close.com.br',
  'manyvids.com',
  'clips4sale.com',
  // Escort / prostituição
  'adultfriendfinder.com',
  'ashley-madison.com',
  'ashleymadison.com',
  'backpage.com',
  'skokka.com',
  // Agregadores e magnets adultos comuns
  'porntrex.com',
  'porndish.com',
  'porndoe.com',
  'bellesa.co',
] as const

const BLOCKED_TLDS: ReadonlyArray<string> = ['.xxx', '.porn', '.adult', '.sex']

function normalizeHost(raw: string): string | null {
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return url.hostname.toLowerCase()
  } catch {
    return null
  }
}

function extractUrls(text: string): string[] {
  const matches = text.match(/\bhttps?:\/\/[^\s<>"']+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>"']*)?/gi)
  return matches ?? []
}

function hostMatches(host: string, blocked: string): boolean {
  return host === blocked || host.endsWith(`.${blocked}`)
}

export type BlocklistHit = {
  url: string
  host: string
  matchedDomain: string
}

export function scanForBlockedDomains(
  text: string,
  extraDomains: ReadonlyArray<string> = [],
): BlocklistHit | null {
  if (!text) return null
  const urls = extractUrls(text)
  if (urls.length === 0) return null

  const blocked = [...STATIC_DOMAIN_BLOCKLIST, ...extraDomains.map((d) => d.toLowerCase())]

  for (const raw of urls) {
    const host = normalizeHost(raw)
    if (!host) continue

    if (BLOCKED_TLDS.some((tld) => host.endsWith(tld))) {
      return { url: raw, host, matchedDomain: host }
    }

    const hit = blocked.find((b) => hostMatches(host, b))
    if (hit) return { url: raw, host, matchedDomain: hit }
  }

  return null
}
