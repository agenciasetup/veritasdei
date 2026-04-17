-- Sprint 13 — sanitiza user_metadata.name no trigger handle_new_user.
--
-- Hoje, o nome vem de NEW.raw_user_meta_data->>'name' ou
-- NEW.raw_user_meta_data->>'full_name'. Esse metadata é SETADO PELO
-- CLIENTE no signup (opção `data: { name }` em supabase.auth.signUp),
-- sem validação server-side. Bot envia `name = "<script>..."` ou string
-- de 10k chars — vai direto para profiles.name e aparece em todo lugar
-- que renderizar o nome (lista de usuários admin, paróquia posts, etc.).
--
-- Sanitização no trigger (defense-in-depth; o app já exibe com
-- escapamento do React, mas backend limpo é mais robusto):
--   • strip caracteres de controle, tab, newline
--   • trim
--   • máximo 80 chars (cabe em UI, cobre 99% dos nomes reais)
--   • fallback para split_part(email, '@', 1) se resultado vazio

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  raw_name text;
  clean_name text;
BEGIN
  raw_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );

  -- Sanitiza: remove controle (incluindo \r\n), trim, corta em 80 chars.
  clean_name := regexp_replace(raw_name, '[[:cntrl:]]', '', 'g');
  clean_name := btrim(clean_name);
  clean_name := left(clean_name, 80);

  -- Se o nome ficou vazio após sanitização (era só whitespace/controle),
  -- cai pro local-part do email.
  IF clean_name IS NULL OR length(clean_name) = 0 THEN
    clean_name := left(btrim(split_part(COALESCE(NEW.email, 'usuario'), '@', 1)), 80);
  END IF;

  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, clean_name)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;
