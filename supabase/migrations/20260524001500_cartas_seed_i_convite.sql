-- ============================================================================
-- Códex Veritas — Seed I (Convites / Apóstolos)
-- ============================================================================
-- Regra base: contador 'convites_ativos' >= N. A escala cresce de 3 (Pedro) a
-- 25 (Matias). Acima de 50 + trilha perscrutacao concluída → Paulo (suprema).
-- Cada carta retrata o martírio/missão de cada apóstolo, com a fonte tradicional.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- I.1 — O Primeiro Convite (Épica, sem limite)
-- ----------------------------------------------------------------------------
insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, simbolo, moldura, cor_accent, dica_desbloqueio, regras, status, ordem
) values
  ((select id from public.personagens where slug='jesus-cristo'),
   'primeiro-convite', 'O Primeiro Convite', 'Ide e fazei discípulos',
   'Evangelização', 'epica', 4,
   'Ide, portanto, e fazei discípulos de todas as nações.', 'Mateus 28,19',
   'Mandato missionário do Senhor — Ad Gentes (Vaticano II).',
   'Marca o início do trabalho apostólico do portador.',
   '["Carta Épica","Selo: Apostolado"]'::jsonb,
   '☩', 'ornamentada', '#8B1E3F',
   'Convide um amigo que ative a conta.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','contador','ref','convites_ativos','valor',1))),
   'publicado', 300)
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade,
  regras = excluded.regras, status = excluded.status, ordem = excluded.ordem;

