import { compressImage } from '@/lib/image/compress'

interface PresignItem {
  upload_url: string
  object_key: string
  mime_type: string
  bytes: number
  variants?: { thumb?: string; feed?: string; detail?: string }
}

// Timeouts separados: presign é rápido (endpoint nosso), mas o PUT no R2
// vai o arquivo inteiro pelo 3G/rede instável do usuário. Sem AbortController
// um fetch pendurado trava `uploadingAvatar`/`uploadingCover` pra sempre.
const PRESIGN_TIMEOUT_MS = 15_000
const UPLOAD_TIMEOUT_MS = 60_000

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(timeoutMessage)
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
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

  const res = await fetchWithTimeout(
    '/api/comunidade/media/presign',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: [{ filename: file.name, mime_type: file.type, bytes: file.size }],
      }),
    },
    PRESIGN_TIMEOUT_MS,
    'Servidor demorou pra responder. Tente de novo.',
  )
  if (!res.ok) throw new Error('Falha ao preparar upload')
  const data = (await res.json()) as { items: PresignItem[] }
  const item = data.items[0]
  if (!item) throw new Error('Resposta vazia do servidor')

  const putRes = await fetchWithTimeout(
    item.upload_url,
    {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    },
    UPLOAD_TIMEOUT_MS,
    'Upload demorou demais. Verifique sua conexão e tente de novo.',
  )
  if (!putRes.ok) throw new Error('Falha no upload')

  return item.variants?.feed ?? item.variants?.detail ?? item.upload_url.split('?')[0]
}
