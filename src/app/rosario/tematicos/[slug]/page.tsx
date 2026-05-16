import { redirect } from 'next/navigation'

// Redireciona pra /rosario/loja/[slug] — os slugs são compatíveis
// (sao-bento, dogmas-marianos, padre-pio, divina-misericordia migraram
// pra rosary_skins com os mesmos slugs).
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // sao-bento (antigo) → terco-sao-bento (novo). Demais slugs são iguais.
  const slugMap: Record<string, string> = {
    'sao-bento': 'terco-sao-bento',
  }
  const target = slugMap[slug] ?? slug
  redirect(`/rosario/loja/${target}`)
}
