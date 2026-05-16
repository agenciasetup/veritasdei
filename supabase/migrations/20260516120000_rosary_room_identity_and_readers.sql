-- Rosary — fix "Anônimo" bug + add decade reader assignment + avatars.
--
-- Problema 1 (ANONIMO bug):
--   `lookupDisplayName` no servidor consultava `profiles.name` e gravava
--   o resultado em `rosary_room_participants.display_name`. Mas o
--   auto-join via SECURITY DEFINER (`join_rosary_room`) e o trigger de
--   host criavam o participante SEM o display_name — o UPDATE seguinte
--   às vezes não rodava (RLS, race, etc), deixando 35% dos registros com
--   display_name = NULL. UI então mostrava "Anônimo".
--
-- Solução:
--   Resolve o display_name (e o avatar_url) dentro do próprio SQL, na
--   função SECURITY DEFINER. Fallback chain: profiles.name → auth meta
--   (full_name/name) → email prefix → 'Convidado'. Aplica no INSERT do
--   host trigger E no INSERT do join_rosary_room.
--
-- Problema 2 (modo dinâmico em grupo):
--   No terço tradicional, cada participante lê um mistério diferente.
--   Adiciona `decade_readers JSONB` em rosary_rooms — mapa
--   `{ "1": user_id, "2": user_id, ... }`. Host e co-host atribuem
--   leitores via PATCH (policy de UPDATE já existe). UI destaca o
--   leitor durante cada dezena.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Coluna `decade_readers` em rosary_rooms
--    JSONB em vez de tabela separada — leitores são parte do "estado da
--    sala", lidos junto com state/passo_index, e a UI raramente precisa
--    consultá-los isoladamente.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.rosary_rooms
  ADD COLUMN IF NOT EXISTS decade_readers JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.rosary_rooms.decade_readers IS
  'Mapeamento { "1"|"2"|"3"|"4"|"5": user_id } de quem lê cada dezena. Vazio = host lê tudo.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Coluna `avatar_url` em rosary_room_participants
--    Denormalizada do profiles. Evita expor a tabela `profiles` inteira
--    via JOIN/view com RLS complexa só pra renderizar avatares na sala.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.rosary_room_participants
  ADD COLUMN IF NOT EXISTS avatar_url TEXT
    CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 1000);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Helpers SECURITY DEFINER pra resolver identidade do usuário.
--    São auxiliares — só usados pelos triggers/funções abaixo. Não
--    exposto via GRANT EXECUTE pro role authenticated.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._rosary_resolve_display_name(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF(TRIM((SELECT name FROM public.profiles WHERE id = p_user_id LIMIT 1)), ''),
    NULLIF(TRIM((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = p_user_id LIMIT 1)), ''),
    NULLIF(TRIM((SELECT raw_user_meta_data->>'name'      FROM auth.users WHERE id = p_user_id LIMIT 1)), ''),
    NULLIF(SPLIT_PART((SELECT email FROM auth.users WHERE id = p_user_id LIMIT 1), '@', 1), ''),
    'Convidado'
  )
$$;

CREATE OR REPLACE FUNCTION public._rosary_resolve_avatar_url(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $$
  SELECT COALESCE(
    NULLIF((SELECT profile_image_url FROM public.profiles WHERE id = p_user_id LIMIT 1), ''),
    NULLIF((SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id = p_user_id LIMIT 1), ''),
    NULLIF((SELECT raw_user_meta_data->>'picture'    FROM auth.users WHERE id = p_user_id LIMIT 1), '')
  )
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger do host — agora preenche display_name + avatar_url
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rosary_rooms_host_as_participant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.rosary_room_participants (room_id, user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.host_user_id,
    public._rosary_resolve_display_name(NEW.host_user_id),
    public._rosary_resolve_avatar_url(NEW.host_user_id)
  )
  ON CONFLICT (room_id, user_id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        avatar_url   = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. join_rosary_room — também preenche display_name + avatar_url
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.join_rosary_room(p_codigo text)
RETURNS public.rosary_rooms
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_room    public.rosary_rooms;
  v_name    text;
  v_avatar  text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_room
  FROM public.rosary_rooms
  WHERE codigo = upper(p_codigo)
    AND state IN ('aguardando','rezando')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'room_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_name   := public._rosary_resolve_display_name(v_user_id);
  v_avatar := public._rosary_resolve_avatar_url(v_user_id);

  INSERT INTO public.rosary_room_participants (room_id, user_id, display_name, avatar_url)
  VALUES (v_room.id, v_user_id, v_name, v_avatar)
  ON CONFLICT (room_id, user_id) DO UPDATE
    SET left_at      = NULL,
        joined_at    = now(),
        display_name = COALESCE(EXCLUDED.display_name, public.rosary_room_participants.display_name),
        avatar_url   = COALESCE(EXCLUDED.avatar_url,   public.rosary_room_participants.avatar_url);

  RETURN v_room;
END;
$$;

-- Já garantido no GRANT da migration original, mas reafirma se for re-rodada.
GRANT EXECUTE ON FUNCTION public.join_rosary_room(text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Backfill: registros existentes com display_name NULL ou vazio
--    recebem o nome resolvido agora. Mesmo pra avatar_url.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE public.rosary_room_participants p
SET display_name = public._rosary_resolve_display_name(p.user_id)
WHERE p.display_name IS NULL OR TRIM(p.display_name) = '';

UPDATE public.rosary_room_participants p
SET avatar_url = public._rosary_resolve_avatar_url(p.user_id)
WHERE p.avatar_url IS NULL;
