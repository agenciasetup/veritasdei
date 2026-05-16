import { redirect } from 'next/navigation'

// A rota /rosario/tematicos foi unificada com /rosario/loja — toda
// skin (com mistérios próprios ou não) vive no mesmo catálogo agora.
export default function Page() {
  redirect('/rosario/loja')
}
