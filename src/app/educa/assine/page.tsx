/**
 * /educa/assine — alias antigo. Reencaminha pro /educa/checkout
 * preservando o `?plan=` se houver.
 *
 * O fluxo hoje é: landing pública em /educa, checkout focado em
 * /educa/checkout. Este redirect mantém compatibilidade com links
 * antigos (e-mails, anúncios, posts de Instagram etc.) que ainda
 * apontam pra /educa/assine.
 */

import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AssineEducaPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan } = await searchParams
  const target = plan ? `/educa/checkout?plan=${encodeURIComponent(plan)}` : '/educa/checkout'
  redirect(target)
}
