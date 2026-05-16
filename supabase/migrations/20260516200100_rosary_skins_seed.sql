-- ============================================================================
-- Seed das skins iniciais.
--
-- 2 canônicas (free, sempre disponíveis):
--   devocional-classico   — paleta dourada sobre preto (default).
--   missal-tridentino     — dourado oxidado sobre borgonha.
--
-- 4 temáticas (mistérios próprios):
--   terco-sao-bento       — free por enquanto. Quando vender o terço
--                            físico, troca pra commerce.
--   dogmas-marianos       — rules: topico_concluido = mariologia.
--   padre-pio             — coming_soon (conteúdo wip).
--   divina-misericordia   — coming_soon (estrutura de coroa, fora do MVP).
--
-- ON CONFLICT (slug) DO UPDATE — idempotente, posso rodar de novo
-- depois pra atualizar conteúdo.
-- ============================================================================

insert into public.rosary_skins (
  slug, nome, subtitulo, descricao, epigraph, categoria, raridade, glyph,
  theme, mysteries, base_mystery_set,
  unlock_tipo, unlock_regras, unlock_label,
  ordem, visivel, status
) values
-- ─── 1. Devocional Clássico (canônica, default) ─────────────────────────
(
  'devocional-classico',
  'Devocional Clássico',
  'Ouro sobre noite — o terço da Casa',
  'A paleta de fundação do Veritas Dei. Dourado vivo sobre preto profundo. Acompanha o mistério canônico do dia (gozosos, dolorosos, gloriosos, luminosos).',
  null,
  'canonico',
  'comum',
  '✦',
  jsonb_build_object(
    'pageBg', '#0F0E0C',
    'pageBgAmbient',
      'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(107, 29, 42, 0.10) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(201, 168, 76, 0.05) 0%, transparent 50%)',
    'accent',         '#C9A84C',
    'accentLight',    '#D9C077',
    'accentDeep',     '#A88437',
    'textPrimary',    '#F2EDE4',
    'textSecondary',  '#C0B8B0',
    'textMuted',      '#938B80',
    'border',         'rgba(242, 237, 228, 0.12)',
    'borderStrong',   'rgba(201, 168, 76, 0.30)',
    'cardBg',         '#141210',
    'cardBorder',     'rgba(242, 237, 228, 0.12)',
    'buttonGradient', jsonb_build_array('#C9A84C', '#A88437'),
    'buttonText',     '#1C140C',
    'beadCurrentStops',   jsonb_build_array('#F4E8B8', '#D9C077', '#C9A84C'),
    'beadFutureStops',    jsonb_build_array('rgba(201,168,76,0.22)', 'rgba(201,168,76,0.08)'),
    'beadCompletedStops', jsonb_build_array('rgba(201,168,76,0.45)', 'rgba(201,168,76,0.18)'),
    'cordStroke',     'rgba(242, 237, 228, 0.12)',
    'crucifixVariant',   'classic',
    'introBeadVariant',  'classic',
    'beadShape',         'sphere'
  ),
  null,  -- mysteries: usa o set canônico do dia
  null,
  'free',
  '{"operador":"todas","condicoes":[]}'::jsonb,
  null,
  0, true, 'published'
),

