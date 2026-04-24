-- Exclusão LGPD com grace period de 30 dias e cascata assimétrica:
-- * vd_posts do usuário recebem soft-delete (preserva threads públicas).
-- * UGC privado (cartas, intenções, pedidos, prefs, interações sociais, mídia)
--   é removido em hard-delete.
-- * Perfil é anonimizado e marcado como banned (evita reutilização).
-- A remoção do auth.users fica a cargo do cliente admin (opcional; a
-- anonimização aqui basta para cumprir a LGPD art. 18 V).

begin;

create or replace function public.request_account_deletion(p_user_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scheduled_for timestamptz := now() + interval '30 days';
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;

  update public.profiles
     set account_status        = 'pending_deletion',
         deletion_requested_at = now(),
         deletion_scheduled_for = v_scheduled_for
   where id = p_user_id;

  return v_scheduled_for;
end;
$$;

create or replace function public.cancel_account_deletion(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;

  update public.profiles
     set account_status        = 'active',
         deletion_requested_at = null,
         deletion_scheduled_for = null
   where id = p_user_id
     and account_status = 'pending_deletion';
end;
$$;

create or replace function public.soft_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Soft-delete de posts públicos preserva integridade de threads.
  update public.vd_posts
     set body = '[post removido]',
         deleted_at = coalesce(deleted_at, now())
   where author_user_id = p_user_id;

  -- Hard-delete de UGC privado e derivados.
  delete from public.cartas_santo       where user_id = p_user_id;
  delete from public.intencoes          where user_id = p_user_id;
  delete from public.pedidos_oracao     where user_id = p_user_id;
  delete from public.user_notificacoes_prefs where user_id = p_user_id;
  delete from public.vd_reactions       where user_id = p_user_id;
  delete from public.vd_follows         where follower_user_id = p_user_id or followed_user_id = p_user_id;
  delete from public.vd_blocks          where blocker_user_id = p_user_id or blocked_user_id = p_user_id;
  delete from public.vd_mutes           where muter_user_id  = p_user_id or muted_user_id  = p_user_id;
  delete from public.vd_media_assets    where owner_user_id = p_user_id;

  -- Anonimiza perfil e bloqueia reutilização.
  update public.profiles
     set name                 = '[conta excluída]',
         data_nascimento      = null,
         cpf                  = null,
         paroquia             = null,
         diocese              = null,
         cidade               = null,
         estado               = null,
         comunidade           = null,
         bio_short            = null,
         external_links       = null,
         profile_image_url    = null,
         cover_image_url      = null,
         public_handle        = null,
         santo_devocao_id     = null,
         sacramentos          = '{}'::text[],
         account_status       = 'banned',
         deletion_requested_at = coalesce(deletion_requested_at, now()),
         deletion_scheduled_for = now()
   where id = p_user_id;
end;
$$;

comment on function public.request_account_deletion(uuid) is
  'Marca conta do caller para exclusão em 30 dias. Exige auth.uid() = p_user_id.';
comment on function public.cancel_account_deletion(uuid) is
  'Cancela pedido de exclusão dentro do grace period.';
comment on function public.soft_delete_user(uuid) is
  'Executa exclusão em cascata (LGPD art. 18 V). Deve ser chamada por cron/service_role ao fim do grace period ou pelo próprio usuário em exclusão imediata.';

commit;
