/**
 * GET /api/colecao/carta/[id]/imagem — renderiza a carta como PNG (next/og).
 *
 * Usado pelo botão "Salvar como imagem" do editor admin e para
 * compartilhamento. Gate: admin, OU o usuário desbloqueou a carta, OU a
 * carta está publicada e visível.
 *
 * Notas técnicas (Satori / next/og):
 *  - Satori NÃO renderiza WebP. As ilustrações são .webp no R2, então
 *    pedimos um JPEG via Cloudflare Image Resizing (/cdn-cgi/image/...).
 *  - Glifos exóticos (★ ✦ ✛) viram quadrados sem fonte própria — as
 *    estrelas são SVG inline e os ornamentos são formas desenhadas.
 */
import { ImageResponse } from 'next/og'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { RARIDADE_META, type Carta } from '@/types/colecao'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const W = 600
const H = 840

/** Converte a URL .webp do R2 num JPEG via Cloudflare Image Resizing. */
function comoJpeg(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'media.veritasdei.com.br') {
      return `${u.origin}/cdn-cgi/image/format=jpeg,quality=86,width=900${u.pathname}`
    }
  } catch {
    /* url inválida — devolve como veio */
  }
  return url
}

function Estrela({ on, cor }: { on: boolean; cor: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M12 2.5l2.9 6.1 6.6.9-4.8 4.5 1.2 6.6L12 17.9 6.1 21.1l1.2-6.6L2.5 9.9l6.6-.9z"
        fill={on ? cor : 'rgba(0,0,0,0.45)'}
        stroke={on ? cor : 'rgba(255,255,255,0.15)'}
        strokeWidth="1"
      />
    </svg>
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { data: carta } = await admin
    .from('cartas')
    .select('*')
    .eq('id', id)
    .maybeSingle<Carta>()

  if (!carta) {
    return new Response('not_found', { status: 404 })
  }

  // Autorização
  let autorizado = carta.status === 'publicado' && carta.visivel
  if (!autorizado && user) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle<{ role: string }>()
    if (perfil?.role === 'admin') {
      autorizado = true
    } else {
      const { data: posse } = await admin
        .from('user_cartas')
        .select('carta_id')
        .eq('user_id', user.id)
        .eq('carta_id', id)
        .maybeSingle()
      autorizado = Boolean(posse)
    }
  }
  if (!autorizado) {
    return new Response('forbidden', { status: 403 })
  }

  const meta = RARIDADE_META[carta.raridade]
  const accent = carta.cor_accent || meta.cor
  const artUrl = carta.ilustracao_url ? comoJpeg(carta.ilustracao_url) : null

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg, #1b1812 0%, #0b0a08 100%)',
          border: `4px solid ${accent}`,
          borderRadius: 30,
          position: 'relative',
        }}
      >
        {/* Ilustração — metade superior */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: '100%',
            height: H / 2,
            overflow: 'hidden',
          }}
        >
          {artUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artUrl}
              alt=""
              width={W}
              height={H / 2}
              style={{ width: W, height: H / 2, objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                background:
                  'radial-gradient(circle at 50% 40%, rgba(242,237,228,0.08), rgba(0,0,0,0) 70%)',
              }}
            />
          )}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 160,
              background:
                'linear-gradient(to bottom, rgba(11,10,8,0), rgba(11,10,8,1))',
            }}
          />
          {/* overlays */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 20,
              left: 20,
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                background: accent,
                color: '#15120C',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2,
                padding: '4px 12px',
                borderRadius: 6,
              }}
            >
              {meta.label.toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Estrela key={i} on={i < carta.estrelas} cor={accent} />
              ))}
            </div>
          </div>
          {carta.numero != null && (
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 20,
                right: 22,
                color: accent,
                fontSize: 26,
              }}
            >
              Nº {String(carta.numero).padStart(3, '0')}
            </div>
          )}
        </div>

        {/* Painel — metade inferior */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: H / 2,
            background: 'linear-gradient(180deg, #221d15 0%, #120f0b 100%)',
            borderTop: `2px solid ${accent}`,
            padding: '24px 30px',
          }}
        >
          {/* divisor ornamental desenhado */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{ display: 'flex', width: 90, height: 1, background: `${accent}88` }}
            />
            <div
              style={{
                display: 'flex',
                width: 7,
                height: 7,
                background: accent,
                transform: 'rotate(45deg)',
              }}
            />
            <div
              style={{ display: 'flex', width: 90, height: 1, background: `${accent}88` }}
            />
          </div>

          <div
            style={{ display: 'flex', color: '#F6F1E5', fontSize: 40, fontWeight: 700 }}
          >
            {carta.nome}
          </div>
          {carta.subtitulo && (
            <div
              style={{
                display: 'flex',
                color: accent,
                fontSize: 17,
                letterSpacing: 2,
                marginTop: 4,
              }}
            >
              {carta.subtitulo.toUpperCase()}
            </div>
          )}
          {carta.frase_central && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 16,
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.4)',
                border: `1px solid ${accent}55`,
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  color: '#EBE5D8',
                  fontSize: 22,
                  fontStyle: 'italic',
                }}
              >
                “{carta.frase_central}”
              </div>
              {carta.frase_referencia && (
                <div
                  style={{
                    display: 'flex',
                    color: '#9A9388',
                    fontSize: 15,
                    marginTop: 4,
                  }}
                >
                  {carta.frase_referencia}
                </div>
              )}
            </div>
          )}
          {carta.efeito_simbolico && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
              <div
                style={{
                  display: 'flex',
                  color: accent,
                  fontSize: 14,
                  letterSpacing: 2,
                }}
              >
                EFEITO
              </div>
              <div
                style={{
                  display: 'flex',
                  color: '#C9C2B4',
                  fontSize: 18,
                  marginTop: 2,
                }}
              >
                {carta.efeito_simbolico}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flex: 1 }} />
          {carta.categoria && (
            <div
              style={{
                display: 'flex',
                color: '#8A8378',
                fontSize: 15,
                letterSpacing: 2,
              }}
            >
              {carta.categoria.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: { 'Cache-Control': 'public, max-age=300' },
    },
  )
}
