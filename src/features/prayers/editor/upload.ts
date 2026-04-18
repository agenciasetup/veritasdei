import { compressImage } from '@/lib/image/compress'
import { createClient } from '@/lib/supabase/client'

/**
 * Upload de mídia de oração pro bucket `prayer-media` (criado no
 * sprint 1 da Fase 2). RLS permite insert só pra admins.
 *
 * REGRA: imagens PASSAM obrigatoriamente por compressImage antes
 * de ir pro storage. Áudio sobe direto (compressão de codec é
 * cara e sem ganho prático em MP3/M4A já comprimidos).
 */

const BUCKET = 'prayer-media'

const AUDIO_MIME = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
])
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

const MAX_AUDIO_BYTES = 20 * 1024 * 1024 // 20MB (batente do bucket)

export type UploadResult = {
  publicUrl: string
  path: string
  bytes: number
  compressed?: boolean
  originalBytes?: number
}

export async function uploadPrayerAudio(raw: File): Promise<UploadResult> {
  if (!AUDIO_MIME.has(raw.type)) {
    throw new Error(`Formato de áudio não suportado (${raw.type}). Use MP3, M4A ou OGG.`)
  }
  if (raw.size > MAX_AUDIO_BYTES) {
    throw new Error(`Áudio muito grande (${fmtMB(raw.size)}). Limite de 20MB.`)
  }

  const ext = extForMime(raw.type) || 'mp3'
  const path = `audio/${randomId()}.${ext}`

  return uploadToBucket(raw, path, { bytes: raw.size })
}

export async function uploadPrayerImage(raw: File): Promise<UploadResult> {
  // compressImage aceita qualquer arquivo (faz skip pra GIF/SVG/pequenos)
  // e devolve a versão comprimida (WebP/JPEG, máx 1600px, ~400KB alvo).
  const { file, compressed, originalBytes, finalBytes } = await compressImage(raw)

  if (!IMAGE_MIME.has(file.type) && !['image/gif', 'image/svg+xml'].includes(file.type)) {
    throw new Error(`Formato de imagem não suportado (${file.type}). Use JPG, PNG, WebP.`)
  }

  const ext = extForMime(file.type) || 'webp'
  const path = `image/${randomId()}.${ext}`

  const result = await uploadToBucket(file, path, { bytes: finalBytes })
  return { ...result, compressed, originalBytes }
}

async function uploadToBucket(
  file: File,
  path: string,
  meta: { bytes: number }
): Promise<UploadResult> {
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase client indisponível.')

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type,
    })
  if (upErr) throw new Error(upErr.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl, path, bytes: meta.bytes }
}

// ─────────────────────── helpers ───────────────────────

function extForMime(mime: string): string | null {
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/ogg': 'ogg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  }
  return map[mime] ?? null
}

function randomId(): string {
  // 16 chars random — evita colisões sem precisar de uuid lib
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  )
}

export function fmtMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
