-- ============================================================================
-- Códex Veritas — Seed A (módulos / lendária Lumen Doctrinae / suprema Magister)
--                + B (dogmas marianos + suprema Regina Caeli)
-- ============================================================================
-- Estrutura real do conteúdo no banco (descoberta via /api/admin/seed):
--   7 content_groups canônicos:
--     dogmas, sacramentos, mandamentos, preceitos, oracoes,
--     virtudes-pecados, obras-misericordia
--   12 trilhas compostas em TS (iniciante, sacramental, doutrina, caridade,
--   defesa, oracao, mariologia, josefologia, escatologia, missa,
--   perscrutacao, latim) — agregam subtópicos de vários grupos no front, mas
--   não existem como `content_groups` no Supabase.
--
-- Como `grupo_concluido` checa content_groups por slug, esta migration cria
-- 7 cartas épicas (uma por grupo canônico) + a lendária Lumen Doctrinae
-- (todos os 7) + a suprema Magister Sacrae Paginae (todos os quizzes).
-- ============================================================================

begin;

-- ============================================================================
-- A.3 — 7 cartas épicas, uma por grupo canônico
-- ============================================================================
insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, simbolo, moldura, cor_accent, dica_desbloqueio, regras, status, ordem
) values
  ((select id from public.personagens where slug='a-igreja'),
   'guardiao-dos-dogmas', 'Guardião dos Dogmas', '44 verdades reveladas',
   'Pilar Concluído', 'epica', 4,
   'Guarda o depósito da fé.', '1 Timóteo 6,20',
   'CIC 88–90 — o dogma é proposto como divinamente revelado para nossa fé.',
   'Marca quem percorreu os 44 dogmas da fé católica.',
   '["Selo: Dogmas","Carta de Coleção Épica"]'::jsonb,
   '✠', 'ornamentada', '#8B1E3F',
   'Conclua o pilar "Dogmas da Igreja Católica".',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','grupo_concluido','ref','dogmas'))),
   'publicado', 10),

  ((select id from public.personagens where slug='jesus-cristo'),
   'selo-dos-sete-sacramentos', 'Selo dos Sete Sacramentos', 'Os sinais sensíveis da graça',
   'Pilar Concluído', 'epica', 4,
   'Quem comer deste pão viverá eternamente.', 'João 6,51',
   'Concílio de Trento, Sessão VII (1547) — sete sacramentos instituídos por Cristo.',
   'Reforça a vida sacramental do portador.',
   '["Selo: Sacramentos","Carta de Coleção Épica"]'::jsonb,
   '☩', 'ornamentada', '#8B1E3F',
   'Conclua o pilar "Os Sete Sacramentos".',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','grupo_concluido','ref','sacramentos'))),
   'publicado', 11),

  ((select id from public.personagens where slug='padres-da-igreja'),
   'tabuas-da-lei', 'Tábuas da Lei', 'Os Dez Mandamentos',
   'Pilar Concluído', 'epica', 4,
   'Não terás outros deuses diante de mim.', 'Êxodo 20,3',
   'Decálogo entregue a Moisés no Sinai (Ex 20; Dt 5); CIC 2052–2557.',
   'Sela a memória do Decálogo.',
   '["Selo: Mandamentos","Carta de Coleção Épica"]'::jsonb,
   '⛰', 'ornamentada', '#8B1E3F',
   'Conclua o pilar "Os Dez Mandamentos".',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','grupo_concluido','ref','mandamentos'))),
   'publicado', 12),

  ((select id from public.personagens where slug='a-igreja'),
   'os-cinco-preceitos', 'Os Cinco Preceitos', 'Mínimo indispensável',
   'Pilar Concluído', 'epica', 4,
   'Quem ouve a vós a mim ouve.', 'Lucas 10,16',
   'CIC 2041–2043 — os preceitos da Igreja garantem o mínimo indispensável.',
   'Sela a docilidade à autoridade da Igreja.',
   '["Selo: Preceitos","Carta de Coleção Épica"]'::jsonb,
   '✠', 'ornamentada', '#8B1E3F',
   'Conclua o pilar "Os Cinco Preceitos da Igreja".',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','grupo_concluido','ref','preceitos'))),
   'publicado', 13),

  ((select id from public.personagens where slug='doutores-da-igreja'),
   'voz-da-oracao', 'Voz da Oração', 'As orações fundamentais',
   'Pilar Concluído', 'epica', 4,
   'Orai sem cessar.', '1 Tessalonicenses 5,17',
   'CIC 2697–2724 — formas da oração; Pai Nosso (CIC 2761) como síntese.',
   'Marca o portador como orante consistente.',
   '["Selo: Orações","Carta de Coleção Épica"]'::jsonb,
   '☩', 'ornamentada', '#8B1E3F',
   'Conclua o pilar "Orações da Igreja".',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','grupo_concluido','ref','oracoes'))),
   'publicado', 14),

  ((select id from public.personagens where slug='doutores-da-igreja'),
   'virtus-et-vitium', 'Virtus et Vitium', 'Virtudes Teologais e Cardeais',
   'Pilar Concluído', 'epica', 4,
   'Tudo o que é verdadeiro, tudo o que é digno, tudo o que é justo… nisso pensai.',
   'Filipenses 4,8',
   'S. Tomás, Suma Teológica II-II (questões sobre virtudes e vícios).',
   'Discerne virtudes e pecados com clareza.',
   '["Selo: Virtudes e Pecados","Carta de Coleção Épica"]'::jsonb,
   '⚖', 'ornamentada', '#8B1E3F',
   'Conclua o pilar "Virtudes e Pecados".',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','grupo_concluido','ref','virtudes-pecados'))),
   'publicado', 15),

  ((select id from public.personagens where slug='jesus-cristo'),
   'maos-de-cristo', 'Mãos de Cristo', 'Obras de Misericórdia',
   'Pilar Concluído', 'epica', 4,
   'Tudo o que fizestes a um destes meus irmãos mais pequeninos, a mim o fizestes.',
   'Mateus 25,40',
   'CIC 2447 — sete obras corporais e sete espirituais.',
   'Multiplica a graça da caridade.',
   '["Selo: Misericórdia","Carta de Coleção Épica"]'::jsonb,
   '✝', 'ornamentada', '#8B1E3F',
   'Conclua o pilar "Obras de Misericórdia".',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','grupo_concluido','ref','obras-misericordia'))),
   'publicado', 16)
