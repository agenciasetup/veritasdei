-- Fix do bug "Não foi possível criar o grupo" (403).
--
-- O fluxo de criação faz:
--   1. INSERT INTO study_groups (...) RETURNING *
--   2. INSERT INTO study_group_members (group_id, user_id, role='owner')
--
-- O RETURNING * do passo 1 precisa de permissão SELECT na row recém-criada.
-- A policy antiga `study_groups_select_member` checava `is_study_group_member(id)`,
-- que era FALSE no momento do RETURNING (o membro só é inserido depois).
-- Resultado: 403 e rollback aparente — o cliente mostrava "Não foi possível
-- criar o grupo".
--
-- Solução: ampliar a policy SELECT pra também aceitar o próprio criador
-- (`created_by = auth.uid()`). Mantém a privacidade do grupo entre
-- não-membros (sem vazar lista de grupos) e ao mesmo tempo permite que o
-- owner leia o grupo que acabou de criar (e em geral seu próprio grupo).
--
-- Aplicada via MCP em 2026-05-14.

DROP POLICY IF EXISTS study_groups_select_member ON public.study_groups;
CREATE POLICY study_groups_select_member
  ON public.study_groups
  FOR SELECT
  USING (
    public.is_study_group_member(id)
    OR created_by = auth.uid()
  );