-- ─── 2. Missal Tridentino (canônica, free, latim) ───────────────────────
(
  'missal-tridentino',
  'Missal Tridentino',
  'Ouro oxidado, borgonha vivo',
  'Inspirada em manuscritos iluminados e na Missa Tridentina. Ouro velho sobre vinho de cálice. Combina com a oração em latim, mas funciona em ambas as línguas.',
  '"Crux sacra sit mihi lux"',
  'canonico',
  'rara',
  '☩',
  jsonb_build_object(
    'pageBg', '#0A0608',
    'pageBgAmbient',
      'radial-gradient(ellipse 90% 55% at 50% -8%, rgba(92, 22, 32, 0.55) 0%, transparent 58%), radial-gradient(ellipse 70% 50% at 50% 110%, rgba(168, 136, 78, 0.06) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 15% 30%, rgba(168, 136, 78, 0.04) 0%, transparent 60%)',
    'accent',         '#A8884E',
    'accentLight',    '#D4B574',
    'accentDeep',     '#5C1620',
    'textPrimary',    '#EDE3D0',
    'textSecondary',  '#B5A687',
    'textMuted',      '#7C7163',
    'border',         'rgba(168, 136, 78, 0.16)',
    'borderStrong',   'rgba(212, 181, 116, 0.38)',
    'cardBg',         'rgba(24, 12, 14, 0.72)',
    'cardBorder',     'rgba(168, 136, 78, 0.22)',
    'buttonGradient', jsonb_build_array('#C9A45A', '#8B6F38'),
    'buttonText',     '#1A0D08',
    'beadCurrentStops',   jsonb_build_array('#F0DCA0', '#D4B574', '#A8884E'),
    'beadFutureStops',    jsonb_build_array('rgba(168,136,78,0.24)', 'rgba(168,136,78,0.08)'),
    'beadCompletedStops', jsonb_build_array('rgba(212,181,116,0.50)', 'rgba(168,136,78,0.18)'),
    'cordStroke',     'rgba(212, 181, 116, 0.20)',
    'crucifixVariant',   'budded',
    'introBeadVariant',  'rose',
    'beadShape',         'sphere'
  ),
  null,
  null,
  'free',
  '{"operador":"todas","condicoes":[]}'::jsonb,
  null,
  1, true, 'published'
),

-- ─── 3. Terço de São Bento (free no MVP; commerce quando vender) ────────
(
  'terco-sao-bento',
  'Terço de São Bento',
  'Vida do Patriarca dos Monges',
  'Medite a vida de São Bento de Núrsia (480–547), pai do monaquismo ocidental, intercessor poderoso contra o mal. Cruz de São Bento na ponta, conta inicial com a medalha beneditina.',
  '"Crux sancti patris Benedicti — Eius in obitu nostro praesentia muniamur."',
  'santo',
  'epica',
  '✠',
  jsonb_build_object(
    'pageBg', '#0B0908',
    'pageBgAmbient',
      'radial-gradient(ellipse 90% 55% at 50% -8%, rgba(56, 40, 16, 0.55) 0%, transparent 58%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(196, 158, 90, 0.06) 0%, transparent 55%)',
    'accent',         '#B89456',
    'accentLight',    '#E0BD7A',
    'accentDeep',     '#3D2A14',
    'textPrimary',    '#F2EAD3',
    'textSecondary',  '#C5B58F',
    'textMuted',      '#8A7C5E',
    'border',         'rgba(196, 158, 90, 0.16)',
    'borderStrong',   'rgba(224, 189, 122, 0.36)',
    'cardBg',         'rgba(22, 16, 10, 0.7)',
    'cardBorder',     'rgba(196, 158, 90, 0.22)',
    'buttonGradient', jsonb_build_array('#D4AC68', '#8E6E36'),
    'buttonText',     '#150E08',
    'beadCurrentStops',   jsonb_build_array('#F4E2A8', '#E0BD7A', '#B89456'),
    'beadFutureStops',    jsonb_build_array('rgba(196,158,90,0.22)', 'rgba(196,158,90,0.08)'),
    'beadCompletedStops', jsonb_build_array('rgba(224,189,122,0.50)', 'rgba(196,158,90,0.18)'),
    'cordStroke',     'rgba(224, 189, 122, 0.22)',
    'crucifixVariant',   'benedictine',
    'introBeadVariant',  'medal-bento',
    'beadShape',         'sphere'
  ),
  jsonb_build_array(
    jsonb_build_object(
      'number', 1,
      'title', 'A Conversão na Solidão de Subiaco',
      'fruit', 'Desapego do mundo',
      'scripture', 'Sl 62,2',
      'reflection', 'Bento abandona Roma e seus estudos para buscar a Deus no deserto de Subiaco. Por três anos vive numa gruta, alimentado por Romano. No silêncio aprende a escutar o Senhor: "Só em Deus repousa a minha alma."'
    ),
    jsonb_build_object(
      'number', 2,
      'title', 'A Vitória sobre a Tentação da Carne',
      'fruit', 'Pureza',
      'scripture', 'Tg 1,12',
      'reflection', 'Atacado por lembranças impuras, Bento se lança nu sobre um espinheiro até purificar o corpo pela dor. Daquele dia em diante jamais sentiu tal tentação. Ensina: "Feliz o homem que suporta a provação."'
    ),
    jsonb_build_object(
      'number', 3,
      'title', 'A Cruz e o Veneno Quebrado',
      'fruit', 'Confiança em Deus contra o mal',
      'scripture', 'Sl 91,13',
      'reflection', 'Monges descontentes oferecem a Bento um cálice envenenado. Ele faz o sinal da cruz sobre ele — o cálice se quebra em pedaços. "Pisarás o leão e a víbora; calcarás o filhote do leão e o dragão."'
    ),
    jsonb_build_object(
      'number', 4,
      'title', 'A Fundação de Monte Cassino e a Regra',
      'fruit', 'Obediência e estabilidade',
      'scripture', 'Mt 11,29',
      'reflection', 'No alto do Monte Cassino, Bento funda o mosteiro-mãe e escreve a Regra: ora et labora — reza e trabalha. "Aprendei de mim, que sou manso e humilde de coração."'
    ),
    jsonb_build_object(
      'number', 5,
      'title', 'A Morte de Pé, de Braços Abertos',
      'fruit', 'Perseverança final',
      'scripture', '2Tm 4,7',
      'reflection', 'No dia da morte, Bento pede que o levem ao oratório. De pé, sustentado pelos irmãos, com as mãos erguidas, entrega a alma a Deus. "Combati o bom combate, terminei a corrida, guardei a fé."'
    )
  ),
  null,
  'free',
  '{"operador":"todas","condicoes":[]}'::jsonb,
  null,
  10, true, 'published'
),