on conflict (slug) do update set
  nome = excluded.nome, subtitulo = excluded.subtitulo, categoria = excluded.categoria,
  raridade = excluded.raridade, estrelas = excluded.estrelas,
  frase_central = excluded.frase_central, frase_referencia = excluded.frase_referencia,
  autoridade_doutrinaria = excluded.autoridade_doutrinaria,
  efeito_simbolico = excluded.efeito_simbolico, recompensa = excluded.recompensa,
  simbolo = excluded.simbolo, moldura = excluded.moldura, cor_accent = excluded.cor_accent,
  dica_desbloqueio = excluded.dica_desbloqueio, regras = excluded.regras,
  status = excluded.status, ordem = excluded.ordem;

-- ============================================================================
-- A.4 — Lumen Doctrinae (Lendária, 144) — todos os 7 pilares
-- ============================================================================
insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas, tiragem,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, concilio, simbolo, lore, moldura, cor_accent, dica_desbloqueio,
  regras, status, ordem
) values (
  (select id from public.personagens where slug='doutores-da-igreja'),
  'lumen-doctrinae', 'Lumen Doctrinae', 'Luz da Doutrina',
  'Catálogo Completo', 'lendaria', 5, 144,
  'A verdade não pode contradizer a verdade.',
  'Leão XIII, Aeterni Patris (1879)',
  'A fé e a razão são dois meios que conduzem ao conhecimento da verdade (S. João Paulo II, Fides et Ratio).',
  'Acende, ao redor da carteirinha, um halo que assinala o portador como estudioso integral da fé.',
  '["Carta Lendária","Coroa Doutoral","Selo: Catálogo Completo"]'::jsonb,
  'Vaticano I (Dei Filius, 1870)',
  '✦',
  'Concedida a quem percorreu os sete pilares da doutrina: Dogmas, Sacramentos, Mandamentos, Preceitos, Orações, Virtudes-Vícios e Obras de Misericórdia. Tomás de Aquino abre a procissão; atrás, todos os Doutores da Igreja. A luz não é deles — é da Verdade que serviram.',
  'vitral', '#E8C766',
  'Conclua os SETE pilares de estudo do Veritas Educa.',
  jsonb_build_object('operador','todas','condicoes', jsonb_build_array(
    jsonb_build_object('tipo','grupo_concluido','ref','dogmas'),
    jsonb_build_object('tipo','grupo_concluido','ref','sacramentos'),
    jsonb_build_object('tipo','grupo_concluido','ref','mandamentos'),
    jsonb_build_object('tipo','grupo_concluido','ref','preceitos'),
    jsonb_build_object('tipo','grupo_concluido','ref','oracoes'),
    jsonb_build_object('tipo','grupo_concluido','ref','virtudes-pecados'),
    jsonb_build_object('tipo','grupo_concluido','ref','obras-misericordia')
  )),
  'publicado', 30
)
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade, tiragem = excluded.tiragem,
  frase_central = excluded.frase_central, autoridade_doutrinaria = excluded.autoridade_doutrinaria,
  regras = excluded.regras, status = excluded.status, ordem = excluded.ordem;

