#!/usr/bin/env node
/**
 * Gera chaves VAPID (Voluntary Application Server Identification) para
 * Web Push + um CRON_SECRET aleatório.
 *
 * RODAR UMA VEZ. Cole o output no .env.local e nas env vars da Vercel
 * (Production + Preview). Se você regenerar em produção, todas as
 * subscriptions existentes ficam inválidas e o cliente precisa re-optin.
 */

import webpush from 'web-push'
import crypto from 'node:crypto'

const { publicKey, privateKey } = webpush.generateVAPIDKeys()
const cronSecret = crypto.randomBytes(32).toString('hex')

const lines = [
  '',
  '# ── Cole isto no .env.local e na Vercel (Production + Preview) ──',
  '',
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`,
  `VAPID_PRIVATE_KEY=${privateKey}`,
  'VAPID_SUBJECT=mailto:suporte@veritasdei.com.br',
  `CRON_SECRET=${cronSecret}`,
  '',
  '# ── Observações ──',
  '# • NEXT_PUBLIC_VAPID_PUBLIC_KEY vai pro browser (PushManager.subscribe).',
  '# • VAPID_PRIVATE_KEY nunca deixa o servidor — NUNCA commitar.',
  '# • VAPID_SUBJECT é um contato (obrigatório por RFC 8292).',
  '# • CRON_SECRET protege /api/cron/* e /api/novenas/reminders.',
  '# • Não regenere em produção sem invalidar push_endpoint de todos os usuários.',
  '',
]

console.log(lines.join('\n'))
