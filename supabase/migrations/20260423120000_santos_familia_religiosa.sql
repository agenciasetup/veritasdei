-- Família religiosa / espiritual do santo — usada na UI pra exibir
-- acentos visuais coerentes com a tradição à qual o santo pertence.
--
-- Valores:
--   franciscano   — O.F.M., O.F.M. Cap., O.F.M. Conv., 1ª/2ª ordem franciscanas
--   dominicano    — O.P. (Ordem dos Pregadores)
--   carmelita     — O.C.D., O. Carm.
--   jesuita       — S.J. (Companhia de Jesus)
--   beneditino    — O.S.B.
--   agostiniano   — O.S.A., ramos agostinianos
--   mariano       — títulos marianos (N.Sra Aparecida, Fátima, etc.)
--   cristologico  — títulos cristológicos (Sagrado Coração, Cristo Rei)
--   arcanjo       — arcanjos (Miguel, Gabriel, Rafael)
--   apostolo      — apóstolos (Pedro, Paulo, etc.)
--   secular       — clero secular ou leigos consagrados (João Paulo II,
--                    Padre Pio está em franciscano por OFMCap, mas PP pode
--                    estar em secular — caso a caso)
--   leigo         — leigos não vinculados a uma ordem (Joana d'Arc, Luzia)

begin;

alter table public.santos
  add column if not exists familia_religiosa text
    check (familia_religiosa is null or familia_religiosa in (
      'franciscano','dominicano','carmelita','jesuita','beneditino',
      'agostiniano','mariano','cristologico','arcanjo','apostolo',
      'secular','leigo'
    ));

create index if not exists santos_familia_religiosa_idx
  on public.santos (familia_religiosa)
  where familia_religiosa is not null;

comment on column public.santos.familia_religiosa is
  'Tradição espiritual do santo — usada na UI para acentos visuais coerentes.';

-- Populate top 30 por slug
update public.santos set familia_religiosa = 'mariano'      where slug = 'nossa-senhora-aparecida';
update public.santos set familia_religiosa = 'mariano'      where slug = 'nossa-senhora-de-fatima';
update public.santos set familia_religiosa = 'cristologico' where slug = 'sagrado-coracao-de-jesus';
update public.santos set familia_religiosa = 'leigo'        where slug = 'sao-jose';
update public.santos set familia_religiosa = 'franciscano'  where slug = 'santo-antonio-de-padua';
update public.santos set familia_religiosa = 'franciscano'  where slug = 'sao-francisco-de-assis';
update public.santos set familia_religiosa = 'carmelita'    where slug = 'santa-teresinha';
update public.santos set familia_religiosa = 'apostolo'     where slug = 'sao-judas-tadeu';
update public.santos set familia_religiosa = 'leigo'        where slug = 'sao-jorge';
update public.santos set familia_religiosa = 'agostiniano'  where slug = 'santa-rita-de-cassia';
update public.santos set familia_religiosa = 'arcanjo'      where slug = 'sao-miguel-arcanjo';
update public.santos set familia_religiosa = 'arcanjo'      where slug = 'sao-gabriel-arcanjo';
update public.santos set familia_religiosa = 'arcanjo'      where slug = 'sao-rafael-arcanjo';
update public.santos set familia_religiosa = 'franciscano'  where slug = 'padre-pio';
update public.santos set familia_religiosa = 'secular'      where slug = 'sao-joao-paulo-ii';
update public.santos set familia_religiosa = 'secular'      where slug = 'madre-teresa-de-calcuta'; -- Missionárias da Caridade (fundadora)
update public.santos set familia_religiosa = 'carmelita'    where slug = 'santa-teresa-davila';
update public.santos set familia_religiosa = 'apostolo'     where slug = 'sao-pedro-apostolo';
update public.santos set familia_religiosa = 'apostolo'     where slug = 'sao-paulo-apostolo';
update public.santos set familia_religiosa = 'agostiniano'  where slug = 'santo-agostinho';
update public.santos set familia_religiosa = 'dominicano'   where slug = 'sao-tomas-de-aquino';
update public.santos set familia_religiosa = 'franciscano'  where slug = 'santa-clara-de-assis';
update public.santos set familia_religiosa = 'leigo'        where slug = 'santa-joana-darc';
update public.santos set familia_religiosa = 'beneditino'   where slug = 'sao-bento';
update public.santos set familia_religiosa = 'franciscano'  where slug = 'sao-maximiliano-kolbe';
update public.santos set familia_religiosa = 'secular'      where slug = 'santa-faustina'; -- Congregação das Irmãs de N.Sra da Misericórdia
update public.santos set familia_religiosa = 'secular'      where slug = 'santa-dulce-dos-pobres';
update public.santos set familia_religiosa = 'franciscano'  where slug = 'sao-frei-galvao';
update public.santos set familia_religiosa = 'secular'      where slug = 'santa-paulina';
update public.santos set familia_religiosa = 'leigo'        where slug = 'santa-luzia';

commit;
