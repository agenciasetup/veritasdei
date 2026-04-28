#!/usr/bin/env node
/**
 * Captura 8 screenshots do app Veritas Dei em viewport mobile real
 * (414x736, ratio 9:16 — formato Google Play Store) usando o Chrome
 * já instalado no sistema (sem baixar Chromium próprio).
 *
 * Uso:
 *   1. npm run dev  (em outro terminal — server local na porta 3000)
 *   2. node scripts/take-play-store-screenshots.mjs
 *
 * Saída em /tmp/play-store-screenshots/.
 *
 * Credenciais via env: VERITAS_LOGIN_EMAIL + VERITAS_LOGIN_PASSWORD
 * (ou edita os defaults abaixo).
 */

import { chromium } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE = 'http://localhost:3000'
const OUT_DIR = '/tmp/play-store-screenshots'
const EMAIL = process.env.VERITAS_LOGIN_EMAIL || 'drivesetup2020@gmail.com'
const PASSWORD = process.env.VERITAS_LOGIN_PASSWORD || 'Filipe10!'

// 8 telas pra Play Store. Ordem importa — a 1ª aparece em destaque na ficha.
const SHOTS = [
  { file: '01-home-rezar.png', url: '/', scrollY: 0 },
  { file: '02-rezar-propositos.png', url: '/rezar', scrollY: 280 },
  { file: '03-liturgia.png', url: '/liturgia', scrollY: 0 },
  { file: '04-formacao-premium.png', url: '/catecismo-pio-x', scrollY: 0 },
  { file: '05-perfil.png', url: '/perfil', scrollY: 0 },
  { file: '06-paywall.png', url: '/planos', scrollY: 0 },
  { file: '07-comunidade.png', url: '/comunidade', scrollY: 0 },
  { file: '08-igrejas.png', url: '/igrejas', scrollY: 0 },
]

async function hideDevOverlay(page) {
  await page.addStyleTag({
    content: `
      [data-nextjs-toast], [data-nextjs-dialog-overlay],
      nextjs-portal, [aria-label*="Dev Tools" i],
      [class*="dev-overlay" i] { display: none !important; }
    `,
  })
}

async function dismissModals(page) {
  const buttons = await page.$$('[role="dialog"] button')
  for (const b of buttons) {
    const text = (await b.textContent())?.trim() ?? ''
    if (/^(pular|fechar|entendi|ok)$/i.test(text)) {
      await b.click().catch(() => {})
    }
  }
}

await fs.mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch({
  executablePath: CHROME_PATH,
  headless: true,
})

const context = await browser.newContext({
  viewport: { width: 414, height: 736 },
  deviceScaleFactor: 2, // dobra resolução das imagens (828x1472 final)
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})

const page = await context.newPage()

console.log('[1/3] Login…')
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.fill('input[type="email"]', EMAIL)
await page.fill('input[type="password"]', PASSWORD)
// Submit pelo Enter (mais robusto que adivinhar qual botão é o real submit)
await page.press('input[type="password"]', 'Enter')
try {
  await page.waitForURL((u) => !new URL(u).pathname.startsWith('/login'), {
    timeout: 15000,
  })
} catch (err) {
  // Fallback: procura botão visível com texto ENTRAR (uppercase, no form)
  const enterBtn = await page.$('form button:has-text("ENTRAR")')
  if (enterBtn) {
    await enterBtn.click()
    await page.waitForURL(
      (u) => !new URL(u).pathname.startsWith('/login'),
      { timeout: 15000 },
    )
  } else {
    console.error('Login não saiu de /login. Body:', (await page.textContent('body'))?.slice(0, 400))
    throw err
  }
}
console.log('  ✓ logado, redirecionou para', page.url())

console.log('[2/3] Capturando 8 screenshots…')
for (const shot of SHOTS) {
  await page.goto(`${BASE}${shot.url}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800) // animações in-app (carrossel, fade-in)
  await hideDevOverlay(page)
  await dismissModals(page)
  await page.waitForTimeout(300)
  await page.evaluate((y) => window.scrollTo(0, y), shot.scrollY)
  await page.waitForTimeout(300)
  const out = path.join(OUT_DIR, shot.file)
  await page.screenshot({ path: out, type: 'png', fullPage: false })
  console.log(`  ✓ ${shot.file}`)
}

console.log('[3/3] Encerrando…')
await browser.close()
console.log(`\nPronto. ${SHOTS.length} arquivos em ${OUT_DIR}/`)
