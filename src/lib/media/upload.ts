import { compressImage } from '@/lib/image/compress'

interface PresignItem {
  upload_url: string
  object_key: string
  mime_type: string
  bytes: number
  variants?: { thumb?: string; feed?: string; detail?: string }
}

/**
 * Comprime e sobe uma imagem (avatar/capa) pelo fluxo R2 presign.
 * Retorna a URL pública (variante `feed` quando disponível).
 *
 * Fluxo único para todos os editores de perfil: evita manter duas origens
 * de storage (Supabase Storage `avatars` + R2) e duas pipelines de upload.
 */
export async function uploadProfileImage(raw: File): Promise<string> {
  const { file } = await compressImage(raw)

  const res = await fetch('/api/comunidade/media/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: [{ filename: file.name, mime_type: file.type, bytes: file.size }],
    }),
  })
  if (!res.ok) throw new Error('Falha ao preparar upload')
  const data = (await res.json()) as { items: PresignItem[] }
  const item = data.items[0]
  if (!item) throw new Error('Resposta vazia do servidor')

  const putRes = await fetch(item.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!putRes.ok) throw new Error('Falha no upload')

  return item.variants?.feed ?? item.variants?.detail ?? item.upload_url.split('?')[0]
}
