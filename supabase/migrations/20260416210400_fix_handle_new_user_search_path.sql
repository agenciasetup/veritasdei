-- Fix: "Database error saving new user" on OAuth signup (Google / email).
--
-- Root cause: trigger functions on auth.users / public.profiles declared as
-- SECURITY DEFINER (or invoked inside a SECURITY DEFINER chain) without a
-- pinned search_path. The GoTrue connection has an empty search_path, so
-- unqualified references like nextval('profiles_user_number_seq') and the
-- table catequistas_autorizados failed with "relation does not exist",
-- aborting the INSERT into auth.users.
--
-- Fix:
--   1) Pin search_path = public, pg_temp on all profile-related trigger functions.
--   2) Fully qualify object names inside the functions.
--   3) Make handle_new_user idempotent and tolerant of OAuth providers
--      (name may come from raw_user_meta_data.name or .full_name).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      split_part(COALESCE(NEW.email, ''), '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_user_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NEW.user_number IS NULL THEN
    NEW.user_number := nextval('public.profiles_user_number_seq');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_verify_catequista()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  user_email TEXT;
  auth_record RECORD;
BEGIN
  IF NEW.vocacao = 'catequista' AND (OLD.vocacao IS DISTINCT FROM 'catequista' OR TG_OP = 'INSERT') THEN
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

    SELECT * INTO auth_record FROM public.catequistas_autorizados
    WHERE email = user_email AND usado = false
    LIMIT 1;

    IF FOUND THEN
      NEW.verified := true;
      UPDATE public.catequistas_autorizados
      SET usado = true, usado_por = NEW.id, usado_em = now()
      WHERE id = auth_record.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
