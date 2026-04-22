import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Heart, Calendar, MapPin, ExternalLink } from 'lucide-react'
import {
  getSantoBySlug,
  getSantoDevotosCount,
  getSantoOracoes,
} from '@/lib/santos/queries'
import { createAdminClient } from '@/lib/supabase/admin'
import SantoCoverFallback from '@/components/devocao/SantoCoverFallback'
import CapaViva from '@/components/devocao/CapaViva'
import FamiliaReligiosaChip from '@/components/devocao/FamiliaReligiosaChip'
import EscolherDevocaoButton from './EscolherDevocaoButton'
import AcoesDevocaoCliente from './AcoesDevocaoCliente'

export const revalidate = 3600

export async function generateStaticParams() {
  // Build-time: não pode usar cookies(). Usa client service-role direto.
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('santos')
      .select('slug')
      .not('popularidade_rank', 'is', null)
      .order('popularidade_rank', { ascending: true })
      .limit(30)
    return (data ?? []).map((s: { slug: string }) => ({ slug: s.slug }))
  } catch {
    return []
  }
}

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.veritasdei.com.br'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const santo = await getSantoBySlug(slug)
  if (!santo) return { title: 'Santo não encontrado · Veritas Dei' }

  const title = `${santo.nome} · Veritas Dei`
  const description = santo.biografia_curta
    ? santo.biografia_curta.split('\n')[0].slice(0, 155)
    : santo.invocacao ?? `Devoção a ${santo.nome}`
  const image = santo.imagem_url ?? undefined

  return {
    title,
    description,
    alternates: { canonical: `/santos/${slug}` },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: `${SITE}/santos/${slug}`,
      siteName: 'Veritas Dei',
      locale: 'pt_BR',
      images: image ? [image] : undefined,
    },
  }
}

