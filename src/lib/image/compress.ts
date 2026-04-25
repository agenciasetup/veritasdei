/**
 * Compressão de imagens client-side agressiva antes do upload ao R2.
 *
 * Motivação: Cloudflare Image Resizing serve variantes otimizadas na
 * visualização, mas o arquivo ORIGINAL guardado no R2 consome storage,
 * banda de upload e egress do otimizador no primeiro hit. Sem compressão
 * adequada, 5 fotos de celular resultam em ~8MB no bucket.
 *
 * Estratégia: decodifica via createImageBitmap, redimensiona pra no máximo
 * MAX_DIMENSION (1600px — igual à maior variante do CDN, zero upscaling),
 * e itera por uma escada de qualidades até ficar abaixo do `TARGET_BYTES`
 * ou atingir o mínimo. WebP quando o browser suporta; JPEG fallback. O
 * classificador NSFW da Cloudflare (resnet-50) aceita WebP normalmente,
 * então o ganho de ~25% em storage/banda é livre.
 *
 * GIFs/SVGs passam direto pra preservar animação. Arquivos já pequenos
 * (< 60KB) não gastam CPU comprimindo. Se decodificação tombar
 * (HEIC em Chrome, imagem corrompida, memória) retorna o original
 * — nunca bloqueia a postagem.
 */

// Tamanho máximo do maior lado. Casa com a variante `detail` do
// Cloudflare Image Resizing (1600px) — não upscala, não desperdiça
// bytes guardando pixels que nunca serão exibidos.
const MAX_DIMENSION = 1600

// Alvo por arquivo. A maioria das fotos de celular chega aqui dentro
// na primeira passada com WebP 0.72. Itera quality se estourar.
const TARGET_BYTES = 400 * 1024

// Escada de qualidade — sobe pra primeira, desce até QUALITY_MIN se
// estourar o alvo. 0.72 WebP ≈ qualidade alta visualmente indistinguível
// do original; 0.50 ainda fica bom pra feed.
const WEBP_QUALITIES = [0.72, 0.62, 0.52]
const JPEG_QUALITIES = [0.76, 0.66, 0.56]

// Arquivos abaixo desse limite passam direto — o overhead de decode+
// encode não compensa o ganho marginal.
const SKIP_IF_UNDER = 60 * 1024

// GIFs animados e SVGs não devem ser recomprimidos — preservam animação
// e resolução vetorial respectivamente.
const SKIP_COMPRESSION_MIME = new Set<string>([
  'image/gif',
  'image/svg+xml',
])

interface CompressResult {
  file: File
  compressed: boolean
  originalBytes: number
  finalBytes: number
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  // createImageBitmap suporta JPEG/PNG/WebP/AVIF/HEIC (Safari).
  // Usar `imageOrientation: 'from-image'` pra respeitar EXIF de fotos
  // tiradas em retrato — sem isso elas viriam deitadas.
  return await createImageBitmap(file, { imageOrientation: 'from-image' })
}

function computeTargetSize(width: number, height: number): { w: number; h: number } {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { w: width, h: height }
  }
  const ratio = width / height
  if (width >= height) {
    return { w: MAX_DIMENSION, h: Math.round(MAX_DIMENSION / ratio) }
  }
  return { w: Math.round(MAX_DIMENSION * ratio), h: MAX_DIMENSION }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), type, quality)
  })
}

function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false
  const c = document.createElement('canvas')
  c.width = 1
  c.height = 1
  return c.toDataURL('image/webp').startsWith('data:image/webp')
}

export async function compressImage(file: File): Promise<CompressResult> {
  const originalBytes = file.size

  // Se não for imagem (PDF em verificação, por exemplo) ou for GIF/SVG,
  // passa direto. Mesma coisa pra arquivos ja pequenos.
  if (
    !file.type.startsWith('image/')
    || SKIP_COMPRESSION_MIME.has(file.type)
    || file.size < SKIP_IF_UNDER
  ) {
    return { file, compressed: false, originalBytes, finalBytes: originalBytes }
  }

  try {
    const bitmap = await decodeImage(file)
    const { w, h } = computeTargetSize(bitmap.width, bitmap.height)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      bitmap.close?.()
      return { file, compressed: false, originalBytes, finalBytes: originalBytes }
    }
    // Melhor qualidade de resampling pra downscale — importa em fotos
    // de celular com muito detalhe.
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const wantsWebP = supportsWebP()
    const targetType = wantsWebP ? 'image/webp' : 'image/jpeg'
    const qualities = wantsWebP ? WEBP_QUALITIES : JPEG_QUALITIES

    let best: Blob | null = null
    for (const quality of qualities) {
      const blob = await canvasToBlob(canvas, targetType, quality)
      if (!blob) continue
      best = blob
      if (blob.size <= TARGET_BYTES) break
    }

    if (!best) {
      return { file, compressed: false, originalBytes, finalBytes: originalBytes }
    }

    // Se mesmo no menor quality ficou maior que o original (possivel
    // com imagens ja muito comprimidas), mantem o original.
    if (best.size >= file.size) {
      return { file, compressed: false, originalBytes, finalBytes: originalBytes }
    }

    const ext = targetType === 'image/webp' ? 'webp' : 'jpg'
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'veritas'
    const compressed = new File([best], `${baseName}.${ext}`, {
      type: targetType,
      lastModified: Date.now(),
    })

    return {
      file: compressed,
      compressed: true,
      originalBytes,
      finalBytes: compressed.size,
    }
  } catch {
    // HEIC em Chrome, memoria, imagem corrompida — upload do original
    // nao bloqueia o fluxo.
    return { file, compressed: false, originalBytes, finalBytes: originalBytes }
  }
}
