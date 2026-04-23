import crypto from 'node:crypto'

function getSecret(): string {
  return process.env.PARENTAL_CONSENT_SECRET || process.env.CRON_SECRET || 'dev-parental-consent-secret'
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