export default async function SantoDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const santo = await getSantoBySlug(slug)
  if (!santo) notFound()

  const [oracoes, devotosCount] = await Promise.all([
    getSantoOracoes(santo.id),
    getSantoDevotosCount(santo.id),
  ])

  const invocacaoFallback = santo.invocacao ?? `${santo.nome}, rogai por nós`
  const oracaoPrincipal = oracoes.find(o => o.tipo === 'devocao_principal') ?? oracoes[0]
  const oracoesOutras = oracoes.filter(o => o !== oracaoPrincipal)

  return (
    <div className="min-h-screen pb-24 md:pb-12">
      {/* Hero */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '16 / 9', maxHeight: '60vh' }}
      >
        {santo.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={santo.imagem_url}
            alt={santo.nome}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <SantoCoverFallback nome={santo.nome} invocacao={santo.invocacao} fullName />
        )}
        <CapaViva />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.65) 50%, transparent 100%)' }}
        />
        <div className="absolute inset-x-0 bottom-0 p-6 text-center">
          <h1
            className="mb-2 tracking-[0.05em]"
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: '#F2EDE4',
              fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            }}
          >
            {santo.nome}
          </h1>
          <p
            style={{
              fontFamily: 'Cinzel, Georgia, serif',
              color: 'rgba(242,237,228,0.85)',
              fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
              fontStyle: 'italic',
              textShadow: '0 1px 6px rgba(0,0,0,0.6)',
            }}
          >
            «{invocacaoFallback}»
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-8">
        {/* Metadata chips */}
        <div className="flex flex-wrap items-center gap-2 justify-center">
          {santo.festa_texto && (
            <Chip icon={<Calendar className="w-3.5 h-3.5" />} label={`Festa: ${santo.festa_texto}`} />
          )}
          {santo.nascimento_local && (
            <Chip
              icon={<MapPin className="w-3.5 h-3.5" />}
              label={`Nasc.: ${santo.nascimento_local}`}
            />
          )}
          {santo.morte_data && (
            <Chip label={`† ${formatYear(santo.morte_data)}`} />
          )}
          {santo.canonizado_por && (
            <Chip label={`Canonizado por ${santo.canonizado_por}`} />
          )}
          {santo.martir && <Chip label="Mártir" highlight />}
        </div>

        {/* Família espiritual */}
        {santo.familia_religiosa && (
          <section className="flex justify-center">
            <FamiliaReligiosaChip familia={santo.familia_religiosa} />
          </section>
        )}

        {/* Patronatos */}
        {santo.patronatos && santo.patronatos.length > 0 && (
          <section>
            <SectionTitle>Patronatos</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {santo.patronatos.map(p => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded-full text-xs"
                  style={{
                    background: 'rgba(201,168,76,0.12)',
                    border: '1px solid rgba(201,168,76,0.3)',
                    color: '#C9A84C',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Biografia */}
        {santo.biografia_curta ? (
          <section>
            <SectionTitle>Quem foi</SectionTitle>
            <div
              className="whitespace-pre-wrap leading-relaxed"
              style={{
                color: 'rgba(242,237,228,0.88)',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.95rem',
                lineHeight: 1.7,
              }}
            >
              {santo.biografia_curta}
            </div>
          </section>
        ) : santo.descricao ? (
          <section>
            <SectionTitle>Nota</SectionTitle>
            <div
              className="whitespace-pre-wrap"
              style={{
                color: 'rgba(242,237,228,0.7)',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.9rem',
                lineHeight: 1.65,
              }}
            >
              {santo.descricao}
            </div>
          </section>
        ) : (
          <section
            className="rounded-xl p-4 text-sm text-center"
            style={{
              background: 'rgba(16,16,16,0.5)',
              border: '1px solid rgba(242,237,228,0.1)',
              color: 'rgba(242,237,228,0.6)',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Biografia detalhada em curadoria. Enquanto isso, reze a invocação
            tradicional acima.
          </section>
        )}

        {/* Oração principal */}
        {oracaoPrincipal ? (
          <section>
            <SectionTitle>Oração de Devoção</SectionTitle>
            <div
              className="rounded-xl p-5"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.25)',
              }}
            >
              <div
                className="whitespace-pre-wrap text-center"
                style={{
                  color: '#F2EDE4',
                  fontFamily: 'Cinzel, Georgia, serif',
                  fontSize: '1rem',
                  lineHeight: 1.8,
                }}
              >
                {oracaoPrincipal.body}
              </div>
              <div className="mt-4 text-center">
                <Link
                  href={`/oracoes/${oracaoPrincipal.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{
                    color: 'rgba(201,168,76,0.8)',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir oração completa
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section
            className="rounded-xl p-5 text-center"
            style={{
              background: 'rgba(16,16,16,0.5)',
              border: '1px solid rgba(242,237,228,0.1)',
            }}
          >
            <div
              style={{
                color: '#F2EDE4',
                fontFamily: 'Cinzel, Georgia, serif',
                fontSize: '1rem',
                fontStyle: 'italic',
              }}
            >
              «{invocacaoFallback}»
            </div>
            <div
              className="mt-2 text-xs"
              style={{ color: 'rgba(242,237,228,0.5)', fontFamily: 'Poppins, sans-serif' }}
            >
              Invocação tradicional. Orações específicas em curadoria.
            </div>
          </section>
        )}

        {/* Orações secundárias */}
        {oracoesOutras.length > 0 && (
          <section>
            <SectionTitle>Outras orações</SectionTitle>
            <ul className="space-y-2">
              {oracoesOutras.map(o => (
                <li key={o.content_item_id}>
                  <Link
                    href={`/oracoes/${o.slug}`}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                    style={{
                      background: 'rgba(16,16,16,0.5)',
                      border: '1px solid rgba(242,237,228,0.08)',
                      color: '#F2EDE4',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    <Heart className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
                    {o.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Devotos count + CTA */}
        <section
          className="rounded-xl p-5 text-center"
          style={{
            background: 'rgba(16,16,16,0.5)',
            border: '1px solid rgba(242,237,228,0.1)',
          }}
        >
          {devotosCount > 0 && (
            <p
              className="mb-4 text-sm"
              style={{ color: 'rgba(242,237,228,0.75)', fontFamily: 'Poppins, sans-serif' }}
            >
              <strong style={{ color: '#C9A84C' }}>{devotosCount}</strong>{' '}
              {devotosCount === 1 ? 'devoto escolheu' : 'devotos escolheram'} este santo no Veritas Dei.
            </p>
          )}
          <EscolherDevocaoButton santoId={santo.id} santoNome={santo.nome} />
          <div className="mt-4">
            <AcoesDevocaoCliente santoId={santo.id} santoNome={santo.nome} />
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-3"
      style={{
        fontFamily: 'Cinzel, Georgia, serif',
        color: 'rgba(242,237,228,0.88)',
        fontSize: '0.9rem',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      {children}
    </h2>
  )
}

function Chip({
  icon,
  label,
  highlight = false,
}: {
  icon?: React.ReactNode
  label: string
  highlight?: boolean
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
      style={{
        background: highlight ? 'rgba(180,40,40,0.18)' : 'rgba(242,237,228,0.08)',
        border: highlight ? '1px solid rgba(180,40,40,0.4)' : '1px solid rgba(242,237,228,0.12)',
        color: highlight ? 'rgb(220,140,140)' : 'rgba(242,237,228,0.75)',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {icon}
      {label}
    </span>
  )
}

function formatYear(date: string | null): string {
  if (!date) return ''
  return String(new Date(date).getFullYear())
}
