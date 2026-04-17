/**
 * Renderiza um card de compartilhamento 1080×1350 (formato story/post
 * vertical) a partir de um VeritasPost. Roda 100% no cliente via Canvas
 * 2D — sem round-trip de servidor, sem dependências novas.
 *
 * Visual: fundo preto profundo (`#0F0E0C`) com dois glows vinho em
 * gradiente radial (topo-esquerdo e base-direita), cruz dourada no
 * topo, card do post no meio com avatar/nome/corpo/ações, e "VERITAS DEI"
 * em Cinzel no rodapé — identidade consistente com o produto.
 *
 * Avatar: carregado com CORS anônimo; se tombar, desenha só o placeholder.
 * Fontes: aguarda `document.fonts.ready` pra usar Poppins/Cinzel; se a
 * rede for lenta, cai nos fallbacks do OS.
 */

import type { VeritasPost } from '@/lib/community/types'

export const SHARE_IMAGE_WIDTH = 1080
export const SHARE_IMAGE_HEIGHT = 1350

const BG = '#0F0E0C'
const WINE = '107,29,42'
const GOLD = '#C9A84C'
const GOLD_SOFT = '#D9C077'
const TEXT_PRIMARY = '#F2EDE4'
const TEXT_MUTED = '#8A8378'
const LIKE = '#D94F5C'
const REPOST = '#66BB6A'

