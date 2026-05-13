/**
 * Tipos compartilhados de "produto" — usado em multi-domain runtime.
 *
 * Veritas Dei é monolítico (mesmo deploy Vercel, mesmo banco Supabase).
 * O subproduto Veritas Educa vive no subdomínio `educa.veritasdei.com.br`
 * e renderiza um shell reduzido (sem comunidade, sem links pra
 * paróquias, etc), pra dar foco em estudo.
 *
 * O middleware detecta o hostname da request e injeta o `x-product`
 * header. Server components lêem via `getCurrentProduct()`, client
 * components via `useProduct()` (alimentado por server prop).
 */

export type ProductId = 'veritas-dei' | 'veritas-educa'

export const DEFAULT_PRODUCT: ProductId = 'veritas-dei'

/** Header key injetado pelo middleware na request. */
export const PRODUCT_HEADER = 'x-product'

/**
 * Determina o produto a partir do hostname.
 *
 * - Subdomínios `educa.*` resolvem pra Veritas Educa (qualquer host
 *   começando com `educa.`, suporta dev local com `educa.localhost`).
 * - Tudo mais cai no Veritas Dei (default).
 */
export function productFromHostname(hostname: string | null | undefined): ProductId {
  if (!hostname) return DEFAULT_PRODUCT
  const host = hostname.toLowerCase().split(':')[0]
  if (host.startsWith('educa.')) return 'veritas-educa'
  return DEFAULT_PRODUCT
}
