-- Clarificação doutrinária: a tabela `reliquias` armazena selos de devoção
-- (badges gamificados) e NÃO relíquias no sentido canônico.
--
-- Relíquias canônicas (CIC §1674) são restos mortais ou objetos pessoais
-- de santos, veneradas pela Igreja em seus locais próprios. Este schema
-- representa marcadores simbólicos da jornada do usuário no app — a UI
-- usa "Selo de Devoção" como termo user-facing. O nome da tabela foi
-- mantido por compatibilidade, mas deve ser interpretado como metáfora.
--
-- Ver docs/copy-catolica.md §2 (Glossário) e §1 (Princípios).

begin;

comment on table public.reliquias is
  'Catálogo de SELOS DE DEVOÇÃO (badges gamificados). Não confundir com relíquias no sentido canônico (CIC §1674). Na UI aparece como "Selo de Devoção" / "Selos". Ver docs/copy-catolica.md.';

comment on table public.user_reliquias is
  'Selos de devoção desbloqueados por cada usuário. Ver comment em public.reliquias.';

comment on column public.user_gamification.equipped_reliquia_id is
  'Selo de devoção equipado (exibido ao lado do nome no perfil público).';

commit;