-- ----------------------------------------------------------------------------
-- I.2 — As 12 Lendárias dos Apóstolos (144 cópias cada)
-- ----------------------------------------------------------------------------
-- A escala é cumulativa — quem chega a 25 ganha todas as 12 anteriores (cada
-- carta tem sua condição independente). Cor accent: ouro (#E8C766).
-- ----------------------------------------------------------------------------
do $$
declare
  v_perso uuid := (select id from public.personagens where slug='os-doze');
  v_data record;
begin
  for v_data in
    select * from (values
      -- (slug, nome, subtitulo, convites, frase, ref, missao, ordem)
      ('apostolo-pedro', 'Pedro, a Pedra', 'Roma, crucificado de cabeça pra baixo', 3,
       'Tu és Pedro, e sobre esta pedra edificarei a minha Igreja.', 'Mateus 16,18',
       'Bispo de Antioquia e depois de Roma; crucificado sob Nero (cerca de 64 d.C.), de cabeça pra baixo por não se julgar digno de morrer como o Senhor.',
       310),
      ('apostolo-andre', 'André, a Cruz em X', 'Patras, Grécia', 5,
       'Vinde após mim e vos farei pescadores de homens.', 'Mateus 4,19',
       'Irmão de Pedro; pregou na Grécia, foi crucificado em Patras numa cruz em forma de X (decussata).',
       311),
      ('apostolo-tiago-maior', 'Tiago Maior, Compostela', 'Decapitado em Jerusalém', 7,
       'Filhos do Trovão.', 'Marcos 3,17',
       'Primeiro Apóstolo mártir — decapitado por Herodes Agripa em Jerusalém (At 12,2). Sepultado, segundo a tradição, em Compostela.',
       312),
      ('apostolo-joao', 'João, o Discípulo Amado', 'Éfeso', 9,
       'Eis aí o teu filho. Eis aí a tua mãe.', 'João 19,26–27',
       'Único apóstolo a não morrer mártir. Exilado em Patmos (Apocalipse), morreu em Éfeso já idoso. Tradição: sobreviveu ao óleo fervente em Roma (Tertuliano).',
       313),
      ('apostolo-filipe', 'Filipe, Frígia', 'Hierápolis', 11,
       'Senhor, mostra-nos o Pai e isso nos basta.', 'João 14,8',
       'Pregou na Frígia (atual Turquia central); crucificado de cabeça pra baixo em Hierápolis.',
       314),
      ('apostolo-bartolomeu', 'Bartolomeu, o Esfolado', 'Armênia', 13,
       'Eis aí um verdadeiro israelita, em quem não há dolo.', 'João 1,47',
       'Identificado com Natanael; pregou na Armênia, esfolado vivo e depois decapitado.',
       315),
      ('apostolo-mateus', 'Mateus, Etiópia', 'O publicano evangelista', 15,
       'Segue-me.', 'Mateus 9,9',
       'Coletor de impostos chamado por Cristo; autor do primeiro Evangelho. Pregou na Etiópia, onde morreu mártir.',
       316),
      ('apostolo-tome', 'Tomé, Apóstolo das Índias', 'Mylapore, Índia', 17,
       'Meu Senhor e meu Deus!', 'João 20,28',
       'Pregou na Índia, fundando os "Cristãos de São Tomé" em Kerala. Mártir em Mylapore (atual Chennai).',
       317),
      ('apostolo-tiago-menor', 'Tiago Menor, o Justo', 'Bispo de Jerusalém', 19,
       'A fé sem obras é morta.', 'Tiago 2,17',
       'Primeiro bispo de Jerusalém; presidiu o Concílio de Jerusalém (At 15). Atirado do pináculo do Templo (62 d.C.) — Eusébio cita Hegesipo.',
       318),
      ('apostolo-judas-tadeu', 'Judas Tadeu, Esperança', 'Pérsia', 21,
       'Tem piedade de nós, ó Senhor!', 'Liturgia',
       'Pregou em Edessa e na Pérsia com Simão; mártir junto dele. Padroeiro das causas difíceis.',
       319),
      ('apostolo-simao-zelote', 'Simão, o Zelote', 'Pérsia, serrado ao meio', 23,
       'O zelo pela tua casa me consumirá.', 'Salmo 69,9 / João 2,17',
       'Pregou na Pérsia com Judas Tadeu; segundo a tradição, serrado ao meio.',
       320),
      ('apostolo-matias-evangelizador', 'Matias, o Eleito', 'Etiópia / Cólquida', 25,
       'E a sorte caiu sobre Matias.', 'Atos 1,26',
       'Eleito por sorteio para substituir Judas Iscariotes. Tradições divergem sobre a missão — Etiópia, Cólquida (Geórgia) ou Capadócia. Mártir.',
       321)
    ) as t(slug, nome, subtitulo, convites, frase, ref, missao, ordem)
  loop
    insert into public.cartas (
      personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas, tiragem,
      frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
      recompensa, simbolo, moldura, cor_accent, lore,
      dica_desbloqueio, regras, status, ordem
    ) values (
      v_perso,
      v_data.slug,
      v_data.nome,
      v_data.subtitulo,
      'Apóstolo',
      'lendaria', 5, 144,
      v_data.frase,
      v_data.ref,
      'Tradição apostólica (Eusébio, Jerônimo, atos apócrifos antigos).',
      'Marca o portador como evangelizador — cada convite ativo é uma centelha de Pentecostes.',
      jsonb_build_array('Carta Lendária', 'Selo Apóstolo'),
      '☩',
      'vitral',
      '#E8C766',
      v_data.missao,
      'Convide ' || v_data.convites || ' amigos que ativem a conta.',
      jsonb_build_object('operador','todas','condicoes',
        jsonb_build_array(jsonb_build_object('tipo','contador','ref','convites_ativos','valor', v_data.convites))
      ),
      'publicado',
      v_data.ordem
    )
    on conflict (slug) do update set
      nome = excluded.nome, raridade = excluded.raridade, tiragem = excluded.tiragem,
      regras = excluded.regras, status = excluded.status, ordem = excluded.ordem;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- I.3 — Paulo, o Apóstolo das Gentes (Suprema, 33)
-- ----------------------------------------------------------------------------
insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas, tiragem,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, concilio, virtude, simbolo, lore, moldura, cor_accent,
  dica_desbloqueio, regras, status, ordem
) values (
  (select id from public.personagens where slug='paulo-de-tarso'),
  'paulo-apostolus-gentium', 'Paulo, Apóstolo das Gentes',
  'Vaso de Eleição', 'Convite Supremo', 'suprema', 5, 33,
  'Combati o bom combate, terminei a corrida, guardei a fé.', '2 Timóteo 4,7',
  'At 9 — chamado no caminho de Damasco. Vaso de eleição (At 9,15). Doctor Gentium.',
  'Decapitado em Roma sob Nero (cerca de 67 d.C.). 13 epístolas canônicas.',
  '["Carta Suprema (33 cópias)","Selo: Apostolus Gentium","Badge no perfil"]'::jsonb,
  'Concílio de Jerusalém (At 15) — primeiro concílio',
  'Zelo Missionário',
  '⚔',
  'Cinquenta convites ativos — o número da Páscoa a Pentecostes. Mais o pilar dos Dogmas concluído, porque Paulo é, antes de tudo, aquele que articula a doutrina (Romanos, Gálatas, Filipenses). Quando os dois se cruzam, o Doctor Gentium põe a coroa no portador.',
  'vitral', '#F4DE96',
  'Tenha 50 convites ativos E conclua o pilar "Dogmas da Igreja Católica".',
  jsonb_build_object('operador','todas','condicoes', jsonb_build_array(
    jsonb_build_object('tipo','contador','ref','convites_ativos','valor', 50),
    jsonb_build_object('tipo','grupo_concluido','ref','dogmas')
  )),
  'publicado', 330
)
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade, tiragem = excluded.tiragem,
  regras = excluded.regras, status = excluded.status, ordem = excluded.ordem;

select public.fn_recalc_personagem_total(p.id)
  from public.personagens p
 where p.slug in ('os-doze','paulo-de-tarso','jesus-cristo');

commit;