-- ============================================================================
-- A.5 — Magister Sacrae Paginae (Suprema, 33)
-- ============================================================================
-- Contador 'quizzes_gabaritados_total' >= 7 (um por pilar, gerado por trigger).
-- Aumenta o `valor` conforme o catálogo crescer.
-- ============================================================================
insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas, tiragem,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, concilio, virtude, simbolo, lore, moldura, cor_accent,
  dica_desbloqueio, regras, status, ordem
) values (
  (select id from public.personagens where slug='jesus-cristo'),
  'magister-sacrae-paginae', 'Magister Sacrae Paginae',
  'Mestre da Sagrada Página', 'Catálogo Completo de Provas',
  'suprema', 5, 33,
  'Um só é o vosso Mestre, o Cristo.', 'Mateus 23,10',
  'Título medieval do mestre que ensinava a Sagrada Escritura nas universidades.',
  'Desbloqueia o "Modo Debate Mestre" e marca o nome com a coroa de espinhos dourada.',
  '["Carta Suprema (33 cópias)","Coroa de Espinhos Dourada","Acesso: Modo Debate Mestre"]'::jsonb,
  'IV Latrão (1215) — definição do Mestre Sagrado',
  'Sabedoria',
  '✠',
  'Há quem chegue. Há quem chegue até o fim. E há quem, tendo chegado, ensine. Esta carta cunha-se trinta e três vezes; depois disso, o Mestre permanece, mas a coroa é guardada na sacristia da história.',
  'vitral', '#F4DE96',
  'Gabarite todas as provas dos sete pilares.',
  jsonb_build_object('operador','todas','condicoes', jsonb_build_array(
    jsonb_build_object('tipo','contador','ref','quizzes_gabaritados_total','valor', 7)
  )),
  'publicado', 31
)
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade, tiragem = excluded.tiragem,
  frase_central = excluded.frase_central, regras = excluded.regras,
  status = excluded.status, ordem = excluded.ordem;

-- ----------------------------------------------------------------------------
-- Trigger auxiliar: incrementa 'quizzes_gabaritados_total' a cada quiz 100%
-- (uma vez por quiz, pra não inflar com tentativas repetidas).
-- ----------------------------------------------------------------------------
create or replace function public.trg_cartas_after_quiz_perfeito()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_chave text;
begin
  if new.score is null or new.score < 100 then return new; end if;

  v_chave := 'quiz_gabaritado_' || new.quiz_id::text;

  if not exists (
    select 1 from public.user_carta_progresso
     where user_id = new.user_id and chave = v_chave
  ) then
    perform public.fn_registrar_evento_carta(new.user_id, v_chave, 1, 'definir');
    perform public.fn_registrar_evento_carta(new.user_id, 'quizzes_gabaritados_total', 1);
  end if;

  return new;
