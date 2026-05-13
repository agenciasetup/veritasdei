-- RPCs SECURITY DEFINER pra dashboard de grupo de estudo.
--
-- Cruzam tabelas privadas (user_content_progress, user_quiz_attempts) que
-- têm RLS bloqueando leitura cruzada entre usuários. As funções validam
-- que `auth.uid()` é member do grupo antes de retornar dados — daí o
-- SECURITY DEFINER fazer sentido sem vazar privacidade.
--
-- Funções:
--   1. study_group_member_stats(group_id)
--      → lista de members com XP/nível/streak/contagens
--   2. study_group_weekly_xp(group_id)
--      → ranking semanal estimado (sem tabela de log de XP)
--   3. study_group_activity_feed(group_id, limit)
--      → eventos cronológicos (estudo + provas aprovadas)
--
-- Aplicada via MCP em 2026-05-14.

CREATE OR REPLACE FUNCTION public.study_group_member_stats(p_group_id uuid)
RETURNS TABLE (
  user_id uuid,
  name text,
  profile_image_url text,
  public_handle text,
  role text,
  joined_at timestamptz,
  total_xp integer,
  current_level integer,
  current_streak integer,
  longest_streak integer,
  last_study_at timestamptz,
  studied_count bigint,
  quizzes_passed bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_study_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of the group';
  END IF;

  RETURN QUERY
  SELECT
    m.user_id,
    p.name,
    p.profile_image_url,
    p.public_handle,
    m.role::text,
    m.joined_at,
    COALESCE(g.total_xp, 0)::int,
    COALESCE(g.current_level, 1)::int,
    COALESCE(g.current_streak, 0)::int,
    COALESCE(g.longest_streak, 0)::int,
    g.last_study_at,
    (SELECT count(*) FROM public.user_content_progress ucp WHERE ucp.user_id = m.user_id),
    (SELECT count(*) FROM public.user_quiz_attempts uqa WHERE uqa.user_id = m.user_id AND uqa.passed = true)
  FROM public.study_group_members m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  LEFT JOIN public.user_gamification g ON g.user_id = m.user_id
  WHERE m.group_id = p_group_id
  ORDER BY COALESCE(g.total_xp, 0) DESC, m.joined_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.study_group_member_stats(uuid)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.study_group_weekly_xp(p_group_id uuid)
RETURNS TABLE (
  user_id uuid,
  name text,
  profile_image_url text,
  weekly_xp integer,
  weekly_subtopics bigint,
  weekly_quizzes bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_study_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of the group';
  END IF;

  RETURN QUERY
  SELECT
    m.user_id,
    p.name,
    p.profile_image_url,
    (
      (SELECT count(*) FROM public.user_content_progress ucp
        WHERE ucp.user_id = m.user_id AND ucp.studied_at > now() - interval '7 days')::int * 10
      +
      (SELECT count(*) FROM public.user_quiz_attempts uqa
        WHERE uqa.user_id = m.user_id AND uqa.completed_at > now() - interval '7 days' AND uqa.passed = true)::int * 20
      +
      (SELECT count(*) FROM public.user_quiz_attempts uqa
        WHERE uqa.user_id = m.user_id AND uqa.completed_at > now() - interval '7 days' AND uqa.score >= 100)::int * 10
    )::int AS weekly_xp,
    (SELECT count(*) FROM public.user_content_progress ucp
      WHERE ucp.user_id = m.user_id AND ucp.studied_at > now() - interval '7 days'),
    (SELECT count(*) FROM public.user_quiz_attempts uqa
      WHERE uqa.user_id = m.user_id AND uqa.completed_at > now() - interval '7 days')
  FROM public.study_group_members m
  LEFT JOIN public.profiles p ON p.id = m.user_id
  WHERE m.group_id = p_group_id
  ORDER BY weekly_xp DESC, p.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.study_group_weekly_xp(uuid)
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.study_group_activity_feed(p_group_id uuid, p_limit int DEFAULT 30)
RETURNS TABLE (
  kind text,
  user_id uuid,
  name text,
  profile_image_url text,
  ref_id uuid,
  ref_title text,
  score integer,
  occurred_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_limit int := LEAST(GREATEST(p_limit, 1), 50);
BEGIN
  IF NOT public.is_study_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of the group';
  END IF;

  RETURN QUERY
  (
    SELECT
      'studied'::text AS kind,
      m.user_id,
      p.name,
      p.profile_image_url,
      ucp.subtopic_id AS ref_id,
      cs.title AS ref_title,
      NULL::int AS score,
      ucp.studied_at AS occurred_at
    FROM public.study_group_members m
    JOIN public.user_content_progress ucp ON ucp.user_id = m.user_id
    LEFT JOIN public.content_subtopics cs ON cs.id = ucp.subtopic_id
    LEFT JOIN public.profiles p ON p.id = m.user_id
    WHERE m.group_id = p_group_id
      AND ucp.studied_at > now() - interval '30 days'
  )
  UNION ALL
  (
    SELECT
      'quiz_passed'::text AS kind,
      m.user_id,
      p.name,
      p.profile_image_url,
      uqa.quiz_id AS ref_id,
      sq.title AS ref_title,
      uqa.score,
      uqa.completed_at AS occurred_at
    FROM public.study_group_members m
    JOIN public.user_quiz_attempts uqa ON uqa.user_id = m.user_id
    LEFT JOIN public.study_quizzes sq ON sq.id = uqa.quiz_id
    LEFT JOIN public.profiles p ON p.id = m.user_id
    WHERE m.group_id = p_group_id
      AND uqa.passed = true
      AND uqa.completed_at > now() - interval '30 days'
  )
  ORDER BY occurred_at DESC
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.study_group_activity_feed(uuid, int)
  TO authenticated, service_role;
