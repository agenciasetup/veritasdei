-- ============================================================================
-- Códex Veritas — Seed inicial (Sprint 1)
-- ============================================================================
-- Um personagem ("Jesus Cristo") e duas cartas que demonstram o motor de
-- regras: uma carta SUPREMA com regra composta (3 subtópicos via operador
-- "todas") e uma carta COMUM com regra simples (1 subtópico).
--
-- As ilustrações ficam NULL — o admin sobe a arte depois pelo painel.
-- ============================================================================

begin;

insert into public.personagens (slug, nome, subtitulo, descricao, ordem)
values (
  'jesus-cristo',
  'Jesus Cristo',
  'O Verbo Eterno Encarnado',
  'O centro da fé católica. Cada dogma estudado revela uma face do mistério de Cristo — e desbloqueia uma variação de carta.',
  0
)
on conflict (slug) do update set
  nome = excluded.nome,
  subtitulo = excluded.subtitulo,
  descricao = excluded.descricao,
  ordem = excluded.ordem;

-- Carta SUPREMA — regra composta: conclua os 3 dogmas centrais sobre Cristo.
insert into public.cartas (
  personagem_id, slug, numero, nome, subtitulo, categoria, raridade, estrelas,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, concilio, virtude, simbolo, lore, moldura, cor_accent,
  dica_desbloqueio, regras, status, ordem
)
select
  p.id,
  'cristo-pantocrator',
  1,
  'Cristo Pantocrator',
  'O Verbo Eterno Encarnado',
  'Dogma Central',
  'suprema',
  5,
  'Eu sou o Caminho, a Verdade e a Vida.',
  'João 14,6',
  'O Verbo se fez carne e habitou entre nós. (Jo 1,14)',
  'Fortalece argumentos contra heresias cristológicas em debates e estudos.',
  '["Selo: Defensor da Fé","Acesso ao Modo Debate Avançado","Carta de Coleção Suprema"]'::jsonb,
  'Niceia (325 d.C.)',
  'Verdade Absoluta',
  '☩',
  'Verbum caro factum est et habitavit in nobis. A imagem do Pantocrator — "governante de tudo" — é a mais antiga representação de Cristo como Deus e Senhor.',
  'ornamentada',
  '#C9A84C',
  'Aprofunde-se nos dogmas centrais sobre a pessoa de Cristo.',
  jsonb_build_object(
    'operador', 'todas',
    'condicoes', jsonb_build_array(
      jsonb_build_object('tipo','subtopico_concluido','ref','e4aadd61-3fd8-456e-85ca-97a34ae80e48'),
      jsonb_build_object('tipo','subtopico_concluido','ref','04f1b765-1e55-4514-a8f0-2566e39d2f21'),
      jsonb_build_object('tipo','subtopico_concluido','ref','80307fd5-d55f-4ef5-8dba-01c93f05df15')
    )
  ),
  'publicado',
  0
from public.personagens p
where p.slug = 'jesus-cristo'
on conflict (slug) do update set
  nome = excluded.nome,
  subtitulo = excluded.subtitulo,
  categoria = excluded.categoria,
  raridade = excluded.raridade,
  estrelas = excluded.estrelas,
  frase_central = excluded.frase_central,
  frase_referencia = excluded.frase_referencia,
  autoridade_doutrinaria = excluded.autoridade_doutrinaria,
  efeito_simbolico = excluded.efeito_simbolico,
  recompensa = excluded.recompensa,
  concilio = excluded.concilio,
  virtude = excluded.virtude,
  simbolo = excluded.simbolo,
  lore = excluded.lore,
  moldura = excluded.moldura,
  cor_accent = excluded.cor_accent,
  dica_desbloqueio = excluded.dica_desbloqueio,
  regras = excluded.regras,
  status = excluded.status,
  ordem = excluded.ordem;

-- Carta COMUM — regra simples: conclua o estudo da Ressurreição.
insert into public.cartas (
  personagem_id, slug, numero, nome, subtitulo, categoria, raridade, estrelas,
  frase_central, frase_referencia, autoridade_doutrinaria, efeito_simbolico,
  recompensa, simbolo, moldura, cor_accent, dica_desbloqueio, regras, status, ordem
)
select
  p.id,
  'cristo-ressuscitado',
  2,
  'Cristo Ressuscitado',
  'A Vitória sobre a Morte',
  'Dogma Central',
  'comum',
  2,
  'Não está aqui: ressuscitou.',
  'Lucas 24,6',
  'Ao terceiro dia ressuscitou dos mortos, segundo as Escrituras.',
  'Reforça a esperança na vida eterna.',
  '["Carta de Coleção"]'::jsonb,
  '✝',
  'classica',
  '#B8AFA7',
  'Estude o dogma da Ressurreição de Cristo.',
  jsonb_build_object(
    'operador', 'todas',
    'condicoes', jsonb_build_array(
      jsonb_build_object('tipo','subtopico_concluido','ref','1e877920-b3b4-4db6-a1c8-133478eeafc3')
    )
  ),
  'publicado',
  1
from public.personagens p
where p.slug = 'jesus-cristo'
on conflict (slug) do update set
  nome = excluded.nome,
  raridade = excluded.raridade,
  estrelas = excluded.estrelas,
  regras = excluded.regras,
  status = excluded.status,
  ordem = excluded.ordem;

-- Recalcula o total desnormalizado do personagem.
select public.fn_recalc_personagem_total(p.id)
from public.personagens p where p.slug = 'jesus-cristo';

commit;
