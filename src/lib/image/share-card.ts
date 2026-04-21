/**
 * Renderiza um card de compartilhamento vertical (post 1080×1350 ou
 * story 1080×1920) a partir de um VeritasPost. Roda 100% no cliente
 * via Canvas 2D — sem round-trip de servidor, sem dependências novas.
 *
 * Visual: fundo preto profundo (`#0F0E0C`) com dois glows vinho em
 * gradiente radial (topo-esquerdo e base-direita), cruz dourada
 * discreta no topo, card do post no meio com avatar/nome/corpo/mídia/
 * ações, e "VERITAS DEI" em Cinzel no rodapé.
 *
 * Layout adaptativo: o card cresce conforme o conteúdo (corpo + mídia).
 * A fonte do corpo diminui em thresholds (500/700/900 chars) e ainda
 * cai um extra se não couber no espaço disponível — o texto sempre
 * aparece inteiro.
 */

import type { VeritasPost } from '@/lib/community/types'

export type ShareCardFormat = 'post' | 'story'

export const SHARE_IMAGE_WIDTH = 1080
export const SHARE_IMAGE_POST_HEIGHT = 1350
export const SHARE_IMAGE_STORY_HEIGHT = 1920

/** Mantido por compatibilidade — altura padrão do formato post. */
export const SHARE_IMAGE_HEIGHT = SHARE_IMAGE_POST_HEIGHT

export function getShareImageHeight(format: ShareCardFormat): number {
  return format === 'story' ? SHARE_IMAGE_STORY_HEIGHT : SHARE_IMAGE_POST_HEIGHT
}

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
  repeat: 'M17 2l4 4-4 4 M3 11v-1a4 4 0 0 1 4-4h14 M7 22l-4-4 4-4 M21 13v1a4 4 0 0 1-4 4H3',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
  quote: 'M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2zM5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z',
  send: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zM22 2 11 13',
}

// Dimensões base do card. A altura é calculada dinamicamente.
const CARD_W = 920
const CARD_PAD_X = 44
const CARD_PAD_Y = 44
const AVATAR_SIZE = 80
const HEADER_BOTTOM_GAP = 32
const ACTIONS_HEIGHT = 44
const BODY_ACTIONS_GAP = 32
const MEDIA_BODY_GAP = 24
const MEDIA_HEIGHT = 420

// Tipografia do corpo — base 30px, diminui 1px a cada threshold de
// tamanho e pode cair mais via auto-fit se ainda não couber.
const BODY_BASE_SIZE = 30
const BODY_MIN_SIZE = 18
/** Razão altura-da-linha / tamanho da fonte (44/30 ≈ 1.467). */
const BODY_LINE_RATIO = 44 / 30

/** Imagem carregada pronta pra `ctx.drawImage` com width/height. */
type DrawableImage = (CanvasImageSource & { width: number; height: number })