-- ─── 4. Dogmas Marianos (rules: tópico de mariologia) ───────────────────
(
  'dogmas-marianos',
  'Dogmas Marianos',
  'Os quatro dogmas + Maria Mãe da Igreja',
  'Medite os quatro dogmas marianos definidos pela Igreja — Maternidade Divina (431), Virgindade Perpétua (649), Imaculada Conceição (1854) e Assunção (1950) — culminando em Maria Mãe da Igreja.',
  '"Magnificat anima mea Dominum, et exsultavit spiritus meus in Deo salutari meo."',
  'doutrina',
  'lendaria',
  '☧',
  jsonb_build_object(
    'pageBg', '#0A0810',
    'pageBgAmbient',
      'radial-gradient(ellipse 90% 55% at 50% -8%, rgba(56, 56, 130, 0.30) 0%, transparent 58%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(186, 154, 220, 0.06) 0%, transparent 55%)',
    'accent',         '#9B86C4',
    'accentLight',    '#C4B0E2',
    'accentDeep',     '#3D2D5C',
    'textPrimary',    '#E8DFEF',
    'textSecondary',  '#B5A6C2',
    'textMuted',      '#7F718F',
    'border',         'rgba(155, 134, 196, 0.16)',
    'borderStrong',   'rgba(196, 176, 226, 0.36)',
    'cardBg',         'rgba(18, 14, 26, 0.7)',
    'cardBorder',     'rgba(155, 134, 196, 0.22)',
    'buttonGradient', jsonb_build_array('#B9A2D8', '#6E5896'),
    'buttonText',     '#130D1E',
    'beadCurrentStops',   jsonb_build_array('#E8D8F0', '#C4B0E2', '#9B86C4'),
    'beadFutureStops',    jsonb_build_array('rgba(155,134,196,0.22)', 'rgba(155,134,196,0.08)'),
    'beadCompletedStops', jsonb_build_array('rgba(196,176,226,0.50)', 'rgba(155,134,196,0.18)'),
    'cordStroke',     'rgba(196, 176, 226, 0.22)',
    'crucifixVariant',   'budded',
    'introBeadVariant',  'rose',
    'beadShape',         'rose'
  ),
  jsonb_build_array(
    jsonb_build_object(
      'number', 1,
      'title', 'Maternidade Divina — Theotókos',
      'fruit', 'Veneração à Mãe de Deus',
      'scripture', 'Lc 1,43',
      'reflection', 'No Concílio de Éfeso (431), a Igreja proclama: Maria é verdadeiramente Mãe de Deus, não apenas de Cristo homem. Em seu ventre se uniram divindade e humanidade. Isabel exclama: "De onde me vem esta honra de vir a mim a Mãe de meu Senhor?"'
    ),
    jsonb_build_object(
      'number', 2,
      'title', 'Virgindade Perpétua — Sempre Virgem',
      'fruit', 'Pureza de coração',
      'scripture', 'Lc 1,34',
      'reflection', 'Maria é Virgem antes, durante e depois do parto — definição do Concílio de Latrão (649). Sua virgindade é fecunda pelo Espírito Santo, sinal de total entrega a Deus. "Como se fará isso, se eu não conheço varão?"'
    ),
    jsonb_build_object(
      'number', 3,
      'title', 'Imaculada Conceição',
      'fruit', 'Horror ao pecado',
      'scripture', 'Lc 1,28',
      'reflection', 'Pelo Pio IX (1854): Maria foi preservada do pecado original desde o primeiro instante de sua concepção, por uma graça singular de Deus em vista dos méritos de Cristo. O anjo a saúda: "Salve, cheia de graça."'
    ),
    jsonb_build_object(
      'number', 4,
      'title', 'Assunção aos Céus',
      'fruit', 'Esperança da ressurreição',
      'scripture', 'Ap 12,1',
      'reflection', 'Pelo Pio XII (1950): Maria, terminado o curso da vida terrena, foi assunta em corpo e alma à glória celeste. É a primícia dos que ressuscitarão em Cristo. "Apareceu no céu um grande sinal: uma mulher vestida de sol."'
    ),
    jsonb_build_object(
      'number', 5,
      'title', 'Maria Mãe da Igreja',
      'fruit', 'Filiação mariana',
      'scripture', 'Jo 19,27',
      'reflection', 'Aos pés da cruz, Jesus entrega Maria como Mãe a todo discípulo: "Eis aí tua mãe." Paulo VI proclama Maria Mater Ecclesiae em 1964. Ela continua a interceder por nós até a consumação dos séculos.'
    )
  ),
  null,
  'rules',
  -- Quando o admin definir o slug exato do grupo de conteúdo "mariologia",
  -- editar este JSONB. Por enquanto deixo um placeholder que NÃO destrava
  -- ninguém (subtopico_concluido com UUID nulo).
  jsonb_build_object(
    'operador', 'qualquer',
    'condicoes', jsonb_build_array(
      jsonb_build_object('tipo', 'grupo_concluido', 'ref', 'mariologia'),
      jsonb_build_object('tipo', 'topico_concluido', 'ref', '00000000-0000-0000-0000-000000000000')
    )
  ),
  'Conclua o estudo de Mariologia',
  20, true, 'published'
),

