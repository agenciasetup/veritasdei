/**
 * Compressão de imagens client-side antes do upload ao R2.
 *
 * Motivação: fotos de celular chegam em 3-5MB. O Cloudflare Image Resizing
 * do lado da view já serve variantes otimizadas, mas o arquivo ORIGINAL
 * é o que gasta banda de upload, storage no R2 e egress no 1º hit do
 * otimizador. Comprimir aqui reduz 60-80% sem perda visível.
 *
 * Estratégia: decodificar via createImageBitmap (mais rápido que <img>),
 * redimensionar pra no máximo MAX_DIMENSION preservando aspect ratio,
 * reencodar como WebP quando o browser suporta (Safari 14+, Chrome, Edge,
 * Firefox) ou JPEG quando não. Se algo falha (HEIC em Chrome, por exemplo),
 * devolve o arquivo original pra não bloquear o fluxo de postagem.
 */

const MAX_DIMENSION = 1920
const JPEG_QUALITY = 0.82
const WEBP_QUALITY = 0.80

// GIFs animados e SVGs não devem ser recomprimidos — passam direto.
const SKIP_COMPRESSION_MIME = new Set<string>([
  'image/gif',
  'image/svg+xml',
])

interface CompressResult {
  file: File
  /** true se o arquivo foi efetivamente comprimido. */
  compressed: boolean
  /** Bytes antes / depois — só pra log/telemetria opcional. */
  originalBytes: number
  finalBytes: number
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  // createImageBitmap suporta JPEG/PNG/WebP/AVIF/HEIC (só Safari em HEIC).
  return await createImageBitmap(file)
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

  // Passa direto se for GIF/SVG (não queremos desanimação) ou se já for pequeno.
  if (SKIP_COMPRESSION_MIME.has(file.type) || file.size < 180 * 1024) {
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
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close?.()

    const wantsWebP = supportsWebP()
    const targetType = wantsWebP ? 'image/webp' : 'image/jpeg'
    const quality = wantsWebP ? WEBP_QUALITY : JPEG_QUALITY

    const blob = await canvasToBlob(canvas, targetType, quality)
    if (!blob) {
      return { file, compressed: false, originalBytes, finalBytes: originalBytes }
    }

    // Se a "otimização" ficou maior que o original (formato já era agressivo),
    // mantém o original.
    if (blob.size >= file.size) {
      return { file, compressed: false, originalBytes, finalBytes: originalBytes }
    }

    const ext = targetType === 'image/webp' ? 'webp' : 'jpg'
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'veritas'
    const compressed = new File([blob], `${baseName}.${ext}`, {
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
    // Qualquer falha (HEIC em Chrome, memória, etc) — upload original.
    return { file, compressed: false, originalBytes, finalBytes: originalBytes }
  }
}
