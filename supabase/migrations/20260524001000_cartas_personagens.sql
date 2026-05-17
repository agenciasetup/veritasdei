-- ============================================================================
-- Códex Veritas — Seed de personagens (entidades-mãe)
-- ============================================================================
-- Cada personagem agrupa variações de cartas. Ortografia e ordem fixadas aqui.
-- jesus-cristo e a-igreja já existem (cartas_seed.sql / cartas_seed_especiais).
-- ============================================================================

begin;

insert into public.personagens (slug, nome, subtitulo, descricao, ordem)
values
  ('maria-mae-de-deus', 'Maria, Mãe de Deus', 'Theotokos / Aeiparthenos',
   'A Bem-aventurada Virgem Maria, Mãe do Verbo Encarnado e Mãe da Igreja. Coroada de glória em corpo e alma.', 2),

  ('jose-de-nazare', 'José de Nazaré', 'Patrono Universal da Igreja',
   'O Justo, esposo de Maria, pai legal de Jesus, terror dos demônios. Pio IX proclamou-o Patrono Universal em 1870 (Quemadmodum Deus).', 3),

  ('os-doze', 'Os Doze Apóstolos', 'Coluna da Igreja',
   'Os Apóstolos escolhidos por Cristo: Pedro, André, Tiago Maior, João, Filipe, Bartolomeu, Mateus, Tomé, Tiago Menor, Judas Tadeu, Simão Zelote, e Matias (que substituiu Judas Iscariotes).', 4),

  ('paulo-de-tarso', 'Paulo de Tarso', 'Apóstolo das Gentes',
   'Vaso de eleição (At 9,15). Apóstolo dos gentios, autor de 13 epístolas canônicas, mártir em Roma sob Nero.', 5),

  ('padres-da-igreja', 'Padres da Igreja', 'Tradição Viva',
   'Os Padres apostólicos e patrísticos — Inácio, Policarpo, Justino, Ireneu, Atanásio, Basílio, os Gregórios, João Crisóstomo, Ambrósio, Jerônimo, Agostinho, Leão Magno.', 6),

  ('doutores-da-igreja', 'Doutores da Igreja', 'Lumen Doctrinae',
   'Os 37 Doutores proclamados pela Igreja — santos cuja doutrina é norma segura. Capitaneados por Tomás de Aquino (Doctor Angelicus) e Agostinho (Doctor Gratiae).', 7),

  ('calendario-liturgico', 'Calendário Litúrgico', 'O Ano da Graça',
   'O ciclo anual da Igreja: Advento, Natal, Quaresma, Páscoa, Tempo Comum. Cada domingo desdobra um mistério.', 8),

  ('martires', 'Mártires', 'Testemunhas pelo Sangue',
   'Os que selaram a fé com o próprio sangue. "Sanguis martyrum, semen christianorum." (Tertuliano)', 9),

  ('santos-do-rosario', 'Santos do Rosário', 'A Coroa de Rosas',
   'A devoção ao Rosário, entregue por Nossa Senhora a São Domingos. Padres dominicanos, Fátima, Lepanto, e a oração que move o céu.', 10)
on conflict (slug) do update set
  nome = excluded.nome,
  subtitulo = excluded.subtitulo,
  descricao = excluded.descricao,
  ordem = excluded.ordem;

commit;
