'use client'

/**
 * ProductContext — expõe o produto da request atual ao client.
 *
 * Server determina o produto via `getCurrentProduct()` e passa como
 * prop pra esse provider. Client components consultam via `useProduct()`.
 *
 * Por que não detectar via `window.location.hostname` no client?
 *  - Não funciona durante o primeiro render no server.
 *  - Pode flickar em hidratação (server renderiza um produto, client troca pra outro).
 *  - O middleware é a fonte da verdade — propaga via prop.
 */

import { createContext, useContext, type ReactNode } from 'react'
import {
  DEFAULT_PRODUCT,
  type ProductId,
} from '@/lib/product/types'

type ProductContextValue = {
  product: ProductId
  isEduca: boolean
}

const Ctx = createContext<ProductContextValue>({
  product: DEFAULT_PRODUCT,
  isEduca: false,
})

export function ProductProvider({
  product,
  children,
}: {
  product: ProductId
  children: ReactNode
}) {
  const value: ProductContextValue = {
    product,
    isEduca: product === 'veritas-educa',
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useProduct() {
  return useContext(Ctx)
}
