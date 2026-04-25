import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isNsfwProviderConfigured, scanImage } from '@/lib/moderation/image-nsfw'

/**
 * GET /api/admin/moderation/diag?url=...
 *
 * Endpoint de diagnóstico do pipeline NSFW. Restrito a admin/moderator.
 * Retorna o estado das envs e o resultado bruto do scanImage para a URL
 * pública dada — útil quando o pipeline real está silenciando algum erro
 * (token errado, modelo inexistente, download bloqueado, etc.).
 *
 * Sem ?url, devolve só o estado das envs.
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('community_role')
    .eq('id', user.id)
    .maybeSingle()
  const role = profile?.community_role
  if (role !== 'admin' && role !== 'moderator') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const url = new URL(req.url).searchParams.get('url')
  const envs = {
    CF_ACCOUNT_ID: Boolean(process.env.CF_ACCOUNT_ID),
    CF_R2_ACCOUNT_ID: Boolean(process.env.CF_R2_ACCOUNT_ID),
    CF_WORKERS_AI_TOKEN: Boolean(process.env.CF_WORKERS_AI_TOKEN),
    CF_NSFW_MODEL: process.env.CF_NSFW_MODEL ?? null,
    CF_R2_PUBLIC_BASE_URL: process.env.CF_R2_PUBLIC_BASE_URL ?? null,
  }
  const configured = isNsfwProviderConfigured()

  if (!url) {
    return NextResponse.json({
      envs,
      configured,
      hint: 'Passe ?url=https://media.veritasdei.com.br/vd/...',
    })
  }

  const scan = await scanImage(url, { timeoutMs: 8000 })
  return NextResponse.json({ envs, configured, scan })
}
