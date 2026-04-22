-- Estende intencoes para permitir compartilhar graça recebida publicamente.
--
-- Quando user marca intenção como graca_recebida, pode optar por
-- compartilhar. Disclaimer obrigatório: "Testemunho pessoal. A Igreja
-- reconhece milagres por processo canônico formal." (P5 em copy-catolica.md)
--
-- Moderação:
--   - aprovado_auto: padrão. Aparece no feed público imediatamente.
--     Sujeito a remoção via reporte.
--   - pendente: movido pra fila de revisão humana (quando reportado).
--   - aprovado_humano: curado manualmente por admin.
--   - recusado: não aparece no feed público.

begin;

alter table public.intencoes
  add column if not exists compartilhada_publicamente boolean not null default false,
  add column if not exists moderacao_status text not null default 'aprovado_auto'
    check (moderacao_status in ('aprovado_auto','pendente','aprovado_humano','recusado')),
  add column if not exists moderado_em timestamptz,
  add column if not exists moderado_por uuid references public.profiles(id) on delete set null,
  add column if not exists motivo_recusa text;

create index if not exists intencoes_publicas_idx
  on public.intencoes (created_at desc)
  where compartilhada_publicamente = true
    and status = 'graca_recebida'
    and moderacao_status in ('aprovado_auto','aprovado_humano');

create index if not exists intencoes_santo_publicas_idx
  on public.intencoes (santo_id, created_at desc)
  where compartilhada_publicamente = true
    and status = 'graca_recebida'
    and moderacao_status in ('aprovado_auto','aprovado_humano');

-- Policy pública para graças compartilhadas (additive)
drop policy if exists "intencoes publicas read" on public.intencoes;
create policy "intencoes publicas read"
  on public.intencoes for select to anon, authenticated
  using (
    compartilhada_publicamente = true
    and status = 'graca_recebida'
    and moderacao_status in ('aprovado_auto','aprovado_humano')
  );

-- Grant select anon pra permitir leitura pública (RLS filtra)
grant select on public.intencoes to anon;

-- View pública com autor (opcional via anônimo futuro; por ora sempre nomeado)
create or replace view public.gracas_publicas as
select
  i.id,
  i.santo_id,
  i.texto,
  i.reflexao_graca,
  i.created_at,
  i.encerrada_em as graca_em,
  pr.name as autor_nome,
  pr.public_handle as autor_handle,
  pr.profile_image_url as autor_avatar,
  s.nome as santo_nome,
  s.slug as santo_slug,
  s.imagem_url as santo_imagem_url
from public.intencoes i
left join public.profiles pr on pr.id = i.user_id
left join public.santos s on s.id = i.santo_id
where i.compartilhada_publicamente = true
  and i.status = 'graca_recebida'
  and i.moderacao_status in ('aprovado_auto','aprovado_humano');

grant select on public.gracas_publicas to anon, authenticated;

comment on column public.intencoes.compartilhada_publicamente is
  'Se true, aparece no feed público /gracas (com disclaimer obrigatório). Default false — privado.';
comment on view public.gracas_publicas is
  'Feed público de graças recebidas curadas. Requer disclaimer canônico em toda UI consumidora.';

commit;
