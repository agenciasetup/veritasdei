import crypto from 'node:crypto'

function getSecret(): string {
  const secret = process.env.PARENTAL_CONSENT_SECRET || process.env.CRON_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[parental-token] PARENTAL_CONSENT_SECRET ausente — usando fallback de dev')
    return 'dev-parental-consent-secret'
  }
  throw new Error('parental_consent_secret_missing')
}

export function generateToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('base64url')
  return { token, tokenHash: hashToken(token) }
}

export function hashToken(token: string): string {
  return crypto.createHmac('sha256', getSecret()).update(token).digest('hex')
}

export function buildConsentUrl(baseUrl: string, token: string): string {
  const clean = baseUrl.replace(/\/$/, '')
  return `${clean}/consentimento-parental?token=${encodeURIComponent(token)}`
}