end; $$;

drop trigger if exists tg_cartas_after_quiz_perfeito on public.user_quiz_attempts;
create trigger tg_cartas_after_quiz_perfeito
  after insert on public.user_quiz_attempts
  for each row execute function public.trg_cartas_after_quiz_perfeito();

revoke all on function public.trg_cartas_after_quiz_perfeito()
  from public, anon, authenticated;

-- ============================================================================
-- B — Dogmas Marianos
-- ============================================================================
-- Slugs dos subtópicos em content_subtopics (content_type='dogmas'):
--   theotokos | virgindade-perpetua | imaculada-conceicao | assuncao
-- Se os slugs no banco diferirem, ajuste aqui — o tipo `dogma_estudado` usa o
-- slug de content_subtopics.slug, content_type='dogmas'.
-- ============================================================================

insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas, tiragem,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, concilio, virtude, simbolo, lore, moldura, cor_accent,
  dica_desbloqueio, regras, status, ordem
) values
  ((select id from public.personagens where slug='maria-mae-de-deus'),
   'theotokos', 'Theotokos', 'Mãe de Deus',
   'Dogma Mariano', 'lendaria', 5, 144,
   'Bendito o fruto do teu ventre!', 'Lucas 1,42',
   'Concílio de Éfeso (431) — definiu Maria como Theotokos contra Nestório.',
   'Reforça a defesa da divindade de Cristo via mariologia.',
   '["Carta Lendária","Selo: Theotokos"]'::jsonb,
   'Éfeso (431 d.C.)', 'Maternidade Divina',
   '♔',
   'Negar que Maria é Mãe de Deus é negar que Cristo é Deus. Os Padres entenderam: a defesa da divindade do Filho passa pela Mãe.',
   'vitral', '#E8C766',
   'Estude o dogma da Maternidade Divina de Maria.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','dogma_estudado','ref','theotokos'))),
   'publicado', 40),

  ((select id from public.personagens where slug='maria-mae-de-deus'),
   'aeiparthenos', 'Aeiparthenos', 'Sempre Virgem',
   'Dogma Mariano', 'lendaria', 5, 144,
   'Toda formosa és, ó minha amada, e mancha não há em ti.', 'Cântico 4,7',
   'II Constantinopla (553), Latrão (649), CIC 499–501.',
   'Defende a integridade virginal de Maria — antes, durante e depois do parto.',
   '["Carta Lendária","Selo: Aeiparthenos"]'::jsonb,
   'Latrão (649) — Cânones marianos',
   'Pureza',
   '♕',
   'Virgo ante partum, in partu, post partum. Os hereges sempre tropeçaram aqui; os Padres nunca.',
   'vitral', '#E8C766',
   'Estude o dogma da Virgindade Perpétua de Maria.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','dogma_estudado','ref','virgindade-perpetua'))),
   'publicado', 41),

  ((select id from public.personagens where slug='maria-mae-de-deus'),
   'tota-pulchra', 'Tota Pulchra', 'Imaculada Conceição',
   'Dogma Mariano', 'lendaria', 5, 144,
   'Cheia de graça.', 'Lucas 1,28',
   'Bula Ineffabilis Deus (Pio IX, 8 de dezembro de 1854).',
   'Aumenta a graça simbólica nas anotações do usuário (efeito litúrgico do "preservada do pecado original").',
   '["Carta Lendária","Selo: Tota Pulchra"]'::jsonb,
   'Bula Ineffabilis Deus (1854)',
   'Inocência',
   '✿',
   'Tota pulchra es, Maria, et macula originalis non est in te. A antífona da Imaculada é mais antiga que o dogma — o povo cantou antes que o Papa definisse.',
   'vitral', '#E8C766',
   'Estude o dogma da Imaculada Conceição.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','dogma_estudado','ref','imaculada-conceicao'))),
   'publicado', 42),

  ((select id from public.personagens where slug='maria-mae-de-deus'),
   'assumpta-est', 'Assumpta Est', 'Assunção de Maria',
   'Dogma Mariano', 'lendaria', 5, 144,
   'Levantou-se Maria e foi pressurosa às montanhas.', 'Lucas 1,39',
   'Constituição Apostólica Munificentissimus Deus (Pio XII, 1° de novembro de 1950).',
   'Símbolo da elevação corporal e espiritual.',
   '["Carta Lendária","Selo: Assumpta"]'::jsonb,
   'Munificentissimus Deus (1950)',
   'Esperança',
   '☁',
   'A Imaculada não podia ser deixada à corrupção do sepulcro. Em corpo e alma, foi assunta — primícias da humanidade redimida.',
   'vitral', '#E8C766',
   'Estude o dogma da Assunção de Maria.',
   jsonb_build_object('operador','todas','condicoes',
     jsonb_build_array(jsonb_build_object('tipo','dogma_estudado','ref','assuncao'))),
   'publicado', 43)
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade, tiragem = excluded.tiragem,
  frase_central = excluded.frase_central, regras = excluded.regras,
  status = excluded.status, ordem = excluded.ordem;

