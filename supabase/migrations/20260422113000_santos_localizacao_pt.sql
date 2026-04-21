alter table public.santos
  add column if not exists nome_origem text,
  add column if not exists nomes_alternativos_origem text[] not null default '{}',
  add column if not exists nome_secular_origem text,
  add column if not exists pais_referencia_origem text,
  add column if not exists nascimento_pais_origem text,
  add column if not exists morte_pais_origem text,
  add column if not exists beatificacao_pais_origem text,
  add column if not exists canonizacao_pais_origem text,
  add column if not exists beatificado_por_origem text,
  add column if not exists canonizado_por_origem text;

comment on column public.santos.nome_origem is
  'Nome cru vindo do GCatholic antes da localizacao para portugues.';

comment on column public.santos.nomes_alternativos_origem is
  'Aliases crus vindos do GCatholic antes da localizacao para portugues.';

comment on column public.santos.nome_secular_origem is
  'Nome secular cru vindo do GCatholic antes da localizacao para portugues.';

comment on column public.santos.pais_referencia_origem is
  'Pais de referencia original vindo do GCatholic antes da traducao para portugues.';

comment on column public.santos.beatificado_por_origem is
  'Nome original do pontifice da beatificacao antes da localizacao para portugues.';

comment on column public.santos.canonizado_por_origem is
  'Nome original do pontifice da canonizacao antes da localizacao para portugues.';

update public.santos
set
  nome_origem = coalesce(nome_origem, nome),
  nomes_alternativos_origem = case
    when coalesce(array_length(nomes_alternativos_origem, 1), 0) = 0 then coalesce(nomes_alternativos, '{}')
    else nomes_alternativos_origem
  end,
  nome_secular_origem = coalesce(nome_secular_origem, nome_secular),
  pais_referencia_origem = coalesce(pais_referencia_origem, pais_referencia),
  nascimento_pais_origem = coalesce(nascimento_pais_origem, nascimento_pais),
  morte_pais_origem = coalesce(morte_pais_origem, morte_pais),
  beatificacao_pais_origem = coalesce(beatificacao_pais_origem, beatificacao_pais),
  canonizacao_pais_origem = coalesce(canonizacao_pais_origem, canonizacao_pais),
  beatificado_por_origem = coalesce(beatificado_por_origem, beatificado_por),
  canonizado_por_origem = coalesce(canonizado_por_origem, canonizado_por);
