-- Trigger sync: profiles.cover_image_url reflete santos.imagem_url do santo de devoção.
--
-- Fluxo 1: quando profile.santo_devocao_id muda, cover_image_url recebe
-- santos.imagem_url do novo santo (ou null se santo sem imagem / sem santo).
--
-- Fluxo 2: quando santos.imagem_url muda, todos os profiles que têm aquele
-- santo como devoção recebem cover_image_url atualizado.
--
-- Source of truth: santos.imagem_url. cover_image_url vira materialização
-- para evitar refactor em todas as leituras existentes.

begin;

-- Fluxo 1: on update de profile.santo_devocao_id --------------------------
create or replace function public.profiles_sync_cover_from_santo()
returns trigger
language plpgsql
as $$
begin
  -- Só ativa quando santo_devocao_id mudou (insert ou update)
  if tg_op = 'INSERT' or (new.santo_devocao_id is distinct from old.santo_devocao_id) then
    if new.santo_devocao_id is null then
      -- Mantém cover_image_url existente (legado) — não zera para não perder upload anterior
      return new;
    end if;
    select imagem_url into new.cover_image_url
    from public.santos
    where id = new.santo_devocao_id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_sync_cover_trigger on public.profiles;
create trigger profiles_sync_cover_trigger
  before insert or update of santo_devocao_id
  on public.profiles
  for each row execute function public.profiles_sync_cover_from_santo();

-- Fluxo 2: on update de santos.imagem_url ---------------------------------
create or replace function public.santos_propagate_imagem_url()
returns trigger
language plpgsql
as $$
begin
  if new.imagem_url is distinct from old.imagem_url then
    update public.profiles
    set cover_image_url = new.imagem_url
    where santo_devocao_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists santos_propagate_imagem_trigger on public.santos;
create trigger santos_propagate_imagem_trigger
  after update of imagem_url on public.santos
  for each row execute function public.santos_propagate_imagem_url();

commit;
