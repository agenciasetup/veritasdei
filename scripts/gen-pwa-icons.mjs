#!/usr/bin/env node
/**
 * Gera ícones PNG para PWA + push notifications a partir do icon.svg.
 *
 *   public/icons/icon-192.png           ← manifest + push icon
 *   public/icons/icon-512.png           ← manifest (splash)
 *   public/icons/icon-maskable-512.png  ← manifest purpose=maskable
 *   public/icons/apple-touch-icon.png   ← iOS home screen (180×180)
 *   public/icons/badge-72.png           ← push badge (Android status bar)
 *
 * Uso: node scripts/gen-pwa-icons.mjs
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const svgPath = resolve(root, 'public/icon.svg') // já tem background dark
const outDir = resolve(root, 'public/icons')

mkdirSync(outDir, { recursive: true })

const svg = readFileSync(svgPath)

async function renderPng(size, filename, opts = {}) {
  const pipeline = sharp(svg, { density: 384 })
    .resize(size, size, {
      fit: 'contain',
      background: opts.background || { r: 10, g: 10, b: 10, alpha: 1 },
    })
    .png()
  const buffer = await pipeline.toBuffer()
  const out = resolve(outDir, filename)
  writeFileSync(out, buffer)
  console.log(`  → ${filename} (${buffer.length} bytes)`)
}

async function main() {
  console.log('Gerando ícones PWA em public/icons/…')
  await Promise.all([
    renderPng(192, 'icon-192.png'),
    renderPng(512, 'icon-512.png'),
    renderPng(512, 'icon-maskable-512.png'),
    renderPng(180, 'apple-touch-icon.png'),
    renderPng(72, 'badge-72.png', {
      background: { r: 10, g: 10, b: 10, alpha: 0 },
    }),
  ])
  console.log('✓ Pronto.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
