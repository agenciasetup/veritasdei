/**
 * /c/[token] — Página pública de verificação de uma carta colecionável.
 *
 * Server-rendered (sem auth), faz uma chamada anon para o RPC
 * `fn_verificar_carta` no Postgres, que recomputa o HMAC e devolve o
 * "certificado" se a assinatura bater. Qualquer pessoa com o link consegue
 * confirmar que a carta é genuína e quem é o dono — sem expor o segredo.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ShieldCheck, ShieldAlert, ChevronLeft, BadgeCheck } from 'lucide-react'

import CartaView from '@/components/colecao/CartaView'
import {
  RARIDADE_META,
  type CertificadoCarta,
  type CertificadoInvalido,
  type Carta,
} from '@/types/colecao'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

type Resultado = CertificadoCarta | CertificadoInvalido | null

async function verificar(token: string): Promise<Resultado> {
  if (!SUPABASE_URL || !SUPABASE_ANON) return null
  // Cliente anon, server-side. fn_verificar_carta é security definer e
  // GRANT EXECUTE pra anon — funciona sem sessão.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: { persistSession: false },
  })
  const { data, error } = await supabase.rpc('fn_verificar_carta', {
    p_token: token,
  })
  if (error) return null
  return (data ?? null) as Resultado
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const r = await verificar(token)
  if (r && 'valid' in r && r.valid) {
    return {
      title: `${r.carta.nome} · Carta #${String(r.serial_number).padStart(3, '0')} — Veritas Dei`,
      description: `Certificado de autenticidade da carta "${r.carta.nome}" (${r.personagem.nome}). Cópia única #${r.serial_number}, cunhada em ${new Date(r.minted_at).toLocaleDateString('pt-BR')}.`,
      openGraph: {
        title: `${r.carta.nome} · #${r.serial_number}`,
        description: `Certificado de autenticidade — Veritas Dei`,
      },
    }
  }
  return {
    title: 'Certificado · Veritas Dei',
    description: 'Verificação de autenticidade de carta colecionável.',
  }
}

export default async function CertificadoPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const r = await verificar(token)

  if (!r) {
    notFound()
  }

  if (!r.valid) {
    return <PaginaAdulterada token={token} />
  }

  return <PaginaValida cert={r} />
}

function PaginaValida({ cert }: { cert: CertificadoCarta }) {
  const meta = RARIDADE_META[cert.carta.raridade]
  const accent = cert.carta.cor_accent || meta.cor

  // CartaView espera um Carta completo; reconstruímos os defaults dos campos
  // que não vêm na RPC (status/visibilidade não importam aqui).
  const carta: Carta = {
    id: cert.carta.id,
    personagem_id: '',
    slug: cert.carta.slug,
    numero: cert.carta.numero,
    nome: cert.carta.nome,
    subtitulo: cert.carta.subtitulo,
    categoria: cert.carta.categoria,
    raridade: cert.carta.raridade,
    estrelas: cert.carta.estrelas,
    frase_central: cert.carta.frase_central,
    frase_referencia: cert.carta.frase_referencia,
    autoridade_doutrinaria: cert.carta.autoridade_doutrinaria,
    efeito_simbolico: cert.carta.efeito_simbolico,
    recompensa: cert.carta.recompensa,
    concilio: cert.carta.concilio,
    virtude: cert.carta.virtude,
    simbolo: cert.carta.simbolo,
    lore: cert.carta.lore,
    ilustracao_url: cert.carta.ilustracao_url,
    ilustracao_mobile_url: null,
    moldura: cert.carta.moldura,
    cor_accent: cert.carta.cor_accent,
    escala_fonte: cert.carta.escala_fonte,
    tiragem: null,
    dica_desbloqueio: null,
    regras: { operador: 'todas', condicoes: [] },
    status: 'publicado',
    visivel: true,
    ordem: 0,
    landing_featured: false,
    landing_featured_order: null,
    created_by: null,
    created_at: cert.minted_at,
    updated_at: cert.minted_at,
  }

  const dataLonga = new Date(cert.minted_at).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const ownerHref = cert.owner.public_handle
    ? `/comunidade/${cert.owner.public_handle}`
    : cert.owner.user_number
      ? `/comunidade/p/${cert.owner.user_number}`
      : null

  return (
    <main className="min-h-screen px-4 md:px-8 py-8 relative">
      <div className="bg-glow" />
      <div className="relative z-10 max-w-3xl mx-auto">
        <Link
          href="/colecao"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] mb-6"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Coleção Veritas
        </Link>

        <header className="mb-6 flex items-center gap-3">
          <ShieldCheck
            className="w-6 h-6 flex-shrink-0"
            style={{ color: accent }}
          />
          <div>
            <h1
              className="text-xl md:text-2xl uppercase tracking-[0.16em]"
              style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
            >
              Certificado verificado
            </h1>
            <p
              className="text-xs"
              style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
            >
              Esta carta é autêntica — assinatura conferida pelo servidor
              Veritas Dei.
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-[300px_1fr] gap-6 md:gap-8 items-start">
          <div className="flex justify-center md:justify-start">
            <CartaView
              carta={carta}
              width={300}
              serialNumber={cert.serial_number}
            />
          </div>

          <div
            className="rounded-2xl p-5 md:p-6 space-y-5"
            style={{
              background:
                'linear-gradient(160deg, rgba(30,26,19,0.7) 0%, rgba(15,12,8,0.92) 100%)',
              border: `1px solid ${accent}33`,
            }}
          >
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.2em] mb-1"
                style={{ color: accent, fontFamily: 'Poppins, sans-serif' }}
              >
                {cert.personagem.nome}
              </p>
              <h2
                className="text-2xl"
                style={{
                  fontFamily: 'Cinzel, serif',
                  color: '#F6F1E5',
                  fontWeight: 600,
                }}
              >
                {cert.carta.nome}
              </h2>
              {cert.carta.subtitulo && (
                <p
                  className="text-sm italic mt-1"
                  style={{
                    color: '#9A9388',
                    fontFamily: 'Cormorant Garamond, serif',
                  }}
                >
                  {cert.carta.subtitulo}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Campo
                label="Cópia única nº"
                accent={accent}
                valor={`#${String(cert.serial_number).padStart(3, '0')}`}
              />
              <Campo
                label="Tiragem atual"
                accent={accent}
                valor={`${cert.tiragem_atual} cunhadas`}
              />
              <Campo
                label="Raridade"
                accent={accent}
                valor={meta.label}
              />
              <Campo label="Cunhada em" accent={accent} valor={dataLonga} />
            </div>

            <div className="pt-2 border-t" style={{ borderColor: `${accent}22` }}>
              <p
                className="text-[10px] uppercase tracking-[0.18em] mb-2"
                style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
              >
                Pertence a
              </p>
              <Dono
                nome={cert.owner.name}
                handle={cert.owner.public_handle}
                userNumber={cert.owner.user_number}
                imagem={cert.owner.profile_image_url}
                verified={cert.owner.verified}
                href={ownerHref}
                accent={accent}
              />
            </div>

            <div>
              <p
                className="text-[10px] uppercase tracking-[0.18em] mb-1"
                style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif' }}
              >
                Token público
              </p>
              <code
                className="block text-[12px] rounded-lg px-3 py-2"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid rgba(242,237,228,0.06)',
                  color: '#E7DED1',
                  fontFamily: 'monospace',
                }}
              >
                {cert.token}
              </code>
              <p
                className="text-[10px] mt-2 italic"
                style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif' }}
              >
                Hash HMAC-SHA256 da assinatura:{' '}
                <span className="break-all">{cert.signature_hex}</span>
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-10 text-center">
          <p
            className="text-xs"
            style={{ color: '#6E685D', fontFamily: 'Poppins, sans-serif' }}
          >
            A autenticidade desta carta é garantida por uma assinatura
            criptográfica gerada pelo servidor Veritas Dei sobre o ID do
            dono, o ID da carta, o número de série e a data de cunhagem.
          </p>
        </footer>
      </div>
    </main>
  )
}

function PaginaAdulterada({ token }: { token: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <ShieldAlert
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: '#D64F5C' }}
        />
        <h1
          className="text-xl uppercase tracking-[0.16em] mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: '#F2EDE4' }}
        >
          Certificado adulterado
        </h1>
        <p
          className="text-sm"
          style={{ color: '#9A9388', fontFamily: 'Poppins, sans-serif' }}
        >
          O token <code className="text-[12px]">{token}</code> existe, mas a
          assinatura armazenada não corresponde aos dados — o registro foi
          alterado fora do fluxo oficial.
        </p>
        <Link
          href="/colecao"
          className="inline-flex mt-6 items-center gap-1.5 text-xs uppercase tracking-[0.18em]"
          style={{ color: '#C9A84C', fontFamily: 'Poppins, sans-serif' }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Voltar para a coleção
        </Link>
      </div>
    </main>
  )
}

function Campo({
  label,
  valor,
  accent,
}: {
  label: string
  valor: string
  accent: string
}) {
  return (
    <div>
      <p
        className="text-[10px] uppercase tracking-[0.18em] mb-1"
        style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </p>
      <p
        className="text-[15px]"
        style={{
          fontFamily: 'Cinzel, serif',
          color: '#F2EDE4',
          textShadow: `0 0 10px ${accent}22`,
        }}
      >
        {valor}
      </p>
    </div>
  )
}

function Dono({
  nome,
  handle,
  userNumber,
  imagem,
  verified,
  href,
  accent,
}: {
  nome: string | null
  handle: string | null
  userNumber: number | null
  imagem: string | null
  verified: boolean
  href: string | null
  accent: string
}) {
  const conteudo = (
    <div className="flex items-center gap-3">
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          width: 44,
          height: 44,
          background: imagem ? `url(${imagem}) center/cover` : 'rgba(255,255,255,0.06)',
          border: `1px solid ${accent}55`,
        }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className="truncate text-sm"
            style={{ color: '#F2EDE4', fontFamily: 'Poppins, sans-serif' }}
          >
            {nome ?? 'Membro Veritas'}
          </p>
          {verified && (
            <BadgeCheck
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ color: accent }}
            />
          )}
        </div>
        <p
          className="text-[12px]"
          style={{ color: '#8A8378', fontFamily: 'Poppins, sans-serif' }}
        >
          {handle ? `@${handle}` : `#${userNumber ?? '—'}`}
        </p>
      </div>
    </div>
  )
  return href ? (
    <Link href={href} className="block hover:opacity-90 transition-opacity">
      {conteudo}
    </Link>
  ) : (
    conteudo
  )
}