-- ----------------------------------------------------------------------------
-- B.5 — Regina Caeli (Suprema, 33) — os quatro dogmas marianos juntos
-- ----------------------------------------------------------------------------
insert into public.cartas (
  personagem_id, slug, nome, subtitulo, categoria, raridade, estrelas, tiragem,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, concilio, virtude, simbolo, lore, moldura, cor_accent,
  dica_desbloqueio, regras, status, ordem
) values (
  (select id from public.personagens where slug='maria-mae-de-deus'),
  'regina-caeli', 'Regina Caeli', 'Rainha do Céu',
  'Coleção Mariana Completa', 'suprema', 5, 33,
  'Apareceu no céu um grande sinal: uma mulher vestida de sol, com a lua sob os pés e na cabeça uma coroa de doze estrelas.',
  'Apocalipse 12,1',
  'Pio XII, encíclica Ad Caeli Reginam (1954) — fundamenta a realeza de Maria sobre os anjos e homens.',
  'Coroa o portador como devoto integral dos quatro dogmas marianos. Visualmente: doze estrelas em halo.',
  '["Carta Suprema (33 cópias)","Coroa de Doze Estrelas","Selo: Regina Caeli"]'::jsonb,
  'Vaticano II, Lumen Gentium (cap. VIII)',
  'Maternidade Espiritual',
  '☀',
  'Quatro dogmas — Theotokos, Aeiparthenos, Imaculada, Assumpta — convergem numa só coroa. Trinta e três cópias atravessam a história deste catálogo: depois disso, a Rainha permanece, mas a coroa é só dela.',
  'vitral', '#F4DE96',
  'Estude e desbloqueie os quatro dogmas marianos.',
  jsonb_build_object('operador','todas','condicoes', jsonb_build_array(
    jsonb_build_object('tipo','dogma_estudado','ref','theotokos'),
    jsonb_build_object('tipo','dogma_estudado','ref','virgindade-perpetua'),
    jsonb_build_object('tipo','dogma_estudado','ref','imaculada-conceicao'),
    jsonb_build_object('tipo','dogma_estudado','ref','assuncao')
  )),
  'publicado', 44
)
on conflict (slug) do update set
  nome = excluded.nome, raridade = excluded.raridade, tiragem = excluded.tiragem,
  regras = excluded.regras, status = excluded.status, ordem = excluded.ordem;

-- ----------------------------------------------------------------------------
-- Recalcula total_cartas dos personagens tocados.
-- ----------------------------------------------------------------------------
select public.fn_recalc_personagem_total(p.id)
  from public.personagens p
 where p.slug in (
   'a-igreja','jesus-cristo','doutores-da-igreja','padres-da-igreja',
   'maria-mae-de-deus','jose-de-nazare'
 );

commit;
