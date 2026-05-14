/**
 * Cache de curta duração da entitlement no gate do Veritas Educa.
 *
 * O middleware do subdomínio educa.* consulta `get_user_entitlement` a
 * cada navegação pra decidir se o usuário já assinou. Isso é um round-trip
 * de DB por request. Pra aliviar, o resultado é guardado num cookie
 * assinado (HMAC-SHA256) com TTL curto: enquanto válido, o middleware
 * pula o RPC.
 *
 * O cookie é assinado com `SUPABASE_SERVICE_ROLE_KEY` (segredo só-server)
 * e amarrado ao `userId` — não dá pra forjar nem reaproveitar entre
 * contas. Ainda assim o TTL é curto: o gate é UX, a trava real é
 * server-side (`RequirePremium`).
 */

import type { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'vd-educa-ent'
const TTL_MS = 60_000 // 60s — curto o bastante pra refletir uma assinatura nova rápido

function signingKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

async function hmacHex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/**
 * Lê o cookie de cache. Retorna `true`/`false` (isPremium) se houver um
 * cache válido pra este `userId`, ou `null` se ausente / expirado /
 * adulterado — caso em que o chamador deve consultar o RPC.
 */
export async function readCachedEntitlement(
  request: NextRequest,
  userId: string,
): Promise<boolean | null> {
  const key = signingKey()
  if (!key) return null

  const raw = request.cookies.get(COOKIE_NAME)?.value
  if (!raw) return null

  const parts = raw.split('.')
  if (parts.length !== 3) return null
  const [flag, expStr, sig] = parts

  const expiresAt = Number(expStr)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null
  if (flag !== '1' && flag !== '0') return null

  const expected = await hmacHex(key, `${userId}.${flag}.${expStr}`)
  if (!timingSafeEqual(expected, sig)) return null

  return flag === '1'
}

/**
 * Grava o cookie de cache na resposta. Silencioso se o segredo de
 * assinatura não estiver configurado (cache simplesmente fica desligado).
 */
export async function writeCachedEntitlement(
  response: NextResponse,
  userId: string,
  isPremium: boolean,
): Promise<void> {
  const key = signingKey()
  if (!key) return

  const flag = isPremium ? '1' : '0'
  const expStr = String(Date.now() + TTL_MS)
  const sig = await hmacHex(key, `${userId}.${flag}.${expStr}`)

  response.cookies.set(COOKIE_NAME, `${flag}.${expStr}.${sig}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.ceil(TTL_MS / 1000),
  })
}