-- ─── 5. Padre Pio (coming_soon — placeholder) ───────────────────────────
(
  'padre-pio',
  'Terço de Padre Pio',
  'O estigmatizado de Pietrelcina',
  'Medite a vida e os carismas do São Padre Pio (1887–1968), confessor incansável e portador dos estigmas. Em breve.',
  '"Reza, espera e não te aflijas." — Pe. Pio',
  'santo',
  'epica',
  '✠',
  jsonb_build_object(
    'pageBg', '#100806',
    'pageBgAmbient',
      'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(110, 30, 20, 0.45) 0%, transparent 55%)',
    'accent',         '#B07050',
    'accentLight',    '#D49878',
    'accentDeep',     '#4A1810',
    'textPrimary',    '#F0E3D8',
    'textSecondary',  '#C2A898',
    'textMuted',      '#876854',
    'border',         'rgba(176, 112, 80, 0.16)',
    'borderStrong',   'rgba(212, 152, 120, 0.36)',
    'cardBg',         'rgba(22, 14, 10, 0.7)',
    'cardBorder',     'rgba(176, 112, 80, 0.22)',
    'buttonGradient', jsonb_build_array('#C68868', '#7A4830'),
    'buttonText',     '#1A0D08',
    'beadCurrentStops',   jsonb_build_array('#F0D8C0', '#D49878', '#B07050'),
    'beadFutureStops',    jsonb_build_array('rgba(176,112,80,0.22)', 'rgba(176,112,80,0.08)'),
    'beadCompletedStops', jsonb_build_array('rgba(212,152,120,0.50)', 'rgba(176,112,80,0.18)'),
    'cordStroke',     'rgba(212, 152, 120, 0.22)',
    'crucifixVariant',   'pio',
    'introBeadVariant',  'rose',
    'beadShape',         'sphere'
  ),
  null,  -- mysteries placeholder vazios — ainda não rezável
  null,
  'coming_soon',
  '{"operador":"todas","condicoes":[]}'::jsonb,
  'Em breve',
  30, true, 'published'
),

