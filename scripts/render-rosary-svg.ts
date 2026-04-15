/**
 * Renders the canonical rosary layout to a static SVG file for quick visual
 * inspection, without needing to run the Next dev server.
 *
 * Shares the pure layout function with the React component — anything you
 * see here is what the component will draw.
 *
 * Usage:
 *   npx tsx scripts/render-rosary-svg.ts
 *   npx tsx scripts/render-rosary-svg.ts --current decade-2-hail-mary-3
 *   npx tsx scripts/render-rosary-svg.ts --out /tmp/rosary.svg
 */

import { writeFileSync } from 'node:fs'
import {
  computeRosaryLayout,
  LAYOUT_CONSTANTS,
  type BeadLayout,
} from '../src/features/rosario/components/rosaryBeadsLayout'
import type { BeadId } from '../src/features/rosario/data/beadSequence'

interface Args {
  current: BeadId | null
  out: string
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  let current: BeadId | null = null
  let out = '/tmp/rosary-preview.svg'
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--current' && args[i + 1]) current = args[++i] as BeadId
    else if (args[i] === '--out' && args[i + 1]) out = args[++i]
  }
  return { current, out }
}

type BeadState = 'future' | 'current' | 'completed'

function renderBead(b: BeadLayout, state: BeadState): string {
  const fillColors: Record<BeadState, string> = {
    future: 'rgba(201,168,76,0.14)',
    current: '#D9C077',
    completed: 'rgba(201,168,76,0.32)',
  }
  const strokeColors: Record<BeadState, string> = {
    future: 'rgba(201,168,76,0.42)',
    current: '#D9C077',
    completed: 'rgba(201,168,76,0.55)',
  }
  const fill = fillColors[state]
  const stroke = strokeColors[state]
  const sw = state === 'current' ? 2 : 1

  if (b.kind === 'crucifix') {
    const s = b.r
    const glow =
      state === 'current'
        ? `<circle cx="${b.cx}" cy="${b.cy}" r="${s + 6}" fill="none" stroke="#D9C077" stroke-width="1" opacity="0.35" />`
        : ''
    return `${glow}
      <rect x="${b.cx - s * 0.17}" y="${b.cy - s}" width="${s * 0.34}" height="${s * 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="1" />
      <rect x="${b.cx - s * 0.65}" y="${b.cy - s * 0.17 + s * 0.2}" width="${s * 1.3}" height="${s * 0.34}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="1" />`
  }

  const glow =
    state === 'current'
      ? `<circle cx="${b.cx}" cy="${b.cy}" r="${b.r + 5}" fill="none" stroke="#D9C077" stroke-width="1" opacity="0.4" />`
      : ''
  return `${glow}<circle cx="${b.cx}" cy="${b.cy}" r="${b.r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" />`
}

function main() {
  const { current, out } = parseArgs()
  const layout = computeRosaryLayout()
  const C = LAYOUT_CONSTANTS

  const beads = layout
    .map((b) => renderBead(b, b.id === current ? 'current' : 'future'))
    .join('\n  ')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${C.viewBoxWidth} ${C.viewBoxHeight}">
  <rect width="100%" height="100%" fill="#0F0E0C" />
  <circle cx="${C.loopCenterX}" cy="${C.loopCenterY}" r="${C.loopRadius}" fill="none" stroke="rgba(201,168,76,0.22)" stroke-width="1" stroke-dasharray="1 5" />
  <line x1="${C.loopCenterX}" y1="${C.loopCenterY + C.loopRadius}" x2="${C.loopCenterX}" y2="${C.loopCenterY + C.loopRadius + 160}" stroke="rgba(201,168,76,0.22)" stroke-width="1" stroke-dasharray="1 5" />
  ${beads}
</svg>
`

  writeFileSync(out, svg, 'utf8')
  console.log(`Wrote ${layout.length} beads to ${out}${current ? ` (current: ${current})` : ''}`)
}

main()
