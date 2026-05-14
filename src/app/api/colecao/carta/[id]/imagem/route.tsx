/**
 * GET /api/colecao/carta/[id]/imagem — renderiza a carta como PNG (next/og).
 *
 * Usado pelo botão "Salvar como imagem" do editor admin e pode servir para
 * compartilhamento. Gate: admin, OU o usuário desbloqueou a carta, OU a carta
 * está publicada e visível.
 *
 * O layout é uma versão fiel (porém simplificada p/ o Satori) da CartaView:
 * metade superior = ilustração, metade inferior = painel de texto.
 */
import { ImageResponse } from 'next/og'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { RARIDADE_META, type Carta } from '@/types/colecao'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const W = 600
const H = 840

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
  const estrelas =
    '★'.repeat(carta.estrelas) + '☆'.repeat(Math.max(0, 5 - carta.estrelas))

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg, #181510 0%, #0c0b09 100%)',
          border: `4px solid ${meta.borda.replace(/[\d.]+\)$/, '0.9)')}`,
          borderRadius: 28,
        }}
      >
        {/* Metade superior — ilustração */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            width: '100%',
            height: H / 2,
            overflow: 'hidden',
          }}
        >
          {carta.ilustracao_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={carta.ilustracao_url}
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
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 140,
                color: accent,
                opacity: 0.4,
              }}
            >
              {carta.simbolo || '✛'}
            </div>
          )}
          {/* fade */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 150,
              background:
                'linear-gradient(to bottom, rgba(12,11,9,0), rgba(12,11,9,1))',
            }}
          />
          {/* overlays */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 18,
              left: 18,
              flexDirection: 'column',
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
            <div style={{ display: 'flex', color: accent, fontSize: 24, marginTop: 6 }}>
              {estrelas}
            </div>
          </div>
          {carta.numero != null && (
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 18,
                right: 22,
                color: accent,
                fontSize: 26,
              }}
            >
              Nº {String(carta.numero).padStart(3, '0')}
            </div>
          )}
        </div>

        {/* Metade inferior — painel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: H / 2,
            background: 'linear-gradient(180deg, #201b14 0%, #120f0b 100%)',
            borderTop: `2px solid ${accent}`,
            padding: '26px 30px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              color: accent,
              fontSize: 16,
              marginBottom: 14,
            }}
          >
            ✦ ─────────── ✦
          </div>
          <div
            style={{
              display: 'flex',
              color: '#F4EFE3',
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            {carta.nome}
          </div>
          {carta.subtitulo && (
            <div
              style={{
                display: 'flex',
                color: accent,
                fontSize: 18,
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
              <div style={{ display: 'flex', color: '#E8E2D6', fontSize: 22, fontStyle: 'italic' }}>
                “{carta.frase_central}”
              </div>
              {carta.frase_referencia && (
                <div style={{ display: 'flex', color: '#8A8378', fontSize: 15, marginTop: 4 }}>
                  {carta.frase_referencia}
                </div>
              )}
            </div>
          )}
          {carta.efeito_simbolico && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
              <div style={{ display: 'flex', color: accent, fontSize: 14, letterSpacing: 2 }}>
                EFEITO
              </div>
              <div style={{ display: 'flex', color: '#C9C2B4', fontSize: 18, marginTop: 2 }}>
                {carta.efeito_simbolico}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flex: 1 }} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#8A8378',
              fontSize: 15,
              letterSpacing: 2,
            }}
          >
            <div style={{ display: 'flex' }}>{(carta.categoria || '').toUpperCase()}</div>
            <div style={{ display: 'flex', color: accent, fontSize: 22 }}>
              {carta.simbolo || ''}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    },
  )
}
