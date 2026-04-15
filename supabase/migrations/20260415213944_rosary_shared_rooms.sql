-- Rosary Marco 3 — Terço compartilhado em tempo real.
--
-- Uma "sala" (rosary_rooms) é criada por um host, recebe um código curto
-- de convite (6 chars alfanuméricos), e outros usuários entram via esse
-- código. O host e um opcional co-host são os únicos que podem avançar
-- a conta durante a sessão; todos os demais participantes acompanham
-- o passo atual via Supabase Realtime.
--
-- Decisões importantes:
--  - Login obrigatório (user_id sempre NOT NULL). Alinha com o Marco 2.
--  - Leader model: só host OU co-host avançam (campo passo_index).
--  - Estado da sala: aguardando → rezando → finalizada/encerrada.
--  - Cada sessão compartilhada gera uma entrada no rosary_sessions de
--    cada participante, com sala_id preenchido (coluna nova).
--
-- A lookup-by-code no fluxo de join é feita via SECURITY DEFINER function
-- `join_rosary_room(p_codigo)`, porque antes de entrar o usuário ainda
-- não é participante e a policy de SELECT normal bloquearia o acesso.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enum do estado da sala
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE rosary_room_state AS ENUM (
    'aguardando',  -- lobby, host ainda não iniciou
    'rezando',     -- sessão em curso
    'finalizada',  -- terminou naturalmente (todos rezaram o terço)
    'encerrada'    -- encerrada prematuramente (host saiu, timeout, etc.)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Tabelas (criadas antes das policies, pra que os subqueries possam
--    se referenciar mutuamente)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rosary_rooms (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo            text NOT NULL UNIQUE
                    CHECK (codigo ~ '^[A-Z0-9]{6}$'),
  host_user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  co_host_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mystery_set       rosary_mystery_set NOT NULL,
  silencioso        boolean NOT NULL DEFAULT false,
  state             rosary_room_state NOT NULL DEFAULT 'aguardando',
  passo_index       integer NOT NULL DEFAULT 0
                    CHECK (passo_index >= 0 AND passo_index < 200),
  titulo            text CHECK (titulo IS NULL OR char_length(titulo) <= 120),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  started_at        timestamptz,
  ended_at          timestamptz,
  CHECK (co_host_user_id IS NULL OR co_host_user_id <> host_user_id)
);

CREATE INDEX IF NOT EXISTS idx_rosary_rooms_host_active
  ON public.rosary_rooms (host_user_id, state)
  WHERE state IN ('aguardando','rezando');

CREATE INDEX IF NOT EXISTS idx_rosary_rooms_codigo_active
  ON public.rosary_rooms (codigo)
  WHERE state IN ('aguardando','rezando');

CREATE TABLE IF NOT EXISTS public.rosary_room_participants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES public.rosary_rooms(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text CHECK (display_name IS NULL OR char_length(display_name) <= 80),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  left_at       timestamptz,
  UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rosary_room_participants_room
  ON public.rosary_room_participants (room_id)
  WHERE left_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS + policies de rosary_rooms
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.rosary_rooms ENABLE ROW LEVEL SECURITY;

-- SELECT: host, co-host, ou qualquer participante da sala.
DROP POLICY IF EXISTS rosary_rooms_select ON public.rosary_rooms;
CREATE POLICY rosary_rooms_select ON public.rosary_rooms
  FOR SELECT USING (
    auth.uid() = host_user_id
    OR auth.uid() = co_host_user_id
    OR EXISTS (
      SELECT 1 FROM public.rosary_room_participants p
      WHERE p.room_id = rosary_rooms.id AND p.user_id = auth.uid()
    )
  );

-- INSERT: qualquer usuário logado pode criar uma sala, mas host_user_id
-- precisa ser ele próprio.
DROP POLICY IF EXISTS rosary_rooms_insert ON public.rosary_rooms;
CREATE POLICY rosary_rooms_insert ON public.rosary_rooms
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = host_user_id
  );

-- UPDATE: host OU co-host. A lógica mais fina (ex: só host pode trocar
-- co_host_user_id) é enforcada nos route handlers.
DROP POLICY IF EXISTS rosary_rooms_update ON public.rosary_rooms;
CREATE POLICY rosary_rooms_update ON public.rosary_rooms
  FOR UPDATE USING (
    auth.uid() = host_user_id OR auth.uid() = co_host_user_id
  )
  WITH CHECK (
    auth.uid() = host_user_id OR auth.uid() = co_host_user_id
  );

-- DELETE: só host.
DROP POLICY IF EXISTS rosary_rooms_delete ON public.rosary_rooms;
CREATE POLICY rosary_rooms_delete ON public.rosary_rooms
  FOR DELETE USING (auth.uid() = host_user_id);

-- Trigger updated_at.
CREATE OR REPLACE FUNCTION public.rosary_rooms_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rosary_rooms_updated_at ON public.rosary_rooms;
CREATE TRIGGER trg_rosary_rooms_updated_at
  BEFORE UPDATE ON public.rosary_rooms
  FOR EACH ROW EXECUTE FUNCTION public.rosary_rooms_set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS + policies de rosary_room_participants
--    Cada row = um usuário presente em uma sala. O host também tem um
--    row aqui (inserido automaticamente via trigger AFTER INSERT).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.rosary_room_participants ENABLE ROW LEVEL SECURITY;

-- SELECT: qualquer um que esteja na mesma sala (inclui host/co-host).
DROP POLICY IF EXISTS rosary_room_participants_select ON public.rosary_room_participants;
CREATE POLICY rosary_room_participants_select ON public.rosary_room_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rosary_rooms r
      WHERE r.id = rosary_room_participants.room_id
        AND (
          r.host_user_id = auth.uid()
          OR r.co_host_user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.rosary_room_participants p2
            WHERE p2.room_id = r.id AND p2.user_id = auth.uid()
          )
        )
    )
  );

