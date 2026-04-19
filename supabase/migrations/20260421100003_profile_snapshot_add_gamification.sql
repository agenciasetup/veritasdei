-- ============================================================================
-- Gamificação — Estende get_public_profile_snapshot
-- ============================================================================
-- Adiciona level, total_xp e equipped_reliquia ao objeto de perfil público
-- retornado pela RPC. Permite que a comunidade/perfis públicos exibam o
-- nível ao lado do nome sem queries extras.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_profile_snapshot(identifier text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_identifier text := btrim(identifier);
  v_user_id uuid;
  v_profile jsonb;
  v_veritas jsonb;
  v_follower_count int;
  v_following_count int;
  v_veritas_count int;
  v_gami record;
  v_equipped jsonb;
BEGIN
  IF v_identifier = '' THEN
    RETURN jsonb_build_object('profile', NULL, 'veritas', '[]'::jsonb);
  END IF;

  IF left(v_identifier, 1) = '@' THEN
    v_identifier := substr(v_identifier, 2);
  END IF;

  IF v_identifier ~ '^[0-9]+$' THEN
    SELECT p.id INTO v_user_id
    FROM public.profiles p
    WHERE p.user_number = v_identifier::integer
    LIMIT 1;
  ELSE
    SELECT p.id INTO v_user_id
    FROM public.profiles p
    WHERE lower(p.public_handle) = lower(v_identifier)
    LIMIT 1;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('profile', NULL, 'veritas', '[]'::jsonb);
  END IF;

  SELECT COUNT(*) INTO v_follower_count
  FROM public.vd_follows WHERE followed_user_id = v_user_id;

  SELECT COUNT(*) INTO v_following_count
  FROM public.vd_follows WHERE follower_user_id = v_user_id;

  SELECT COUNT(*) INTO v_veritas_count
  FROM public.vd_posts
  WHERE author_user_id = v_user_id
    AND deleted_at IS NULL
    AND kind <> 'reply';

  -- Gamificação
  SELECT total_xp, current_level, current_streak, longest_streak, equipped_reliquia_id
    INTO v_gami
    FROM public.user_gamification
    WHERE user_id = v_user_id;

  -- Relíquia equipada (se houver)
  IF v_gami.equipped_reliquia_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', r.id,
      'slug', r.slug,
      'name', r.name,
      'description', r.description,
      'image_url', r.image_url,
      'rarity', r.rarity
    )
    INTO v_equipped
    FROM public.reliquias r
    WHERE r.id = v_gami.equipped_reliquia_id;
  END IF;

  SELECT jsonb_build_object(
      'id', p.id,
      'public_handle', p.public_handle,
      'user_number', p.user_number,
      'name', p.name,
      'vocacao', p.vocacao,
      'community_role', p.community_role,
      'verified', p.verified,
      'verified_at', p.verified_at,
      'profile_image_url', p.profile_image_url,
      'cover_image_url', p.cover_image_url,
      'bio_short', p.bio_short,
      'external_links', COALESCE(p.external_links, '[]'::jsonb),
      'cidade', p.cidade,
      'estado', p.estado,
      'paroquia', p.paroquia,
      'diocese', p.diocese,
      'comunidade', p.comunidade,
      'relationship_status', p.relationship_status,
      'instagram', p.instagram,
      'whatsapp', p.whatsapp,
      'tiktok', p.tiktok,
      'youtube', p.youtube,
      'follower_count', v_follower_count,
      'following_count', v_following_count,
      'veritas_count', v_veritas_count,
      'created_at', p.created_at,
      'level', COALESCE(v_gami.current_level, 1),
      'total_xp', COALESCE(v_gami.total_xp, 0),
      'current_streak', COALESCE(v_gami.current_streak, 0),
      'longest_streak', COALESCE(v_gami.longest_streak, 0),
      'equipped_reliquia', v_equipped
    )
    INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  WITH top_posts AS (
    SELECT
      vp.id,
      vp.kind,
      vp.body,
      vp.parent_post_id,
      vp.created_at,
      vp.city,
      vp.state,
      COALESCE(vm.like_count, 0) AS like_count,
      COALESCE(vm.repost_count, 0) AS repost_count,
      COALESCE(vm.quote_count, 0) AS quote_count,
      COALESCE(vm.reply_count, 0) AS reply_count,
      COALESCE(vm.report_count, 0) AS report_count,
      COALESCE(vm.share_cross_count, 0) AS share_cross_count
    FROM public.vd_posts vp
    LEFT JOIN public.vd_post_metrics vm ON vm.post_id = vp.id
    WHERE vp.author_user_id = v_user_id
      AND vp.deleted_at IS NULL
      AND vp.kind <> 'reply'
    ORDER BY vp.created_at DESC
    LIMIT 10
  ),
  media_by_post AS (
    SELECT
      pm.post_id,
      jsonb_agg(
        jsonb_build_object(
          'id', ma.id,
          'kind', ma.media_kind,
          'mime_type', ma.mime_type,
          'object_key', ma.object_key,
          'width', ma.width,
          'height', ma.height,
          'variants', ma.variants,
          'position', pm.position
        )
        ORDER BY pm.position ASC
      ) AS media
    FROM public.vd_post_media pm
    JOIN public.vd_media_assets ma ON ma.id = pm.media_asset_id
    GROUP BY pm.post_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', tp.id,
      'kind', tp.kind,
      'body', tp.body,
      'parent_post_id', tp.parent_post_id,
      'created_at', tp.created_at,
      'city', tp.city,
      'state', tp.state,
      'metrics', jsonb_build_object(
        'like_count', tp.like_count,
        'repost_count', tp.repost_count,
        'quote_count', tp.quote_count,
        'reply_count', tp.reply_count,
        'report_count', tp.report_count,
        'share_cross_count', tp.share_cross_count
      ),
      'media', COALESCE(mbp.media, '[]'::jsonb)
    )
    ORDER BY tp.created_at DESC
  )
  INTO v_veritas
  FROM top_posts tp
  LEFT JOIN media_by_post mbp ON mbp.post_id = tp.id;

  RETURN jsonb_build_object(
    'profile', v_profile,
    'veritas', COALESCE(v_veritas, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile_snapshot(text) TO anon, authenticated, service_role;
