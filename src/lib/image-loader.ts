'use client'

/**
 * Loader pass-through para next/image.
 *
 * O R2 já serve três variantes por asset (thumb/feed/detail via
 * VeritasMediaAsset.variants). O consumidor passa a URL da variante
 * apropriada em `src` e este loader só devolve a URL sem reprocessar —
 * evita duplo otimizador e mantém cache do CDN funcional.
 *
 * Funciona também pra avatares servidos direto de media.veritasdei.com.br
 * ou do Supabase Storage: qualquer URL absoluta sai intocada.
 *
 * Se no futuro quisermos usar o otimizador nativo em algum caso pontual,
 * basta passar `unoptimized={false}` + um loader custom por instância.
 */
export default function veritasImageLoader({
  src,
}: {
  src: string
  width: number
  quality?: number
}): string {
  return src
}
