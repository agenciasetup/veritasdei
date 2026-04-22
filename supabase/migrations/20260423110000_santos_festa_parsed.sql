-- Parseia `festa_texto` em colunas estruturadas para permitir
-- identificar "festa é hoje?" de forma eficiente.
--
-- Formatos suportados em festa_texto:
--   "10.04"                 → mês 10, dia 4
--   "12 de outubro"         → mês 10, dia 12
--   "29 de setembro"        → mês 9, dia 29
--   "Sexta após Corpus..."  → festa móvel (guardada em festa_movel)
--
-- festa_mes e festa_dia ficam null quando não parseável (festas móveis).

begin;

alter table public.santos
  add column if not exists festa_mes smallint check (festa_mes between 1 and 12),
  add column if not exists festa_dia smallint check (festa_dia between 1 and 31),
  add column if not exists festa_movel text;

-- Parser: tenta extrair mês/dia de festa_texto
-- Formato "MM.DD" (GCatholic original)
update public.santos
set
  festa_mes = (split_part(festa_texto, '.', 1))::smallint,
  festa_dia = (split_part(festa_texto, '.', 2))::smallint
where festa_texto ~ '^(0[1-9]|1[0-2])\.(0[1-9]|[12][0-9]|3[01])$'
  and festa_mes is null;

-- Formato "DD de MES" (pt-BR, meses por extenso)
update public.santos set festa_mes = 1,  festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de janeiro%'   and festa_mes is null;
update public.santos set festa_mes = 2,  festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de fevereiro%' and festa_mes is null;
update public.santos set festa_mes = 3,  festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de mar_o%'     and festa_mes is null;
update public.santos set festa_mes = 4,  festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de abril%'     and festa_mes is null;
update public.santos set festa_mes = 5,  festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de maio%'      and festa_mes is null;
update public.santos set festa_mes = 6,  festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de junho%'     and festa_mes is null;
update public.santos set festa_mes = 7,  festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de julho%'     and festa_mes is null;
update public.santos set festa_mes = 8,  festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de agosto%'    and festa_mes is null;
update public.santos set festa_mes = 9,  festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de setembro%'  and festa_mes is null;
update public.santos set festa_mes = 10, festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de outubro%'   and festa_mes is null;
update public.santos set festa_mes = 11, festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de novembro%'  and festa_mes is null;
update public.santos set festa_mes = 12, festa_dia = (substring(festa_texto from '^(\d{1,2})'))::smallint where festa_texto ilike '%de dezembro%'  and festa_mes is null;

-- Festa móvel (texto sem data fixa)
update public.santos
set festa_movel = festa_texto
where festa_mes is null
  and festa_texto is not null
  and festa_texto <> '';

create index if not exists santos_festa_data_idx
  on public.santos (festa_mes, festa_dia)
  where festa_mes is not null;

comment on column public.santos.festa_mes is
  'Mês da festa litúrgica (1-12). Null quando móvel ou não parseável.';
comment on column public.santos.festa_dia is
  'Dia da festa litúrgica (1-31). Null quando móvel.';
comment on column public.santos.festa_movel is
  'Texto da festa quando móvel (ex.: "Sexta após Corpus Christi").';

commit;
