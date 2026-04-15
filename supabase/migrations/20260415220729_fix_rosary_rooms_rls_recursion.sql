-- Fix: circular RLS recursion entre rosary_rooms e rosary_room_participants.
--
-- A migration original criou duas policies SELECT que se referenciavam
-- mutuamente:
--   rosary_rooms_select → EXISTS (SELECT FROM rosary_room_participants ...)
--   rosary_room_participants_select → EXISTS (SELECT FROM rosary_rooms ...)
--
-- Postgres detecta isso em runtime e aborta com erro 42P17 "infinite
-- recursion detected in policy for relation". Isso fazia o POST
-- /api/rosario/rooms retornar 500, já que o INSERT ... RETURNING *
-- dispara a avaliação da policy SELECT.
--
-- Solução: extrair o teste de participação para uma função
-- SECURITY DEFINER, que roda com privilégios elevados e contorna RLS
-- internamente. As duas policies passam a chamar a função, quebrando
-- o ciclo.

CREATE OR REPLACE FUNCTION public.is_participant_of_room(
  p_room_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.rosary_room_participants
    WHERE room_id = p_room_id
      AND user_id = p_user_id
      AND left_at IS NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_participant_of_room(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_participant_of_room(uuid, uuid) TO authenticated;

-- rosary_rooms: passa a usar o helper em vez de um EXISTS direto.
DROP POLICY IF EXISTS rosary_rooms_select ON public.rosary_rooms;
CREATE POLICY rosary_rooms_select ON public.rosary_rooms
  FOR SELECT USING (
    auth.uid() = host_user_id
    OR auth.uid() = co_host_user_id
    OR public.is_participant_of_room(id, auth.uid())
  );

-- rosary_room_participants: evita referenciar rosary_rooms por completo.
-- Um usuário pode ver sua própria linha (user_id = auth.uid()) ou qualquer
-- linha de uma sala onde ele mesmo seja participante ativo.
DROP POLICY IF EXISTS rosary_room_participants_select ON public.rosary_room_participants;
CREATE POLICY rosary_room_participants_select ON public.rosary_room_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_participant_of_room(room_id, auth.uid())
  );
