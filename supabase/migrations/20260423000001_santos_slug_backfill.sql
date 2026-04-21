-- Backfill de slugs para todos os santos existentes.
--
-- Estratégia: santos_slugify(nome) como base. Quando há colisão, o primeiro
-- (ORDER BY gcatholic_person_id) mantém slug limpo e os demais ganham sufixo
-- com 6 caracteres estáveis do gcatholic_uid.
--
-- 10.217 santos, 9.869 slugs únicos por nome → ~348 precisam de sufixo.
--
-- Idempotente: só atualiza onde slug is null.

begin;

with ranked as (
  select
    id,
    gcatholic_uid,
    public.santos_slugify(nome) as base,
    row_number() over (
      partition by public.santos_slugify(nome)
      order by gcatholic_person_id nulls last, gcatholic_uid
    ) as rn
  from public.santos
  where slug is null
    and public.santos_slugify(nome) is not null
)
update public.santos s
set slug = case
  when r.rn = 1 then r.base
  else r.base || '-' || lower(
    regexp_replace(substring(r.gcatholic_uid from '([a-zA-Z0-9]+)$'), '[^a-zA-Z0-9]', '', 'g')
  )
end
from ranked r
where s.id = r.id;

-- Fallback: qualquer santo que ainda ficou sem slug (nome vazio, casos extremos)
-- recebe slug baseado em gcatholic_uid sanitizado.
update public.santos
set slug = 'santo-' || lower(regexp_replace(gcatholic_uid, '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null;

commit;
