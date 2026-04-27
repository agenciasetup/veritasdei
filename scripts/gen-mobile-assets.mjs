#!/usr/bin/env node
/**
 * Gera os ativos fonte para Android/iOS a partir do SVG do logo.
 *
 * Output em resources/ (input do @capacitor/assets):
 *   - icon-only.png (1024x1024, square c/ fundo dark) — ícone "as is"
 *     usado em Android <8 e fallback em iOS.
 *   - icon-foreground.png (1024x1024, transparente, logo com padding) —
 *     foreground do adaptive icon Android 8+; o launcher aplica máscara
 *     (circle/square/squircle) por cima.
 *   - icon-background.png (1024x1024, sólido #0A0A0A) — background do
 *     adaptive icon. Mantém marca consistente independente da máscara.
 *   - splash.png (2732x2732, logo centralizado no preto) — para
 *     splash screen (Capacitor escala pra cada densidade).
 *   - splash-dark.png (igual ao splash; tema dark único por enquanto).
 *
 * Como usar:
 *   node scripts/gen-mobile-assets.mjs
 *   npx capacitor-assets generate --android
 *   npm run cap:sync:android
 *
 * Requer sharp (já vem como transitive do Next).
 */

import sharp from 'sharp'
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC_SVG = path.join(ROOT, 'src/app/icon.svg')
const OUT_DIR = path.join(ROOT, 'resources')

const ICON_SIZE = 1024
const SPLASH_SIZE = 2732
const BG_COLOR = { r: 10, g: 10, b: 10, alpha: 1 } // #0A0A0A

// Logo no foreground/splash ocupa ~60% (deixa safe-area pra adaptive icon).
const FOREGROUND_LOGO_RATIO = 0.62
// Splash o logo é menor (~25% do canvas) — gera respiro.
const SPLASH_LOGO_RATIO = 0.28

await fs.mkdir(OUT_DIR, { recursive: true })

const svgBuffer = await fs.readFile(SRC_SVG)

async function makeIconOnly() {
  // Ícone normal: SVG renderizado direto no tamanho final, fundo já é
  // o preto do próprio SVG (circle).
  await sharp(svgBuffer, { density: 600 })
    .resize(ICON_SIZE, ICON_SIZE, { fit: 'contain', background: BG_COLOR })
    .png()
    .toFile(path.join(OUT_DIR, 'icon-only.png'))
  console.log('✓ icon-only.png')
}

async function makeIconForeground() {
  // Foreground tem fundo TRANSPARENTE (launcher coloca background sólido).
  // Logo ocupa FOREGROUND_LOGO_RATIO do canvas, centralizado.
  const logoSize = Math.round(ICON_SIZE * FOREGROUND_LOGO_RATIO)
  // Renderiza só o logo (sem o circle de fundo) — pra isso uso uma versão
  // do SVG sem o circle, mas como temos o SVG existente com circle, vou
  // só renderizar e descartar o canvas (manter o logo).
  // Solução simples: renderiza o SVG no tamanho do logo, depois compõe
  // num canvas transparente maior.
  const logoPng = await sharp(svgBuffer, { density: 600 })
    .resize(logoSize, logoSize, { fit: 'contain' })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: logoPng,
        left: Math.round((ICON_SIZE - logoSize) / 2),
        top: Math.round((ICON_SIZE - logoSize) / 2),
      },
    ])
    .png()
    .toFile(path.join(OUT_DIR, 'icon-foreground.png'))
  console.log('✓ icon-foreground.png (com logo + circle do svg incluso)')
}

async function makeIconBackground() {
  await sharp({
    create: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .png()
    .toFile(path.join(OUT_DIR, 'icon-background.png'))
  console.log('✓ icon-background.png')
}

async function makeSplash(filename) {
  const logoSize = Math.round(SPLASH_SIZE * SPLASH_LOGO_RATIO)
  const logoPng = await sharp(svgBuffer, { density: 600 })
    .resize(logoSize, logoSize, { fit: 'contain' })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: SPLASH_SIZE,
      height: SPLASH_SIZE,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([
      {
        input: logoPng,
        left: Math.round((SPLASH_SIZE - logoSize) / 2),
        top: Math.round((SPLASH_SIZE - logoSize) / 2),
      },
    ])
    .png()
    .toFile(path.join(OUT_DIR, filename))
  console.log(`✓ ${filename}`)
}

await makeIconOnly()
await makeIconForeground()
await makeIconBackground()
await makeSplash('splash.png')
await makeSplash('splash-dark.png')

console.log('\nResources gerados em resources/.')
console.log('Próximo passo:  npx capacitor-assets generate --android')
