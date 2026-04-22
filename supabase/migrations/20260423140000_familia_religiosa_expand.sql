-- Expande categorias de família religiosa para classificar santos
-- que não se encaixam nas tradições existentes (leigo/secular são
-- genéricos demais pra santos-chave como São José, Santa Luzia, etc).
--
-- Novas categorias:
--   patriarca    — São José, patriarca da Sagrada Família
--   doutor       — Doutores da Igreja (Agostinho, Aquino, Teresa, Teresinha)
--   virgem_martir — virgens mártires (Luzia, Agnes, Cecília)
--   martir       — mártires sem outra categoria primária (Jorge)
--
-- Reclassificação dos top 30 afetados pra usar categoria mais específica
-- quando aplicável.

begin;

-- Drop old constraint, add expanded one
alter table public.santos drop constraint if exists santos_familia_religiosa_check;
alter table public.santos
  add constraint santos_familia_religiosa_check
  check (familia_religiosa is null or familia_religiosa in (
    'franciscano','dominicano','carmelita','jesuita','beneditino',
    'agostiniano','mariano','cristologico','arcanjo','apostolo',
    'doutor','patriarca','virgem_martir','martir',
    'secular','leigo'
  ));

-- Reclassificações no top 30 pra categorias mais específicas
update public.santos set familia_religiosa = 'patriarca'    where slug = 'sao-jose';
update public.santos set familia_religiosa = 'martir'       where slug = 'sao-jorge';
update public.santos set familia_religiosa = 'virgem_martir' where slug = 'santa-luzia';
update public.santos set familia_religiosa = 'virgem_martir' where slug = 'santa-joana-darc';

commit;
