-- Pedidos de oração — intercessão cruzada entre fiéis.
--
-- Tg 5,16: "Orai uns pelos outros, para serdes salvos."
-- Usuário publica um pedido (anônimo ou nomeado). Outros marcam "Rezei
-- por sua intenção" — ato de quem reza, não reivindicação mágica.
--
-- Copy proibida (docs/copy-catolica.md §2):
--   "seu santo agiu porque X rezou" → NÃO
--   "rezei por sua intenção" → OK

begin;

create table if not exists public.pedidos_oracao (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  santo_id         uuid references public.santos(id) on delete set null,
  texto            text not null check (length(texto) between 10 and 600),
  anonimo          boolean not null default false,
  status           text not null default 'aberto'
                     check (status in ('aberto','graca_recebida','arquivado','bloqueado')),
  moderacao_status text not null default 'aprovado_auto'
                     check (moderacao_status in ('aprovado_auto','pendente','aprovado_humano','recusado')),
  motivo_recusa    text,
  encerrado_em     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists pedidos_oracao_publicos_idx
  on public.pedidos_oracao (created_at desc)
  where status = 'aberto' and moderacao_status in ('aprovado_auto','aprovado_humano');

create index if not exists pedidos_oracao_santo_idx
  on public.pedidos_oracao (santo_id, created_at desc)
  where status = 'aberto' and moderacao_status in ('aprovado_auto','aprovado_humano');

create index if not exists pedidos_oracao_user_idx
  on public.pedidos_oracao (user_id, created_at desc);

-- Tabela de "rezei" — cada user pode marcar uma vez por pedido
create table if not exists public.pedidos_oracao_rezas (
  pedido_id  uuid not null references public.pedidos_oracao(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pedido_id, user_id)
);

create index if not exists pedidos_oracao_rezas_pedido_idx
  on public.pedidos_oracao_rezas (pedido_id);

-- RLS pedidos_oracao
alter table public.pedidos_oracao enable row level security;

drop policy if exists "pedidos_oracao public read" on public.pedidos_oracao;
create policy "pedidos_oracao public read"
  on public.pedidos_oracao for select to anon, authenticated
  using (status = 'aberto' and moderacao_status in ('aprovado_auto','aprovado_humano'));

drop policy if exists "pedidos_oracao owner read" on public.pedidos_oracao;
create policy "pedidos_oracao owner read"
  on public.pedidos_oracao for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "pedidos_oracao owner insert" on public.pedidos_oracao;
create policy "pedidos_oracao owner insert"
  on public.pedidos_oracao for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "pedidos_oracao owner update" on public.pedidos_oracao;
create policy "pedidos_oracao owner update"
  on public.pedidos_oracao for update to authenticated
  using (auth.uid() = user_id);

drop policy if exists "pedidos_oracao owner delete" on public.pedidos_oracao;
create policy "pedidos_oracao owner delete"
  on public.pedidos_oracao for delete to authenticated
  using (auth.uid() = user_id);

grant select on public.pedidos_oracao to anon;
grant select, insert, update, delete on public.pedidos_oracao to authenticated;
grant select, insert, update, delete on public.pedidos_oracao to service_role;

-- RLS rezas
alter table public.pedidos_oracao_rezas enable row level security;

drop policy if exists "rezas public count" on public.pedidos_oracao_rezas;
create policy "rezas public count"
  on public.pedidos_oracao_rezas for select to authenticated
  using (true); -- só lê — user vê que rezou por quais pedidos; count é aggregate

drop policy if exists "rezas owner insert" on public.pedidos_oracao_rezas;
create policy "rezas owner insert"
  on public.pedidos_oracao_rezas for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "rezas owner delete" on public.pedidos_oracao_rezas;
create policy "rezas owner delete"
  on public.pedidos_oracao_rezas for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on public.pedidos_oracao_rezas to authenticated;
grant select, insert, update, delete on public.pedidos_oracao_rezas to service_role;

-- Trigger updated_at
create or replace function public.pedidos_oracao_set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists trg_pedidos_oracao_updated_at on public.pedidos_oracao;
create trigger trg_pedidos_oracao_updated_at
before update on public.pedidos_oracao
for each row execute function public.pedidos_oracao_set_updated_at();

-- View agregada com count de rezas (para leitura pública sem expor quem rezou)
create or replace view public.pedidos_oracao_publicos as
select
  p.id,
  p.santo_id,
  p.texto,
  p.anonimo,
  p.created_at,
  case when p.anonimo then null else pr.name end as autor_nome,
  case when p.anonimo then null else pr.public_handle end as autor_handle,
  case when p.anonimo then null else pr.profile_image_url end as autor_avatar,
  (select count(*)::int from public.pedidos_oracao_rezas r where r.pedido_id = p.id) as total_rezas
from public.pedidos_oracao p
left join public.profiles pr on pr.id = p.user_id
where p.status = 'aberto'
  and p.moderacao_status in ('aprovado_auto','aprovado_humano');

grant select on public.pedidos_oracao_publicos to anon, authenticated;

comment on table public.pedidos_oracao is
  'Pedidos públicos de oração. Tg 5,16. Copy obrigatória: "rezei por sua intenção" (ato), não "ajudei a conseguir a graça".';
comment on view public.pedidos_oracao_publicos is
  'View pública com contagem de rezas agregada. Esconde identidade quando anonimo=true.';

commit;