// Paths lucide (viewBox 24×24, stroke 2 padrão).
const ICON_PATHS = {
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  // Repeat2 como dois arcos + setas (simplificado)
  repeat: 'M17 2l4 4-4 4 M3 11v-1a4 4 0 0 1 4-4h14 M7 22l-4-4 4-4 M21 13v1a4 4 0 0 1-4 4H3',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  quote: 'M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2zM5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z',
  send: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zM22 2 11 13',
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = url
  })
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  // Reproduz a geometria do CrossIcon (36×52 viewBox). "size" é a altura.
  const unit = size / 52
  const bx = cx - 18 * unit
  const by = cy - 26 * unit

  const grad = ctx.createLinearGradient(cx, by, cx, by + 52 * unit)
  grad.addColorStop(0, '#D9C077')
  grad.addColorStop(0.5, '#C9A84C')
  grad.addColorStop(1, '#A88B3A')

  ctx.fillStyle = grad

  // Vertical beam
  roundedRectPath(ctx, bx + 14 * unit, by + 0 * unit, 8 * unit, 52 * unit, 1.5 * unit)
  ctx.fill()

  // Horizontal beam
  roundedRectPath(ctx, bx + 0 * unit, by + 14 * unit, 36 * unit, 8 * unit, 1.5 * unit)
  ctx.fill()

  // Jewel
  ctx.fillStyle = '#6B1D2A'
  ctx.beginPath()
  ctx.arc(bx + 18 * unit, by + 18 * unit, 3 * unit, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#C9A84C'
  ctx.lineWidth = 1 * unit
  ctx.stroke()

  // Finials
  ctx.fillStyle = 'rgba(201,168,76,0.6)'
  for (const [fx, fy] of [[18, 2], [18, 50], [2, 18], [34, 18]]) {
    ctx.beginPath()
    ctx.arc(bx + fx * unit, by + fy * unit, 1.5 * unit, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  pathStr: string,
  x: number,
  y: number,
  size: number,
  color: string,
  fill = false,
) {
  const scale = size / 24
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const path = new Path2D(pathStr)
  if (fill) ctx.fill(path)
  ctx.stroke(path)
  ctx.restore()
}

function drawVerifiedBadge(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  // Círculo dourado com check branco.
  ctx.fillStyle = '#C9A84C'
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#0A0A0A'
  ctx.lineWidth = radius * 0.28
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - radius * 0.38, cy + radius * 0.05)
  ctx.lineTo(cx - radius * 0.08, cy + radius * 0.34)
  ctx.lineTo(cx + radius * 0.42, cy - radius * 0.26)
  ctx.stroke()
}

interface WrapOptions {
  x: number
  y: number
  maxWidth: number
  lineHeight: number
  maxLines?: number
  font: string
  color: string
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, opts: WrapOptions): number {
  ctx.font = opts.font
  ctx.fillStyle = opts.color
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  // Quebra por \n primeiro, depois por palavras.
  const paragraphs = text.split('\n')
  const lines: string[] = []

  for (const para of paragraphs) {
    if (!para) { lines.push(''); continue }
    const words = para.split(/\s+/)
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (ctx.measureText(candidate).width <= opts.maxWidth) {
        current = candidate
      } else {
        if (current) lines.push(current)
        // Palavra única maior que o maxWidth: quebra pelos chars.
        if (ctx.measureText(word).width > opts.maxWidth) {
          let chunk = ''
          for (const ch of word) {
            const next = chunk + ch
            if (ctx.measureText(next).width <= opts.maxWidth) chunk = next
            else {
              lines.push(chunk)
              chunk = ch
            }
          }
          current = chunk
        } else {
          current = word
        }
      }
    }
    if (current) lines.push(current)
  }

  const maxLines = opts.maxLines ?? lines.length
  const visible = lines.slice(0, maxLines)
  const truncated = lines.length > maxLines

  visible.forEach((line, idx) => {
    let drawn = line
    if (truncated && idx === visible.length - 1) {
      // Adiciona ellipsis se cortado.
      while (drawn && ctx.measureText(drawn + '…').width > opts.maxWidth) {
        drawn = drawn.slice(0, -1)
      }
      drawn = `${drawn}…`
    }
    ctx.fillText(drawn, opts.x, opts.y + idx * opts.lineHeight)
  })

  return visible.length * opts.lineHeight
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`
  return `${Math.floor(n / 1000)}k`
}

async function ensureFontsReady(): Promise<void> {
  try {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready
    }
  } catch {
    // noop
  }
}

export interface RenderShareCardOptions {
  post: VeritasPost
}

export async function renderShareCard({ post }: RenderShareCardOptions): Promise<Blob> {
  await ensureFontsReady()

  const canvas = document.createElement('canvas')
  canvas.width = SHARE_IMAGE_WIDTH
  canvas.height = SHARE_IMAGE_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unsupported')

  // ── 1. Fundo base + glows vinho ─────────────────────────────────
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT)

  const g1 = ctx.createRadialGradient(-100, -100, 40, -100, -100, 900)
  g1.addColorStop(0, `rgba(${WINE},0.45)`)
  g1.addColorStop(0.6, `rgba(${WINE},0.10)`)
  g1.addColorStop(1, `rgba(${WINE},0)`)
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT)

  const g2 = ctx.createRadialGradient(
    SHARE_IMAGE_WIDTH + 100, SHARE_IMAGE_HEIGHT + 80, 40,
    SHARE_IMAGE_WIDTH + 100, SHARE_IMAGE_HEIGHT + 80, 950,
  )
  g2.addColorStop(0, `rgba(${WINE},0.40)`)
  g2.addColorStop(0.6, `rgba(${WINE},0.08)`)
  g2.addColorStop(1, `rgba(${WINE},0)`)
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT)

  // ── 2. Cruz dourada no topo ─────────────────────────────────────
  drawCross(ctx, SHARE_IMAGE_WIDTH / 2, 185, 130)

  // ── 3. Card do post (centralizado verticalmente) ───────────────
  const cardW = 920
  const cardH = 520
  const cardX = (SHARE_IMAGE_WIDTH - cardW) / 2
  const cardY = Math.round((SHARE_IMAGE_HEIGHT - cardH) / 2) + 30

  ctx.fillStyle = 'rgba(20,18,14,0.58)'
  roundedRectPath(ctx, cardX, cardY, cardW, cardH, 28)
  ctx.fill()
  ctx.strokeStyle = 'rgba(201,168,76,0.18)'
  ctx.lineWidth = 1
  ctx.stroke()

  // ── 4. Avatar circular ──────────────────────────────────────────
  const avatarSize = 80
  const avatarX = cardX + 44
  const avatarY = cardY + 44

  ctx.save()
  ctx.beginPath()
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
  ctx.clip()

  let avatarDrawn = false
  if (post.author.profile_image_url) {
    try {
      const img = await loadImage(post.author.profile_image_url)
      ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize)
      avatarDrawn = true
    } catch {
      // fallback abaixo
    }
  }
  if (!avatarDrawn) {
    ctx.fillStyle = 'rgba(201,168,76,0.12)'
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize)
    // Pequena cruz dourada centralizada no placeholder.
    ctx.restore()
    drawCross(ctx, avatarX + avatarSize / 2, avatarY + avatarSize / 2, 40)
    ctx.save()
  }
  ctx.restore()

  // Borda dourada sutil se verificado
  if (post.author.verified) {
    ctx.strokeStyle = 'rgba(233,196,106,0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ── 5. Nome + badge verificado + handle ────────────────────────
  const textX = avatarX + avatarSize + 24
  const name = post.author.name ?? 'Membro Veritas'
  ctx.font = '600 34px Poppins, system-ui, sans-serif'
  ctx.fillStyle = TEXT_PRIMARY
  ctx.textBaseline = 'top'
  ctx.fillText(name, textX, avatarY + 4)

  if (post.author.verified) {
    const nameWidth = ctx.measureText(name).width
    drawVerifiedBadge(ctx, textX + nameWidth + 22, avatarY + 24, 13)
  }

  const handle = post.author.public_handle
    ? `@${post.author.public_handle}`
    : `#${post.author.user_number ?? 'sem-handle'}`
  ctx.font = '400 24px Poppins, system-ui, sans-serif'
  ctx.fillStyle = TEXT_MUTED
  ctx.fillText(handle, textX, avatarY + 48)

  // ── 6. Corpo do post ───────────────────────────────────────────
  const bodyX = cardX + 44
  const bodyY = avatarY + avatarSize + 32
  const bodyMaxW = cardW - 88
  // Remove marcação markdown simples pra evitar **asteriscos** visíveis.
  const plainBody = post.body
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/(?<![*\w])\*([^\n*]+?)\*(?!\w)/g, '$1')

  wrapText(ctx, plainBody, {
    x: bodyX,
    y: bodyY,
    maxWidth: bodyMaxW,
    lineHeight: 44,
    maxLines: 6,
    font: '400 30px Poppins, system-ui, sans-serif',
    color: TEXT_PRIMARY,
  })

  // ── 7. Barra de ações (ícones + contagens) ──────────────────────
  const actionsY = cardY + cardH - 70
  const actionSpacing = 125
  const iconSize = 30
  const labelFont = '500 22px Poppins, system-ui, sans-serif'
  const textColor = TEXT_MUTED

  const m = post.metrics
  const viewer = post.viewer
  const actions: Array<{ key: string; icon: string; count: number; color: string; fill: boolean }> = [
    { key: 'reply',  icon: ICON_PATHS.chat,   count: m.reply_count,        color: textColor,                                  fill: false },
    { key: 'repost', icon: ICON_PATHS.repeat, count: m.repost_count,       color: viewer.reposted ? REPOST : textColor,       fill: false },
    { key: 'like',   icon: ICON_PATHS.heart,  count: m.like_count,         color: viewer.liked ? LIKE : textColor,            fill: viewer.liked },
    { key: 'quote',  icon: ICON_PATHS.quote,  count: m.quote_count,        color: textColor,                                  fill: false },
    { key: 'send',   icon: ICON_PATHS.send,   count: m.share_cross_count,  color: viewer.shared_cross ? GOLD : textColor,     fill: false },
  ]

  let ax = cardX + 44
  for (const action of actions) {
    drawIcon(ctx, action.icon, ax, actionsY, iconSize, action.color, action.fill)
    if (action.count > 0) {
      ctx.font = labelFont
      ctx.fillStyle = action.color
      ctx.textBaseline = 'top'
      ctx.fillText(formatCount(action.count), ax + iconSize + 10, actionsY + 3)
    }
    ax += actionSpacing
  }

  // ── 8. Rodapé: linha faded + VERITAS DEI ────────────────────────
  const footerY = SHARE_IMAGE_HEIGHT - 70
  const lineY = footerY - 30
  const lineWidth = 280
  const lineX = (SHARE_IMAGE_WIDTH - lineWidth) / 2
  const lineGrad = ctx.createLinearGradient(lineX, lineY, lineX + lineWidth, lineY)
  lineGrad.addColorStop(0, 'rgba(201,168,76,0)')
  lineGrad.addColorStop(0.5, 'rgba(201,168,76,0.45)')
  lineGrad.addColorStop(1, 'rgba(201,168,76,0)')
  ctx.fillStyle = lineGrad
  ctx.fillRect(lineX, lineY, lineWidth, 1)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // "VERITAS" em Cinzel dourado + "DEI" em Cinzel cor mais suave.
  ctx.font = '400 32px Cinzel, Georgia, serif'
  const veritas = 'VERITAS'
  const dei = ' DEI'
  const veritasW = ctx.measureText(veritas).width
  ctx.font = '400 32px Cinzel, Georgia, serif'
  const deiW = ctx.measureText(dei).width
  const totalW = veritasW + deiW
  const startX = (SHARE_IMAGE_WIDTH - totalW) / 2 + veritasW / 2

  ctx.textAlign = 'center'
  ctx.fillStyle = GOLD_SOFT
  ctx.fillText(veritas, startX, footerY)
  ctx.fillStyle = 'rgba(242,237,228,0.72)'
  ctx.fillText(dei, startX + veritasW / 2 + deiW / 2, footerY)

  // ── 9. Export ──────────────────────────────────────────────────
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('toBlob_failed'))
        else resolve(blob)
      },
      'image/png',
      0.92,
    )
  })
}
