import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { VERITAS_MAX_BODY } from '@/lib/community/constants'
import { getCommunityFlags } from '@/lib/community/config'
import { COMMUNITY_EVENTS } from '@/lib/community/events'
import { buildMediaVariants, validateUploadCandidates } from '@/lib/community/media'
import { getR2PublicBaseUrl, isR2Configured } from '@/lib/community/r2'
import { fetchPostsByIds } from '@/lib/community/posts'
import { pushCommunityNotification } from '@/lib/community/notifications'
import { requireCommunityPremiumAccess } from '@/lib/community/server'
import type { VeritasKind, VeritasPostVariant } from '@/lib/community/types'
import {
  hasNsfwFlagged,
  moderateText,
  recordRejection,
  scanAssetsAndPersist,
} from '@/lib/moderation/pipeline'

interface CreateVeritasRequest {
  kind: VeritasKind
  variant?: VeritasPostVariant
  body?: string
  parent_post_id?: string | null
  media?: Array<{
    object_key: string
    mime_type: string
    bytes: number
    width?: number | null
    height?: number | null
  }>
}

const VALID_KINDS = new Set<VeritasKind>(['original', 'reply', 'repost', 'quote'])

export async function POST(req: NextRequest) {
  const access = await requireCommunityPremiumAccess()
  if (!access.ok) return access.response

  const { supabase, user } = access.context
  const flags = getCommunityFlags()

  if (!(await rateLimit(`community:create:${user.id}`, 20, 60_000))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  let payload: CreateVeritasRequest
  try {
    payload = await req.json() as CreateVeritasRequest
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const kind = payload.kind
  if (!VALID_KINDS.has(kind)) {
    return NextResponse.json({ error: 'invalid_kind' }, { status: 400 })
  }

  const variant: VeritasPostVariant = payload.variant === 'reflection' ? 'reflection' : 'default'

  // Reflexão só faz sentido em post original.
  if (variant === 'reflection' && kind !== 'original') {
    return NextResponse.json({ error: 'reflection_only_original' }, { status: 400 })
  }

  if (!flags.communityReplies && kind === 'reply') {
    return NextResponse.json({ error: 'replies_disabled' }, { status: 403 })
  }

  const parentPostId = payload.parent_post_id ?? null
  const body = (payload.body ?? '').trim()

  if (kind === 'original' || kind === 'reply' || kind === 'quote') {
    if (!body || body.length > VERITAS_MAX_BODY) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
    }
  }

  // Moderação de texto: filtro de teor sexual + blocklist de domínios.
  if (body.length > 0) {
    const textMod = await moderateText(supabase, body)
    if (!textMod.ok) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip')
      const ua = req.headers.get('user-agent')
      const reasonLabel =
        textMod.reason === 'text_filter'
          ? `text_filter:${textMod.hit.label}`
          : `blocked_domain:${textMod.hit.matchedDomain}`
      const sample =
        textMod.reason === 'text_filter' ? textMod.hit.sample : textMod.hit.url
      await recordRejection(supabase, {
        userId: user.id,
        reason: reasonLabel,
        sample,
        ip: ip ?? null,
        userAgent: ua,
      })
      return NextResponse.json(
        {
          error: 'content_blocked',
          reason: textMod.reason,
          detail: textMod.reason === 'text_filter'
            ? 'Seu post viola as Diretrizes da Comunidade (conteúdo sexual). Edite e tente novamente.'
            : `Links para o domínio "${textMod.hit.matchedDomain}" não são permitidos.`,
        },
        { status: 400 },
      )
    }
  }

  if (kind === 'repost' && body.length > VERITAS_MAX_BODY) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (kind !== 'original' && !parentPostId) {
    return NextResponse.json({ error: 'parent_required' }, { status: 400 })
  }

  if (kind === 'original' && parentPostId) {
    return NextResponse.json({ error: 'original_has_no_parent' }, { status: 400 })
  }

  const mediaInput = payload.media ?? []
  const mediaValidation = validateUploadCandidates(mediaInput.map(item => ({
    filename: item.object_key,
    mime_type: item.mime_type,
    bytes: item.bytes,
  })))

  if (!mediaValidation.ok && mediaInput.length > 0) {
    return NextResponse.json({ error: 'invalid_media', detail: mediaValidation.error }, { status: 400 })
  }

  if (kind === 'repost' && mediaInput.length > 0) {
    return NextResponse.json({ error: 'repost_no_media' }, { status: 400 })
  }

  for (const media of mediaInput) {
    if (!media.object_key.startsWith(`vd/${user.id}/`)) {
      return NextResponse.json({ error: 'invalid_object_key_scope' }, { status: 400 })
    }
  }

  const canUseMedia = mediaInput.length === 0 || (isR2Configured() && Boolean(getR2PublicBaseUrl()))
  if (!canUseMedia) {
    return NextResponse.json({ error: 'r2_not_configured' }, { status: 503 })
  }

  let parentAuthorId: string | null = null
  if (parentPostId) {
    const { data: parentPost, error: parentError } = await supabase
      .from('vd_posts')
      .select('id, author_user_id, kind')
      .eq('id', parentPostId)
      .is('deleted_at', null)
      .single()

    if (parentError || !parentPost) {
      return NextResponse.json({ error: 'parent_not_found' }, { status: 404 })
    }

    parentAuthorId = parentPost.author_user_id
  }

  let createdPostId: string | null = null
  const createdMediaAssetIds: string[] = []

  try {
    const { data: createdPost, error: createPostError } = await supabase
      .from('vd_posts')
      .insert({
        author_user_id: user.id,
        kind,
        variant,
        body,
        parent_post_id: parentPostId,
      })
      .select('id')
      .single()

    if (createPostError || !createdPost) {
      return NextResponse.json({ error: 'create_post_failed', detail: createPostError?.message }, { status: 500 })
    }

    createdPostId = createdPost.id

    if (mediaInput.length > 0) {
      const publicBase = getR2PublicBaseUrl()
      const validatedByKey = new Map(
        (mediaValidation.ok ? mediaValidation.items : []).map(item => [item.filename, item]),
      )

      const mediaRows = mediaInput.map(item => {
        const normalized = validatedByKey.get(item.object_key)
        if (!normalized) {
          throw new Error(`Media not validated: ${item.object_key}`)
        }

        return {
          owner_user_id: user.id,
          media_kind: normalized.kind,
          mime_type: normalized.mime_type,
          object_key: item.object_key,
          original_bytes: item.bytes,
          width: item.width ?? null,
          height: item.height ?? null,
          variants: buildMediaVariants(publicBase, item.object_key, normalized.kind),
        }
      })

      const { data: createdAssets, error: createAssetsError } = await supabase
        .from('vd_media_assets')
        .insert(mediaRows)
        .select('id, object_key')

      if (createAssetsError || !createdAssets) {
        throw new Error(createAssetsError?.message ?? 'Erro ao criar mídia')
      }

      createdMediaAssetIds.push(...createdAssets.map(asset => asset.id))

      // Classificação NSFW síncrona. Em dev (provider não configurado),
      // a chamada retorna available:false e o fluxo prossegue sem bloquear.
      const publicBaseForScan = getR2PublicBaseUrl()
      const decisions = await scanAssetsAndPersist(
        supabase,
        createdAssets.map((asset) => ({
          id: asset.id,
          object_key: asset.object_key,
          publicUrl: `${publicBaseForScan}/${asset.object_key}`,
        })),
      )
      if (hasNsfwFlagged(decisions)) {
        throw new Error('nsfw_flagged')
      }

      const linkRows = createdAssets.map((asset, index) => ({
        post_id: createdPost.id,
        media_asset_id: asset.id,
        position: index + 1,
      }))

      const { error: linkError } = await supabase
        .from('vd_post_media')
        .insert(linkRows)

      if (linkError) {
        throw new Error(linkError.message)
      }
    }

    const [post] = await fetchPostsByIds(supabase, user.id, [createdPost.id])

    if (!post) {
      return NextResponse.json({ error: 'post_not_found_after_create' }, { status: 500 })
    }

    if (parentAuthorId && parentAuthorId !== user.id) {
      const kindLabel = kind === 'reply'
        ? 'respondeu seu Veritas'
        : kind === 'quote'
          ? 'citou seu Veritas'
          : 'republicou seu Veritas'

      void pushCommunityNotification({
        userId: parentAuthorId,
        type: `community.${kind}`,
        title: 'Comunidade Veritas',
        body: `${post.author.name ?? 'Um membro'} ${kindLabel}.`,
        targetUrl: `/comunidade/veritas/${post.id}`,
        payload: {
          actor_user_id: user.id,
          post_id: post.id,
          parent_post_id: parentPostId,
          kind,
        },
        dedupeKey: `community:${kind}:${user.id}:${post.id}`,
      })
    }

    return NextResponse.json({
      event: COMMUNITY_EVENTS.veritasCreated,
      post,
    })
  } catch (error) {
    console.error('[community] create veritas failed:', error)

    if (createdMediaAssetIds.length > 0) {
      await supabase
        .from('vd_media_assets')
        .delete()
        .in('id', createdMediaAssetIds)
    }

    if (createdPostId) {
      await supabase
        .from('vd_posts')
        .delete()
        .eq('id', createdPostId)
    }

    const isNsfw = error instanceof Error && error.message === 'nsfw_flagged'
    if (isNsfw) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip')
      await recordRejection(supabase, {
        userId: user.id,
        reason: 'nsfw_flagged',
        sample: null,
        ip: ip ?? null,
        userAgent: req.headers.get('user-agent'),
      })
      return NextResponse.json(
        {
          error: 'content_blocked',
          reason: 'nsfw_image',
          detail: 'Uma ou mais imagens foram classificadas como conteúdo adulto/NSFW. Publicação bloqueada.',
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
