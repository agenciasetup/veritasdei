-- Comunidade Veritas — Fix: recursos por papel exigem verified=true.
--
-- Antes: qualquer padre/artista podia usar os recursos. Agora precisa
-- ter verified_at setado (sprint 1.2). O boolean verified é sincronizado
-- com verified_at via trigger (sprint 1.2), então checar `verified`
-- é suficiente e rápido.
--
-- Admin continua podendo publicar sem verified porque admin é quem
-- concede verificação.

CREATE OR REPLACE FUNCTION public.vd_posts_guard_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role public.vd_community_role;
  v_verified boolean;
BEGIN
  IF NEW.variant = 'default' THEN
    RETURN NEW;
  END IF;

  SELECT community_role, verified
    INTO v_role, v_verified
  FROM public.profiles
  WHERE id = NEW.author_user_id;

  IF NEW.variant = 'reflection' THEN
    IF v_role IS NULL OR v_role NOT IN ('padre', 'diacono', 'bispo', 'religioso', 'admin') THEN
      RAISE EXCEPTION 'Apenas clero ou admin pode criar Reflexão';
    END IF;
    -- Admin pode sem verified; clero precisa ser verificado.
    IF v_role <> 'admin' AND NOT COALESCE(v_verified, false) THEN
      RAISE EXCEPTION 'Perfil precisa estar verificado para publicar Reflexão';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.vd_media_assets_guard_audio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role public.vd_community_role;
  v_verified boolean;
BEGIN
  IF NEW.media_kind <> 'audio' THEN
    RETURN NEW;
  END IF;

  SELECT community_role, verified
    INTO v_role, v_verified
  FROM public.profiles
  WHERE id = NEW.owner_user_id;

  IF v_role IS NULL OR v_role NOT IN ('artista', 'admin') THEN
    RAISE EXCEPTION 'Apenas artistas ou admins podem publicar áudio';
  END IF;

  IF v_role <> 'admin' AND NOT COALESCE(v_verified, false) THEN
    RAISE EXCEPTION 'Perfil precisa estar verificado para publicar áudio';
  END IF;

  RETURN NEW;
END;
$$;
