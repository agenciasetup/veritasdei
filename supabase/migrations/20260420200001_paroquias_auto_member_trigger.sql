-- Auto-member trigger: quando uma paróquia é criada com owner_user_id
-- (wizard logado), o criador vira automaticamente admin da nova igreja.
-- Para cadastro público anônimo (sem owner_user_id), nada acontece — a
-- igreja fica "órfã" e entra no fluxo de claim.

CREATE OR REPLACE FUNCTION public.paroquias_auto_add_owner_as_admin()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.paroquia_members (paroquia_id, user_id, role, added_by, added_at)
    VALUES (NEW.id, NEW.owner_user_id, 'admin', NEW.owner_user_id, now())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_paroquias_auto_add_owner_as_admin ON public.paroquias;
CREATE TRIGGER trg_paroquias_auto_add_owner_as_admin
  AFTER INSERT ON public.paroquias
  FOR EACH ROW EXECUTE FUNCTION public.paroquias_auto_add_owner_as_admin();
