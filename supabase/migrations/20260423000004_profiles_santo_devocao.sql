-- Adiciona santo de devoção ao perfil do usuário.
--
-- `santo_devocao_id` referencia santos(id). on delete set null preserva
-- o perfil caso o santo seja removido do catálogo.
-- `santo_devocao_escolhido_em` registra quando a escolha foi feita.
--
-- A capa (cover_image_url) é sincronizada via trigger em migration posterior.

begin;

alter table public.profiles
  add column if not exists santo_devocao_id          uuid,
  add column if not exists santo_devocao_escolhido_em timestamptz;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'profiles_santo_devocao_fk' and table_name = 'profiles'
  ) then
    alter table public.profiles
      add constraint profiles_santo_devocao_fk
      foreign key (santo_devocao_id)
      references public.santos(id)
      on delete set null;
  end if;
end $$;

create index if not exists profiles_santo_devocao_idx
  on public.profiles (santo_devocao_id)
  where santo_devocao_id is not null;

comment on column public.profiles.santo_devocao_id is
  'Santo de devoção escolhido pelo fiel. Determina a capa do perfil (via trigger sync).';
comment on column public.profiles.santo_devocao_escolhido_em is
  'Timestamp da escolha/última troca de santo de devoção.';

commit;
