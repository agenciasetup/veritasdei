-- Sugestões de amigos de 2º grau (amigos-de-amigos).
--
-- Por padrão a dashboard /educa sugere pessoas da mesma paróquia/diocese.
-- Quando esse filtro retorna pouco (perfil novo, paróquia rara), caímos
-- nesta RPC: usuários seguidos por gente que eu sigo, ranqueados por
-- número de "amigos em comum". Exclui eu mesmo e quem eu já sigo.
--
-- Performance: tabelas vd_follows e profiles têm índices nos colunas-chave.
-- Hard limit de 50 pra evitar abuso. SECURITY DEFINER porque a RLS de
-- profiles é mais restritiva — aqui só expomos campos públicos.

CREATE OR REPLACE FUNCTION public.find_friend_suggestions(p_limit int DEFAULT 10)
RETURNS TABLE (
  id                  uuid,
  name                text,
  public_handle       text,
  user_number         int,
  profile_image_url   text,
  paroquia            text,
  diocese             text,
  verified            boolean,
  mutual_count        int
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  WITH me AS (
    SELECT auth.uid() AS uid
  ),
  my_follows AS (
    SELECT f.followed_user_id
    FROM public.vd_follows f
    WHERE f.follower_user_id = (SELECT uid FROM me)
  ),
  candidates AS (
    SELECT
      f.followed_user_id AS uid,
      COUNT(*)::int      AS mutual_count
    FROM public.vd_follows f
    WHERE f.follower_user_id IN (SELECT followed_user_id FROM my_follows)
      AND f.followed_user_id <> (SELECT uid FROM me)
      AND f.followed_user_id NOT IN (SELECT followed_user_id FROM my_follows)
    GROUP BY f.followed_user_id
  )
  SELECT
    p.id,
    p.name,
    p.public_handle,
    p.user_number,
    p.profile_image_url,
    p.paroquia,
    p.diocese,
    p.verified,
    c.mutual_count
  FROM candidates c
  JOIN public.profiles p ON p.id = c.uid
  ORDER BY c.mutual_count DESC, p.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 50));
$$;

REVOKE ALL ON FUNCTION public.find_friend_suggestions(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_friend_suggestions(int) TO authenticated;

COMMENT ON FUNCTION public.find_friend_suggestions(int) IS
  'Sugestões de amigos de 2º grau (amigos-de-amigos), ranqueados por número de conexões em comum. Exclui o próprio usuário e quem ele já segue. Usado na dashboard /educa como fallback quando filtros por paróquia/diocese não retornam.';
