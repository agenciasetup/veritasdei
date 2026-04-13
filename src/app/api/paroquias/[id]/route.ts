import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * PATCH /api/paroquias/[id]
 *   body: Partial<Paroquia> (apenas campos editáveis)
 *   → atualiza a paroquia, respeitando RLS + trigger guard.
 *
 * Server-side porque a página de edição vinha tendo problemas de PATCH
 * direto ao postgrest pelo browser client (alguns ambientes/redes bloqueiam
 * e a promise fica pendurada). Aqui a requisição é simples POST-like que
 * sempre volta com JSON de sucesso ou erro explícito.
 */

// Whitelist: apenas campos que a página de edição mexe.
// Campos de verificação/status/owner ficam de fora (são guardados por trigger).
const ALLOWED_FIELDS = [
  'nome',
  'cnpj',
  'tipo_igreja',
  'diocese',
  'endereco',
  'rua',
  'numero',
  'bairro',
  'complemento',
  'cidade',
  'estado',
  'pais',
  'cep',
  'padre_responsavel',
  'telefone',
  'email',
  'foto_url',
  'fotos',
  'foto_capa_url',
  'foto_perfil_url',
  'historia_blocks',
  'santo_nome',
  'santo_descricao',
  'santo_imagem_url',
  'santo_data_festa',
  'curiosidades',
  'informacoes_uteis',
  'seo_title',
  'seo_description',
  'seo_keywords',
  'instagram',
  'facebook',
  'site',
  'informacoes_extras',
  'horarios_missa',
  'horarios_confissao',
  'verificacao_documento_path',
  'verificacao_solicitada_em',
  'verificacao_notas',
] as const

type AllowedField = (typeof ALLOWED_FIELDS)[number]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) patch[key as AllowedField] = body[key]
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'empty_patch' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('paroquias')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    console.error('[paroquias] update error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ paroquia: data })
}