-- INSERT: nenhum INSERT direto pelo cliente. Join é sempre via
-- SECURITY DEFINER function `join_rosary_room`. Host é inserido via
-- trigger AFTER INSERT na sala (que também roda como definer).
-- (No policy for INSERT → deny-by-default.)

-- UPDATE: o próprio usuário pode marcar left_at em si mesmo (saída).
DROP POLICY IF EXISTS rosary_room_participants_update ON public.rosary_room_participants;
CREATE POLICY rosary_room_participants_update ON public.rosary_room_participants
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: não permitido pelo cliente.

-- Trigger: ao criar uma sala, inserir automaticamente o host como participante.
CREATE OR REPLACE FUNCTION public.rosary_rooms_host_as_participant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.rosary_room_participants (room_id, user_id)
  VALUES (NEW.id, NEW.host_user_id)
  ON CONFLICT (room_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rosary_rooms_host_as_participant ON public.rosary_rooms;
CREATE TRIGGER trg_rosary_rooms_host_as_participant
  AFTER INSERT ON public.rosary_rooms
  FOR EACH ROW EXECUTE FUNCTION public.rosary_rooms_host_as_participant();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. join_rosary_room(p_codigo text)
--    SECURITY DEFINER: permite que um usuário não-participante descubra
--    uma sala pelo código e se insira como participante.
--    Valida: sala existe, state = 'aguardando' OU 'rezando', usuário
--    autenticado. Retorna a sala após o insert.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.join_rosary_room(p_codigo text)
RETURNS public.rosary_rooms
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_room public.rosary_rooms;
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

  INSERT INTO public.rosary_room_participants (room_id, user_id)
  VALUES (v_room.id, v_user_id)
  ON CONFLICT (room_id, user_id) DO UPDATE
    SET left_at = NULL, joined_at = now();

  RETURN v_room;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_rosary_room(text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Realtime: habilitar replicação das duas tabelas.
--    O cliente usa Postgres Changes para observar rosary_rooms (estado,
--    passo) e rosary_room_participants (entradas/saídas).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rosary_rooms;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rosary_room_participants;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. rosary_sessions.sala_id
--    Liga uma entrada de histórico individual à sala compartilhada em que
--    foi rezada. NULL = sessão solo (caminho Marco 2). ON DELETE SET NULL
--    pra não destruir histórico se a sala for removida por algum motivo.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.rosary_sessions
  ADD COLUMN IF NOT EXISTS sala_id uuid
    REFERENCES public.rosary_rooms(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rosary_sessions_sala
  ON public.rosary_sessions (sala_id)
  WHERE sala_id IS NOT NULL;

-- RLS do rosary_sessions_insert precisa ser relaxado pra aceitar sala_id:
-- se vier sala_id, o usuário precisa estar entre os participantes daquela
-- sala. Redefinimos a policy inteira.

DROP POLICY IF EXISTS rosary_sessions_insert ON public.rosary_sessions;
CREATE POLICY rosary_sessions_insert ON public.rosary_sessions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND (
      intention_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.rosary_intentions i
        WHERE i.id = intention_id AND i.user_id = auth.uid()
      )
    )
    AND (
      sala_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.rosary_room_participants p
        WHERE p.room_id = sala_id AND p.user_id = auth.uid()
      )
    )
  );