/** Adiciona um query param pra forçar request novo e evitar cache de response sem CORS. */
function withCorsBust(url: string): string {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}_vdcors=1`
}

/**
 * Carrega uma imagem pronta pra desenhar no canvas.
 *
 * Estratégia em camadas pra contornar o bug clássico: quando o
 * browser cacheia a imagem via `<img>` normal (sem Origin header), o
 * response entra no cache sem `Access-Control-Allow-Origin`. Uma
 * request posterior com `crossOrigin='anonymous'` falha no CORS
 * check mesmo quando o CDN enviaria os headers normalmente.
 *
 * Solução: 1) adiciona `?_vdcors=1` pra bypassar o cache existente;
 * 2) usa `<img crossOrigin='anonymous'>` — caminho direto e
 * compatível com AVIF/WebP; 3) se falhar, cai no fetch+
 * createImageBitmap; 4) por último, fetch+blob URL via `<img>`.
 */
async function loadImage(url: string): Promise<DrawableImage> {
  const bustedUrl = withCorsBust(url)

  // Tentativa 1: <img crossOrigin='anonymous'> com cache-bust.
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('crossorigin_img_failed'))
      img.src = bustedUrl
    })
  } catch (e1) {
    if (typeof console !== 'undefined') console.warn('[share-card] crossOrigin img falhou, tentando fetch', bustedUrl, e1)
  }

  // Tentativa 2: fetch + createImageBitmap.
  try {
    const res = await fetch(bustedUrl, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) throw new Error(`http_${res.status}`)
    const blob = await res.blob()
    if (typeof createImageBitmap === 'function') {
      try {
        return await createImageBitmap(blob)
      } catch (bmpErr) {
        if (typeof console !== 'undefined') console.warn('[share-card] createImageBitmap falhou, tentando blob URL', bmpErr)
      }
    }
    // Tentativa 3: blob URL via <img>.
    const objUrl = URL.createObjectURL(blob)
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('blob_image_failed'))
        img.src = objUrl
      })
    } finally {
      setTimeout(() => URL.revokeObjectURL(objUrl), 2000)
    }
  } catch (e2) {
    if (typeof console !== 'undefined') console.warn('[share-card] todas as tentativas falharam', bustedUrl, e2)
    throw e2
  }
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
  const unit = size / 52
  const bx = cx - 18 * unit
  const by = cy - 26 * unit

  const grad = ctx.createLinearGradient(cx, by, cx, by + 52 * unit)
  grad.addColorStop(0, '#D9C077')
  grad.addColorStop(0.5, '#C9A84C')
  grad.addColorStop(1, '#A88B3A')
  ctx.fillStyle = grad

  roundedRectPath(ctx, bx + 14 * unit, by + 0 * unit, 8 * unit, 52 * unit, 1.5 * unit)
  ctx.fill()
  roundedRectPath(ctx, bx + 0 * unit, by + 14 * unit, 36 * unit, 8 * unit, 1.5 * unit)
  ctx.fill()

  ctx.fillStyle = '#6B1D2A'
  ctx.beginPath()
  ctx.arc(bx + 18 * unit, by + 18 * unit, 3 * unit, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#C9A84C'
  ctx.lineWidth = 1 * unit
  ctx.stroke()

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

/** Calcula linhas visíveis (sem desenhar) — útil pra dimensionar o card. */
function measureLines(ctx: CanvasRenderingContext2D, text: string, font: string, maxWidth: number, maxLines: number): string[] {
  ctx.font = font
  const paragraphs = text.split('\n')
  const lines: string[] = []

  for (const para of paragraphs) {
    if (!para) { lines.push(''); continue }
    const words = para.split(/\s+/)
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate
      } else {
        if (current) lines.push(current)
        if (ctx.measureText(word).width > maxWidth) {
          let chunk = ''
          for (const ch of word) {
            const next = chunk + ch
            if (ctx.measureText(next).width <= maxWidth) chunk = next
            else { lines.push(chunk); chunk = ch }
          }
          current = chunk
        } else {
          current = word
        }
      }
    }
    if (current) lines.push(current)
  }

  return lines.slice(0, maxLines).map((line, idx, all) => {
    const isLast = idx === all.length - 1
    if (isLast && lines.length > maxLines) {
      let drawn = line
      while (drawn && ctx.measureText(drawn + '…').width > maxWidth) drawn = drawn.slice(0, -1)
      return `${drawn}…`
    }
    return line
  })
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  opts: Omit<WrapOptions, 'maxLines'>,
) {
  ctx.font = opts.font
  ctx.fillStyle = opts.color
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  lines.forEach((line, idx) => {
    ctx.fillText(line, opts.x, opts.y + idx * opts.lineHeight)
  })
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

/** Retângulo pra uma célula do grid em coordenadas absolutas. */
interface GridCell { x: number; y: number; w: number; h: number }

/**
 * Divide um retângulo w×h em até 4 células com gap de 12px. Layouts:
 * 1 = full · 2 = 2 col · 3 = big left + 2 stacked right · 4 = 2×2.
 */
function computeMediaCells(x: number, y: number, w: number, h: number, count: number): GridCell[] {
  const gap = 12
  if (count <= 1) return [{ x, y, w, h }]
  if (count === 2) {
    const cellW = (w - gap) / 2
    return [
      { x, y, w: cellW, h },
      { x: x + cellW + gap, y, w: cellW, h },
    ]
  }
  if (count === 3) {
    const leftW = (w - gap) / 2
    const rightW = w - gap - leftW
    const rightH = (h - gap) / 2
    return [
      { x, y, w: leftW, h },
      { x: x + leftW + gap, y, w: rightW, h: rightH },
      { x: x + leftW + gap, y: y + rightH + gap, w: rightW, h: rightH },
    ]
  }
  // 4+
  const cellW = (w - gap) / 2
  const cellH = (h - gap) / 2
  return [
    { x, y, w: cellW, h: cellH },
    { x: x + cellW + gap, y, w: cellW, h: cellH },
    { x, y: y + cellH + gap, w: cellW, h: cellH },
    { x: x + cellW + gap, y: y + cellH + gap, w: cellW, h: cellH },
  ]
}

/**
 * Desenha até 4 imagens de mídia no grid dentro do card. Carrega em
 * paralelo; se uma falhar, desenha um retângulo translúcido no lugar
 * pra manter o layout.
 */
async function drawMediaGrid(
  ctx: CanvasRenderingContext2D,
  urls: string[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const count = Math.min(urls.length, 4)
  if (count === 0) return

  const cells = computeMediaCells(x, y, width, height, count)
  const images = await Promise.all(urls.slice(0, count).map(url => loadImage(url).catch(() => null)))

  for (let i = 0; i < count; i++) {
    const cell = cells[i]
    ctx.save()
    roundedRectPath(ctx, cell.x, cell.y, cell.w, cell.h, 16)
    ctx.clip()
    const img = images[i]
    if (img) {
      // Cover: escalona pra preencher cell.w×cell.h preservando aspect.
      const scale = Math.max(cell.w / img.width, cell.h / img.height)
      const drawW = img.width * scale
      const drawH = img.height * scale
      const dx = cell.x + (cell.w - drawW) / 2
      const dy = cell.y + (cell.h - drawH) / 2
      ctx.drawImage(img, dx, dy, drawW, drawH)
    } else {
      ctx.fillStyle = 'rgba(201,168,76,0.08)'
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h)
    }
    ctx.restore()
    ctx.strokeStyle = 'rgba(201,168,76,0.14)'
    ctx.lineWidth = 1
    roundedRectPath(ctx, cell.x, cell.y, cell.w, cell.h, 16)
    ctx.stroke()
  }
}

// ── Parent compacto (quote/repost) ──────────────────────────────
const PARENT_PAD_X = 24
const PARENT_PAD_Y = 20
const PARENT_AVATAR = 44
const PARENT_HEADER_BOTTOM = 14
const PARENT_BODY_SIZE = 22
const PARENT_LINE_HEIGHT = 32
const PARENT_MAX_LINES = 4

interface ParentMiniDimensions {
  width: number
  height: number
}

function measureParentMini(
  ctx: CanvasRenderingContext2D,
  parent: NonNullable<VeritasPost['parent']>,
  width: number,
): ParentMiniDimensions {
  const textMaxW = width - PARENT_PAD_X * 2
  const plain = parent.body
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/(?<![*\w])\*([^\n*]+?)\*(?!\w)/g, '$1')
  const font = `400 ${PARENT_BODY_SIZE}px Poppins, system-ui, sans-serif`
  const lines = plain.trim()
    ? measureLines(ctx, plain, font, textMaxW, PARENT_MAX_LINES)
    : []
  const hasMedia = parent.media.length > 0
  const mediaHint = hasMedia ? 20 : 0
  const height =
    PARENT_PAD_Y * 2
    + PARENT_AVATAR
    + PARENT_HEADER_BOTTOM
    + lines.length * PARENT_LINE_HEIGHT
    + mediaHint
  return { width, height }
}

function drawParentMini(
  ctx: CanvasRenderingContext2D,
  parent: NonNullable<VeritasPost['parent']>,
  x: number,
  y: number,
  width: number,
  height: number,
  avatar: DrawableImage | null,
) {
  // Moldura do mini-card.
  ctx.fillStyle = 'rgba(14,12,10,0.55)'
  roundedRectPath(ctx, x, y, width, height, 18)
  ctx.fill()
  ctx.strokeStyle = 'rgba(201,168,76,0.22)'
  ctx.lineWidth = 1
  ctx.stroke()

  // Avatar do autor do parent.
  const avX = x + PARENT_PAD_X
  const avY = y + PARENT_PAD_Y
  ctx.save()
  ctx.beginPath()
  ctx.arc(avX + PARENT_AVATAR / 2, avY + PARENT_AVATAR / 2, PARENT_AVATAR / 2, 0, Math.PI * 2)
  ctx.clip()
  if (avatar) {
    const scale = Math.max(PARENT_AVATAR / avatar.width, PARENT_AVATAR / avatar.height)
    const drawW = avatar.width * scale
    const drawH = avatar.height * scale
    ctx.drawImage(avatar, avX + (PARENT_AVATAR - drawW) / 2, avY + (PARENT_AVATAR - drawH) / 2, drawW, drawH)
  } else {
    ctx.fillStyle = 'rgba(201,168,76,0.12)'
    ctx.fillRect(avX, avY, PARENT_AVATAR, PARENT_AVATAR)
  }
  ctx.restore()

  // Nome + handle inline.
  const nameX = avX + PARENT_AVATAR + 14
  const name = parent.author.name ?? 'Membro Veritas'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.font = '600 22px Poppins, system-ui, sans-serif'
  ctx.fillStyle = TEXT_PRIMARY
  ctx.fillText(name, nameX, avY + 2)

  const nameWidth = ctx.measureText(name).width
  const handle = parent.author.public_handle
    ? `@${parent.author.public_handle}`
    : `#${parent.author.user_number ?? ''}`
  ctx.font = '400 18px Poppins, system-ui, sans-serif'
  ctx.fillStyle = TEXT_MUTED
  ctx.fillText(handle, nameX + nameWidth + 10, avY + 6)

  // Corpo.
  const textMaxW = width - PARENT_PAD_X * 2
  const plain = parent.body
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/(?<![*\w])\*([^\n*]+?)\*(?!\w)/g, '$1')
  const font = `400 ${PARENT_BODY_SIZE}px Poppins, system-ui, sans-serif`
  const lines = plain.trim()
    ? measureLines(ctx, plain, font, textMaxW, PARENT_MAX_LINES)
    : []
  if (lines.length > 0) {
    drawLines(ctx, lines, {
      x: x + PARENT_PAD_X,
      y: avY + PARENT_AVATAR + PARENT_HEADER_BOTTOM,
      maxWidth: textMaxW,
      lineHeight: PARENT_LINE_HEIGHT,
      font,
      color: 'rgba(242,237,228,0.88)',
    })
  }

  // Indicador de mídia no parent (se houver).
  if (parent.media.length > 0) {
    const hintY = avY + PARENT_AVATAR + PARENT_HEADER_BOTTOM + lines.length * PARENT_LINE_HEIGHT + 2
    ctx.font = '500 16px Poppins, system-ui, sans-serif'
    ctx.fillStyle = 'rgba(201,168,76,0.75)'
    const label = parent.media.length === 1 ? '[ imagem ]' : `[ ${parent.media.length} imagens ]`
    ctx.fillText(label, x + PARENT_PAD_X, hintY)
  }
}

