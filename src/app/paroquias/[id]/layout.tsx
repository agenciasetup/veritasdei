import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TIPOS_IGREJA } from '@/types/paroquia'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

interface ParoquiaSeoRow {
  nome: string
  tipo_igreja: string | null
  diocese: string | null
  cidade: string
  estado: string
  padre_responsavel: string | null
  latitude: number | null
  longitude: number | null
  foto_capa_url: string | null
  foto_perfil_url: string | null
  foto_url: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('paroquias')
    .select(
      'nome, tipo_igreja, diocese, cidade, estado, padre_responsavel, latitude, longitude, foto_capa_url, foto_perfil_url, foto_url, seo_title, seo_description, seo_keywords',
    )
    .eq('id', id)
    .eq('status', 'aprovada')
    .maybeSingle<ParoquiaSeoRow>()

  if (!data) {
    return {
      title: 'Igreja — Veritas Dei',
      description: 'Veritas Dei: a maior comunidade católica digital do Brasil.',
    }
  }

  const tipoLabel = TIPOS_IGREJA.find(t => t.value === data.tipo_igreja)?.label ?? 'Igreja'
  const fallbackTitle = `${data.nome} — ${tipoLabel} em ${data.cidade}/${data.estado}`
  const title = data.seo_title?.trim() || fallbackTitle

  const descParts: string[] = []
  descParts.push(`${tipoLabel} Católica em ${data.cidade}, ${data.estado}.`)
  if (data.diocese) descParts.push(`Diocese de ${data.diocese}.`)
  if (data.padre_responsavel) descParts.push(`Pe. ${data.padre_responsavel}.`)
  descParts.push('Horários de missa, confissão, contatos e avisos no Veritas Dei.')
  const fallbackDesc = descParts.join(' ').slice(0, 180)
  const description = data.seo_description?.trim() || fallbackDesc

  const keywords = data.seo_keywords
    ? data.seo_keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
    : [
        data.nome,
        tipoLabel,
        'Igreja Católica',
        data.cidade,
        data.estado,
        data.diocese ?? 'Católico',
        'missa',
        'confissão',
        'paróquia',
      ].filter(Boolean)

  const ogImage = data.foto_capa_url || data.foto_url || data.foto_perfil_url || undefined

  const metadata: Metadata = {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Veritas Dei',
      images: ogImage ? [{ url: ogImage, alt: data.nome }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }

  // GEO meta (compatível com buscadores locais)
  if (data.latitude != null && data.longitude != null) {
    metadata.other = {
      'geo.region': `BR-${data.estado}`,
      'geo.placename': data.cidade,
      'geo.position': `${data.latitude};${data.longitude}`,
      ICBM: `${data.latitude}, ${data.longitude}`,
    }
  }

  return metadata
}

export default function ParoquiaLayout({ children }: LayoutProps) {
  return children
}
