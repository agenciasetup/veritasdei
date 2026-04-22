-- Denúncias de conteúdo — botão "Reportar" em testemunhos/pedidos/cartas públicas.
--
-- Qualquer user logado pode reportar um conteúdo UGC (user-generated content)
-- como doutrinariamente impróprio. Admin triagens depois.
--
-- Categorias alinhadas com docs/copy-catolica.md:
--   heterodoxo           — doutrinariamente errado
--   supersticao          — promessa mágica / transação
--   sensacionalista      — "milagre" sem base, exagero
--   ofensivo             — contra a fé, heresia, escarnio
--   spam                 — propaganda, link duvidoso
--   outro                — descrever em texto

begin;

create table if not exists public.denuncias (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  conteudo_tipo text not null check (conteudo_tipo in ('pedido_oracao','intencao_publica','comentario')),
  conteudo_id   uuid not null,
  categoria     text not null check (categoria in ('heterodoxo','supersticao','sensacionalista','ofensivo','spam','outro')),
  detalhes      text check (detalhes is null or length(detalhes) <= 500),
  status        text not null default 'pendente'
                  check (status in ('pendente','procedente','improcedente','duplicata')),
  resolvido_em  timestamptz,
  resolvido_por uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists denuncias_status_idx
  on public.denuncias (status, created_at desc);

create index if not exists denuncias_conteudo_idx
  on public.denuncias (conteudo_tipo, conteudo_id);

create unique index if not exists denuncias_uniq_per_reporter
  on public.denuncias (reporter_id, conteudo_tipo, conteudo_id)
  where status = 'pendente';

alter table public.denuncias enable row level security;

drop policy if exists "denuncias reporter read" on public.denuncias;
create policy "denuncias reporter read"
  on public.denuncias for select to authenticated
  using (auth.uid() = reporter_id);

drop policy if exists "denuncias admin read" on public.denuncias;
create policy "denuncias admin read"
  on public.denuncias for select to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "denuncias auth insert" on public.denuncias;
create policy "denuncias auth insert"
  on public.denuncias for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "denuncias admin update" on public.denuncias;
create policy "denuncias admin update"
  on public.denuncias for update to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

grant select, insert on public.denuncias to authenticated;
grant select, insert, update, delete on public.denuncias to service_role;

-- RPC pra reportar — atomicamente cria denuncia + move conteudo pra moderacao_status=pendente
create or replace function public.denunciar_conteudo(
  p_conteudo_tipo text,
  p_conteudo_id uuid,
  p_categoria text,
  p_detalhes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reporter_id uuid := auth.uid();
  v_denuncia_id uuid;
  v_count int;
begin
  if v_reporter_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Insere denuncia (unique constraint evita duplicação do mesmo user)
  insert into public.denuncias (reporter_id, conteudo_tipo, conteudo_id, categoria, detalhes)
  values (v_reporter_id, p_conteudo_tipo, p_conteudo_id, p_categoria, p_detalhes)
  returning id into v_denuncia_id;

  -- Se 2+ denuncias do mesmo conteudo (não só esta), move para pendente
  select count(*) into v_count
  from public.denuncias
  where conteudo_tipo = p_conteudo_tipo
    and conteudo_id = p_conteudo_id
    and status = 'pendente';

  if v_count >= 2 then
    if p_conteudo_tipo = 'pedido_oracao' then
      update public.pedidos_oracao set moderacao_status = 'pendente' where id = p_conteudo_id;
    elsif p_conteudo_tipo = 'intencao_publica' then
      update public.intencoes set moderacao_status = 'pendente' where id = p_conteudo_id;
    end if;
  end if;

  return v_denuncia_id;
end;
$$;

grant execute on function public.denunciar_conteudo(text, uuid, text, text) to authenticated;

comment on table public.denuncias is
  'Denúncias de conteúdo UGC. 2+ denúncias pendentes removem conteúdo do feed público (via moderacao_status=pendente) até review humano.';

commit;
