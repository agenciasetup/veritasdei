/**
 * Gera src/app/favicon.ico a partir de src/app/icon.svg.
 *
 * Empacota 3 PNGs (16, 32, 48) em um arquivo ICO multi-size.
 * Browsers legados e crawlers de link-preview usam o .ico como fallback
 * quando não suportam SVG.
 *
 * Uso:  npx tsx scripts/gen-favicon.mjs
 *   ou: node scripts/gen-favicon.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const svgPath = resolve(root, 'src/app/icon.svg')
const icoPath = resolve(root, 'src/app/favicon.ico')

const sizes = [16, 32, 48]

async function buildIco() {
  const svg = readFileSync(svgPath)
  const pngs = await Promise.all(
    sizes.map((size) =>
      sharp(svg)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
        .then((buffer) => ({ size, buffer })),
    ),
  )

  // ICONDIR: 6 bytes (reserved=0, type=1, count=N)
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)

  // ICONDIRENTRY: 16 bytes * N
  const entries = Buffer.alloc(16 * pngs.length)
  let offset = 6 + 16 * pngs.length
  pngs.forEach(({ size, buffer }, i) => {
    const base = i * 16
    entries.writeUInt8(size === 256 ? 0 : size, base + 0) // width
    entries.writeUInt8(size === 256 ? 0 : size, base + 1) // height
    entries.writeUInt8(0, base + 2) // palette
    entries.writeUInt8(0, base + 3) // reserved
    entries.writeUInt16LE(1, base + 4) // color planes
    entries.writeUInt16LE(32, base + 6) // bpp
    entries.writeUInt32LE(buffer.length, base + 8) // data size
    entries.writeUInt32LE(offset, base + 12) // data offset
    offset += buffer.length
  })

  const ico = Buffer.concat([header, entries, ...pngs.map((p) => p.buffer)])
  writeFileSync(icoPath, ico)
  console.log(`wrote ${icoPath} (${ico.length} bytes, sizes: ${sizes.join(', ')})`)
}

buildIco().catch((err) => {
  console.error(err)
  process.exit(1)
})