-- ─── 6. Divina Misericórdia (coming_soon — estrutura de coroa) ──────────
(
  'divina-misericordia',
  'Coroa da Divina Misericórdia',
  'Conforme a revelação a Santa Faustina',
  'A Coroa da Misericórdia, rezada nas contas do terço comum. Em breve, com estrutura própria de oração.',
  '"Jesus, eu confio em Vós."',
  'devocional',
  'rara',
  '☩',
  jsonb_build_object(
    'pageBg', '#080A12',
    'pageBgAmbient',
      'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(60, 100, 180, 0.25) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 50% 110%, rgba(220, 180, 120, 0.05) 0%, transparent 50%)',
    'accent',         '#E6C078',
    'accentLight',    '#F2DCA8',
    'accentDeep',     '#7A5028',
    'textPrimary',    '#EFE6D8',
    'textSecondary',  '#C2B5A0',
    'textMuted',      '#857968',
    'border',         'rgba(230, 192, 120, 0.16)',
    'borderStrong',   'rgba(242, 220, 168, 0.36)',
    'cardBg',         'rgba(14, 14, 22, 0.7)',
    'cardBorder',     'rgba(230, 192, 120, 0.22)',
    'buttonGradient', jsonb_build_array('#EFC890', '#A8763C'),
    'buttonText',     '#1A100A',
    'beadCurrentStops',   jsonb_build_array('#F8E8C0', '#F2DCA8', '#E6C078'),
    'beadFutureStops',    jsonb_build_array('rgba(230,192,120,0.22)', 'rgba(230,192,120,0.08)'),
    'beadCompletedStops', jsonb_build_array('rgba(242,220,168,0.50)', 'rgba(230,192,120,0.18)'),
    'cordStroke',     'rgba(242, 220, 168, 0.22)',
    'crucifixVariant',   'classic',
    'introBeadVariant',  'medal-divine-mercy',
    'beadShape',         'sphere'
  ),
  null,
  null,
  'coming_soon',
  '{"operador":"todas","condicoes":[]}'::jsonb,
  'Em desenvolvimento',
  40, true, 'published'
)

on conflict (slug) do update set
  nome           = excluded.nome,
  subtitulo      = excluded.subtitulo,
  descricao      = excluded.descricao,
  epigraph       = excluded.epigraph,
  categoria      = excluded.categoria,
  raridade       = excluded.raridade,
  glyph          = excluded.glyph,
  theme          = excluded.theme,
  mysteries      = excluded.mysteries,
  base_mystery_set = excluded.base_mystery_set,
  unlock_tipo    = excluded.unlock_tipo,
  unlock_regras  = excluded.unlock_regras,
  unlock_label   = excluded.unlock_label,
  ordem          = excluded.ordem,
  visivel        = excluded.visivel,
  status         = excluded.status,
  updated_at     = now();

-- ============================================================================
-- Backfill: dá as skins canônicas (free) pra todos os profiles existentes
-- ============================================================================
insert into public.user_rosary_skins (user_id, skin_id, fonte)
select p.id, s.id, 'initial'
from public.profiles p
cross join public.rosary_skins s
where s.unlock_tipo = 'free'
  and s.visivel = true
  and s.status = 'published'
on conflict do nothing;

-- ============================================================================
-- Define active_rosary_skin_id pra profiles que não têm — devocional clássico
-- ============================================================================
update public.profiles p
set active_rosary_skin_id = (
  select id from public.rosary_skins where slug = 'devocional-classico' limit 1
)
where p.active_rosary_skin_id is null;
