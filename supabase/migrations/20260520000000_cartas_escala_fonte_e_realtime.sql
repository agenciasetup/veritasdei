-- ============================================================================
-- Códex Veritas — Escala de fonte + realtime para o popup de desbloqueio
-- ============================================================================
-- escala_fonte: o admin ajusta a diagramação de cada carta (textos longos
-- cabem reduzindo a fonte; textos curtos podem crescer). 1.0 = padrão.
--
-- Realtime: user_cartas entra na publicação para o provider de eventos
-- mostrar o popup de "carta nova" em qualquer tela do app.
-- ============================================================================

begin;

alter table public.cartas
  add column if not exists escala_fonte numeric not null default 1.0
    check (escala_fonte between 0.5 and 2.0);

commit;

-- Publicação de realtime (fora da transação — alter publication não é
-- transacional em alguns ambientes). Idempotente.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_cartas'
  ) then
    alter publication supabase_realtime add table public.user_cartas;
  end if;
end $$;
