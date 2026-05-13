/**
 * Helper server-side para descobrir o produto da request atual.
 *
 * O middleware injeta `x-product` na request com base no hostname.
 * Server components/route handlers usam isso pra renderizar UI
 * apropriada (ex.: layout reduzido em `educa.veritasdei.com.br`).
 */

import 'server-only'
import { headers } from 'next/headers'
import {
  DEFAULT_PRODUCT,
  PRODUCT_HEADER,
  productFromHostname,
  type ProductId,
} from './types'

/**
 * Lê o produto detectado pelo middleware. Fallback pro hostname
 * direto (caso o middleware não tenha rodado — improvável mas seguro)
 * e depois pro DEFAULT_PRODUCT.
 */
export async function getCurrentProduct(): Promise<ProductId> {
  const h = await headers()
  const fromMiddleware = h.get(PRODUCT_HEADER)
  if (fromMiddleware === 'veritas-educa' || fromMiddleware === 'veritas-dei') {
    return fromMiddleware
  }
  const host = h.get('host')
  return productFromHostname(host) || DEFAULT_PRODUCT
}
