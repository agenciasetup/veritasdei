import {
  MEDIA_VARIANTS,
  VERITAS_MAX_GIF_BYTES,
  VERITAS_MAX_IMAGE_BYTES,
  VERITAS_MAX_MEDIA,
} from './constants'
import type { VeritasMediaKind, VeritasMediaVariantSet } from './types'

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
])

export const ALLOWED_GIF_MIME_TYPES = new Set(['image/gif'])

export interface UploadCandidate {
  filename: string
  mime_type: string
  bytes: number
}

export interface ValidatedUploadCandidate extends UploadCandidate {
  kind: VeritasMediaKind
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase()
}

export function inferMediaKind(mimeType: string): VeritasMediaKind | null {
  const normalized = normalizeMimeType(mimeType)
  if (ALLOWED_GIF_MIME_TYPES.has(normalized)) return 'gif'
  if (ALLOWED_IMAGE_MIME_TYPES.has(normalized)) return 'image'
  return null
}

export function validateUploadCandidates(candidates: UploadCandidate[]): {
  ok: true
  items: ValidatedUploadCandidate[]
} | {
  ok: false
  error: string
} {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { ok: false, error: 'Nenhum arquivo enviado.' }
  }

  if (candidates.length > VERITAS_MAX_MEDIA) {
    return { ok: false, error: `Máximo de ${VERITAS_MAX_MEDIA} mídias por Veritas.` }
  }

  const validated: ValidatedUploadCandidate[] = []

  for (const candidate of candidates) {
    const kind = inferMediaKind(candidate.mime_type)
    if (!kind) {
      return { ok: false, error: `Formato não permitido: ${candidate.mime_type}` }
    }

    if (!Number.isFinite(candidate.bytes) || candidate.bytes <= 0) {
      return { ok: false, error: `Tamanho inválido para ${candidate.filename}.` }
    }

    if (kind === 'gif' && candidate.bytes > VERITAS_MAX_GIF_BYTES) {
      return { ok: false, error: 'GIF deve ter no máximo 8MB.' }
    }

    if (kind === 'image' && candidate.bytes > VERITAS_MAX_IMAGE_BYTES) {
      return { ok: false, error: 'Imagem deve ter no máximo 15MB.' }
    }

    validated.push({ ...candidate, mime_type: normalizeMimeType(candidate.mime_type), kind })
  }

  const gifs = validated.filter(item => item.kind === 'gif').length
  const images = validated.filter(item => item.kind === 'image').length

  if (gifs > 1) {
    return { ok: false, error: 'Apenas 1 GIF por Veritas.' }
  }

  if (gifs > 0 && images > 0) {
    return { ok: false, error: 'Não é permitido misturar GIF com imagens.' }
  }

  return { ok: true, items: validated }
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

function buildTransformUrl(
  publicBaseUrl: string,
  sourceUrl: string,
  options: string,
): string {
  return `${trimTrailingSlash(publicBaseUrl)}/cdn-cgi/image/${options}/${sourceUrl}`
}

export function buildMediaVariants(publicBaseUrl: string, objectKey: string, kind: VeritasMediaKind): VeritasMediaVariantSet {
  const base = trimTrailingSlash(publicBaseUrl)
  const source = encodeURI(`${base}/${objectKey}`)

  if (kind === 'gif') {
    return {
      thumb: buildTransformUrl(base, source, MEDIA_VARIANTS.thumb),
      feed: buildTransformUrl(base, source, MEDIA_VARIANTS.gifPreview),
      detail: source,
    }
  }

  return {
    thumb: buildTransformUrl(base, source, MEDIA_VARIANTS.thumb),
    feed: buildTransformUrl(base, source, MEDIA_VARIANTS.feed),
    detail: buildTransformUrl(base, source, MEDIA_VARIANTS.detail),
  }
}