export interface RenderShareCardOptions {
  post: VeritasPost
  /** 'post' = 1080×1350 (default), 'story' = 1080×1920. */
  format?: ShareCardFormat
}

/**
 * Descobre fonte e altura-de-linha do corpo a partir do tamanho do
 * texto. Regra: base 30px; −1px em 500, 700 e 900 chars.
 * O auto-fit depois pode reduzir ainda mais até caber.
 */
function initialBodySize(textLength: number): number {
  let size = BODY_BASE_SIZE
  if (textLength >= 500) size -= 1
  if (textLength >= 700) size -= 1
  if (textLength >= 900) size -= 1
  return size
}

export async function renderShareCard({ post, format = 'post' }: RenderShareCardOptions): Promise<Blob> {
  await ensureFontsReady()

  const height = getShareImageHeight(format)

  const canvas = document.createElement('canvas')
  canvas.width = SHARE_IMAGE_WIDTH
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unsupported')

  // ── 1. Fundo base + glows vinho ─────────────────────────────────
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, SHARE_IMAGE_WIDTH, height)

  const g1 = ctx.createRadialGradient(-100, -100, 40, -100, -100, 1100)
  g1.addColorStop(0, `rgba(${WINE},0.45)`)
  g1.addColorStop(0.6, `rgba(${WINE},0.10)`)
  g1.addColorStop(1, `rgba(${WINE},0)`)
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, SHARE_IMAGE_WIDTH, height)

  const g2 = ctx.createRadialGradient(
    SHARE_IMAGE_WIDTH + 100, height + 80, 40,
    SHARE_IMAGE_WIDTH + 100, height + 80, 1150,
  )
  g2.addColorStop(0, `rgba(${WINE},0.40)`)
  g2.addColorStop(0.6, `rgba(${WINE},0.08)`)
  g2.addColorStop(1, `rgba(${WINE},0)`)
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, SHARE_IMAGE_WIDTH, height)

  // ── 2. Cruz discreta no topo ────────────────────────────────────
  const crossY = format === 'story' ? 150 : 110
  drawCross(ctx, SHARE_IMAGE_WIDTH / 2, crossY, 56)

  // ── 3. Medições pra altura adaptativa do card ──────────────────
  const bodyMaxW = CARD_W - CARD_PAD_X * 2
  const plainBody = post.body
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/(?<![*\w])\*([^\n*]+?)\*(?!\w)/g, '$1')

  const hasMedia = post.media.length > 0
  const mediaHeight = hasMedia ? MEDIA_HEIGHT : 0
  const hasParent = post.kind === 'quote' && post.parent != null
  const parentDims = hasParent
    ? measureParentMini(ctx, post.parent!, CARD_W - CARD_PAD_X * 2)
    : null
  const parentGap = hasParent ? 20 : 0

  // Espaço vertical útil pro card dentro do quadro (entre cruz e rodapé).
  const topBound = format === 'story' ? 260 : 180
  const bottomBound = height - (format === 'story' ? 190 : 170)
  const available = bottomBound - topBound

  // Espaço máximo que o corpo pode ocupar dentro do card.
  const nonBodyHeight =
    CARD_PAD_Y * 2
    + AVATAR_SIZE
    + HEADER_BOTTOM_GAP
    + (hasMedia ? MEDIA_BODY_GAP + mediaHeight : 0)
    + (parentDims ? parentGap + parentDims.height : 0)
    + BODY_ACTIONS_GAP
    + ACTIONS_HEIGHT
  const maxBodyHeight = Math.max(0, available - nonBodyHeight)

  // Descobre fonte/altura-de-linha + nº de linhas, encolhendo até caber.
  let bodySize = initialBodySize(plainBody.length)
  let bodyLineHeight = Math.round(bodySize * BODY_LINE_RATIO)
  let bodyFont = `400 ${bodySize}px Poppins, system-ui, sans-serif`
  let bodyLines: string[] = []

  if (plainBody.trim()) {
    // Conta total de linhas necessárias (sem truncar).
    const measureAll = (size: number): string[] => {
      const font = `400 ${size}px Poppins, system-ui, sans-serif`
      return measureLines(ctx, plainBody, font, bodyMaxW, 9999)
    }

    bodyLines = measureAll(bodySize)
    // Se não cabe no espaço reservado, diminui 1px até caber (ou min).
    while (
      bodyLines.length * Math.round(bodySize * BODY_LINE_RATIO) > maxBodyHeight
      && bodySize > BODY_MIN_SIZE
    ) {
      bodySize -= 1
      bodyLines = measureAll(bodySize)
    }
    bodyLineHeight = Math.round(bodySize * BODY_LINE_RATIO)
    bodyFont = `400 ${bodySize}px Poppins, system-ui, sans-serif`

    // Salvaguarda: se mesmo no mínimo excedeu, limita com reticências.
    const maxLinesAtMin = Math.max(1, Math.floor(maxBodyHeight / bodyLineHeight))
    if (bodyLines.length > maxLinesAtMin) {
      bodyLines = measureLines(ctx, plainBody, bodyFont, bodyMaxW, maxLinesAtMin)
    }
  }

  const bodyHeight = bodyLines.length * bodyLineHeight
  const mediaSpacing = hasMedia && bodyLines.length > 0 ? MEDIA_BODY_GAP : 0
  const parentBlockSpacing = parentDims ? parentGap : 0
  const parentBlockHeight = parentDims ? parentDims.height : 0

  const cardH =
    CARD_PAD_Y * 2
    + AVATAR_SIZE
    + HEADER_BOTTOM_GAP
    + bodyHeight
    + parentBlockSpacing
    + parentBlockHeight
    + mediaSpacing
    + mediaHeight
    + BODY_ACTIONS_GAP
    + ACTIONS_HEIGHT

  const cardX = (SHARE_IMAGE_WIDTH - CARD_W) / 2
  const cardY = topBound + Math.max(0, (available - cardH) / 2)

  // ── 4. Card base ────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(20,18,14,0.58)'
  roundedRectPath(ctx, cardX, cardY, CARD_W, cardH, 28)
  ctx.fill()
  ctx.strokeStyle = 'rgba(201,168,76,0.18)'
  ctx.lineWidth = 1
  ctx.stroke()

  // ── 5. Avatar circular ──────────────────────────────────────────
  const avatarX = cardX + CARD_PAD_X
  const avatarY = cardY + CARD_PAD_Y

  ctx.save()
  ctx.beginPath()
  ctx.arc(avatarX + AVATAR_SIZE / 2, avatarY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2)
  ctx.clip()

  let avatarDrawn = false
  if (post.author.profile_image_url) {
    try {
      const img = await loadImage(post.author.profile_image_url)
      // Cover crop no avatar
      const scale = Math.max(AVATAR_SIZE / img.width, AVATAR_SIZE / img.height)
      const drawW = img.width * scale
      const drawH = img.height * scale
      const dx = avatarX + (AVATAR_SIZE - drawW) / 2
      const dy = avatarY + (AVATAR_SIZE - drawH) / 2
      ctx.drawImage(img, dx, dy, drawW, drawH)
      avatarDrawn = true
    } catch {
      // fallback abaixo
    }
  }
  if (!avatarDrawn) {
    ctx.fillStyle = 'rgba(201,168,76,0.12)'
    ctx.fillRect(avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE)
    ctx.restore()
    drawCross(ctx, avatarX + AVATAR_SIZE / 2, avatarY + AVATAR_SIZE / 2, 40)
    ctx.save()
  }
  ctx.restore()

  if (post.author.verified) {
    ctx.strokeStyle = 'rgba(233,196,106,0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(avatarX + AVATAR_SIZE / 2, avatarY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ── 6. Nome + badge verificado + handle ────────────────────────
  const textX = avatarX + AVATAR_SIZE + 24
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

  // ── 7. Corpo ────────────────────────────────────────────────────
  const bodyX = cardX + CARD_PAD_X
  const bodyY = avatarY + AVATAR_SIZE + HEADER_BOTTOM_GAP
  if (bodyLines.length > 0) {
    drawLines(ctx, bodyLines, {
      x: bodyX,
      y: bodyY,
      maxWidth: bodyMaxW,
      lineHeight: bodyLineHeight,
      font: bodyFont,
      color: TEXT_PRIMARY,
    })
  }

  // ── 7b. Parent compacto (quote) ─────────────────────────────────
  const parentY = bodyY + bodyHeight + parentBlockSpacing
  if (parentDims && post.parent) {
    let parentAvatar: DrawableImage | null = null
    if (post.parent.author.profile_image_url) {
      try {
        parentAvatar = await loadImage(post.parent.author.profile_image_url)
      } catch {
        parentAvatar = null
      }
    }
    drawParentMini(ctx, post.parent, bodyX, parentY, bodyMaxW, parentDims.height, parentAvatar)
  }

  // ── 8. Mídia (quando houver) ────────────────────────────────────
  const mediaY = parentY + parentBlockHeight + mediaSpacing
  if (hasMedia) {
    const mediaUrls = post.media.slice(0, 4).map(m => m.variants.feed)
    await drawMediaGrid(ctx, mediaUrls, bodyX, mediaY, bodyMaxW, MEDIA_HEIGHT)
  }

  // ── 9. Barra de ações ───────────────────────────────────────────
  const actionsY = mediaY + mediaHeight + BODY_ACTIONS_GAP
  const actionSpacing = 125
  const iconSize = 30

  const m = post.metrics
  const viewer = post.viewer
  const actions: Array<{ key: string; icon: string; count: number; color: string; fill: boolean }> = [
    { key: 'reply',  icon: ICON_PATHS.chat,   count: m.reply_count,       color: TEXT_MUTED,                                fill: false },
    { key: 'repost', icon: ICON_PATHS.repeat, count: m.repost_count,      color: viewer.reposted ? REPOST : TEXT_MUTED,     fill: false },
    { key: 'like',   icon: ICON_PATHS.heart,  count: m.like_count,        color: viewer.liked ? LIKE : TEXT_MUTED,          fill: viewer.liked },
    { key: 'quote',  icon: ICON_PATHS.quote,  count: m.quote_count,       color: TEXT_MUTED,                                fill: false },
    { key: 'send',   icon: ICON_PATHS.send,   count: m.share_cross_count, color: viewer.shared_cross ? GOLD : TEXT_MUTED,   fill: false },
  ]

  let ax = cardX + CARD_PAD_X
  for (const action of actions) {
    drawIcon(ctx, action.icon, ax, actionsY, iconSize, action.color, action.fill)
    if (action.count > 0) {
      ctx.font = '500 22px Poppins, system-ui, sans-serif'
      ctx.fillStyle = action.color
      ctx.textBaseline = 'top'
      ctx.fillText(formatCount(action.count), ax + iconSize + 10, actionsY + 3)
    }
    ax += actionSpacing
  }

  // ── 10. Rodapé ──────────────────────────────────────────────────
  const footerY = height - 70
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
  ctx.font = '400 32px Cinzel, Georgia, serif'
  const veritas = 'VERITAS'
  const dei = ' DEI'
  const veritasW = ctx.measureText(veritas).width
  const deiW = ctx.measureText(dei).width
  const totalW = veritasW + deiW
  const startX = (SHARE_IMAGE_WIDTH - totalW) / 2 + veritasW / 2
  ctx.fillStyle = GOLD_SOFT
  ctx.fillText(veritas, startX, footerY)
  ctx.fillStyle = 'rgba(242,237,228,0.72)'
  ctx.fillText(dei, startX + veritasW / 2 + deiW / 2, footerY)

  // Watermark discreto com o domínio (canto inferior central, sob "VERITAS DEI").
  ctx.textAlign = 'center'
  ctx.font = '400 15px Poppins, system-ui, sans-serif'
  ctx.fillStyle = 'rgba(201,168,76,0.55)'
  ctx.fillText('veritasdei.com', SHARE_IMAGE_WIDTH / 2, footerY + 42)

  // ── 11. Export ──────────────────────────────────────────────────
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
