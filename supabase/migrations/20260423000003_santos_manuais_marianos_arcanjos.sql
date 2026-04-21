-- Registros manuais em public.santos — entidades que não estão no GCatholic.
--
-- Marianos (Nossa Senhora Aparecida, Fátima), títulos de Cristo (Sagrado Coração),
-- arcanjos (Miguel, Gabriel, Rafael).
--
-- Estes registros recebem conteúdo curado completo (invocação, patronatos,
-- oração curta, biografia) porque já fazem parte do top 30 de popularidade.
--
-- gcatholic_uid = 'manual:{slug}' para garantir unicidade.
-- Idempotente via on conflict do update.

begin;

insert into public.santos (
  gcatholic_uid, gcatholic_person_id, gcatholic_path, gcatholic_url, pagina_tipo,
  titulo, tipo_culto, nome, slug, popularidade_rank, festa_texto,
  invocacao, patronatos, oracao_curta, biografia_curta,
  descricao, detalhes
) values
(
  'manual:nossa-senhora-aparecida',
  null, null, null, 'manual',
  'Our Lady', 'mariano',
  'Nossa Senhora Aparecida',
  'nossa-senhora-aparecida',
  1,
  '12 de outubro',
  'Nossa Senhora Aparecida, rogai por nós',
  array['Brasil', 'padroeira do Brasil', 'pescadores', 'lar cristão'],
  E'Mãe Aparecida, Rainha e Padroeira do Brasil,\nolhai para este vosso filho que hoje se confia a vós.\nAlcançai-me a graça de amar a Jesus como vós o amais\ne de servir à Santa Igreja com fidelidade até o fim.\nAmém.',
  E'A devoção a Nossa Senhora Aparecida nasceu em 1717, quando três pescadores encontraram no rio Paraíba do Sul, em Guaratinguetá, uma pequena imagem escura de terracota da Imaculada Conceição. Após a pesca milagrosa que se seguiu, a imagem começou a ser venerada em um pequeno oratório.\n\nProclamada Padroeira do Brasil em 1930 pelo Papa Pio XI, sua basílica em Aparecida (SP) é o segundo maior santuário mariano do mundo. A festa litúrgica de 12 de outubro é feriado nacional no Brasil desde 1980.',
  'Título mariano. Padroeira oficial do Brasil.',
  '{"origem": "manual", "categoria": "mariano", "fonte": "CNBB, santuário de Aparecida"}'::jsonb
),
(
  'manual:nossa-senhora-de-fatima',
  null, null, null, 'manual',
  'Our Lady', 'mariano',
  'Nossa Senhora de Fátima',
  'nossa-senhora-de-fatima',
  2,
  '13 de maio',
  'Nossa Senhora de Fátima, rogai por nós',
  array['Portugal', 'paz', 'conversão dos pecadores', 'reparação'],
  E'Ó minha Senhora, ó minha Mãe,\neu me ofereço todo a vós;\ne em prova da minha devoção,\nvos consagro meus olhos, ouvidos, boca, coração;\nem uma palavra, todo o meu ser.\nJá que sou vosso, ó incomparável Mãe,\nguardai-me e defendei-me como coisa e propriedade vossa.\nAmém.',
  E'Entre maio e outubro de 1917, Nossa Senhora apareceu seis vezes a três pastorinhos — Lúcia, Francisco e Jacinta — na Cova da Iria, em Fátima, Portugal. Pediu oração pelo pecadores, recitação diária do terço e devoção ao Imaculado Coração de Maria.\n\nEm 13 de outubro de 1917, cerca de 70 mil testemunhas presenciaram o "milagre do sol". As aparições foram declaradas dignas de crédito pela Igreja em 1930. Francisco e Jacinta foram canonizados em 2017.',
  'Aparições marianas em Fátima, Portugal (1917).',
  '{"origem": "manual", "categoria": "mariano", "fonte": "santuário de Fátima"}'::jsonb
),
(
  'manual:sagrado-coracao-de-jesus',
  null, null, null, 'manual',
  'Title', 'titulo',
  'Sagrado Coração de Jesus',
  'sagrado-coracao-de-jesus',
  3,
  'Sexta-feira após Corpus Christi',
  'Sagrado Coração de Jesus, eu confio em vós',
  array['família cristã', 'misericórdia', 'reparação', 'amor divino'],
  E'Sagrado Coração de Jesus,\nfazei que eu vos ame cada vez mais.\nCoração de Jesus, fornalha ardente de caridade,\nabrasai meu coração com o fogo do vosso amor.\nCoração de Jesus, manso e humilde,\ntornai meu coração semelhante ao vosso.\nAmém.',
  E'A devoção ao Sagrado Coração de Jesus foi formalizada a partir das revelações de Nosso Senhor a Santa Margarida Maria Alacoque, em Paray-le-Monial (França), entre 1673 e 1675. Jesus pediu a consagração da humanidade ao seu Coração, como sinal do seu amor pelos homens.\n\nA festa do Sagrado Coração foi instituída por Clemente XIII em 1765. Leão XIII consagrou o gênero humano ao Sagrado Coração em 1899. A prática da Primeira Sexta-feira do mês nasceu desta devoção.',
  'Devoção central à caridade e misericórdia de Cristo.',
  '{"origem": "manual", "categoria": "cristologico", "fonte": "tradição"}'::jsonb
),
(
  'manual:sao-miguel-arcanjo',
  null, null, null, 'manual',
  'Archangel', 'arcanjo',
  'São Miguel Arcanjo',
  'sao-miguel-arcanjo',
  11,
  '29 de setembro',
  'São Miguel Arcanjo, defendei-nos no combate',
  array['proteção espiritual', 'soldados', 'policiais', 'combate ao mal'],
  E'São Miguel Arcanjo,\ndefendei-nos no combate,\nsede o nosso refúgio contra as maldades\ne ciladas do demônio.\nOrdene-lhe Deus, instantemente o pedimos,\ne vós, príncipe da milícia celeste,\npelo poder divino, precipitai no inferno\na Satanás e aos outros espíritos malignos\nque andam pelo mundo para perder as almas.\nAmém.',
  E'São Miguel Arcanjo é o chefe da milícia celeste e protetor da Igreja. Seu nome, do hebraico "Mi-ka-El", significa "Quem como Deus?" — pergunta retórica que proclama a soberania divina contra a rebelião de Lúcifer.\n\nMencionado em Daniel 10 e 12, na Carta de Judas e no Apocalipse 12, é venerado como guardião do povo de Deus. A oração composta pelo Papa Leão XIII em 1886, após uma visão, tornou-se a oração de exorcismo simples mais difundida do catolicismo.',
  'Arcanjo. Chefe da milícia celeste.',
  '{"origem": "manual", "categoria": "arcanjo", "fonte": "Sagrada Escritura, Leão XIII"}'::jsonb
),
(
  'manual:sao-gabriel-arcanjo',
  null, null, null, 'manual',
  'Archangel', 'arcanjo',
  'São Gabriel Arcanjo',
  'sao-gabriel-arcanjo',
  12,
  '29 de setembro',
  'São Gabriel Arcanjo, rogai por nós',
  array['comunicação', 'mensageiros', 'radiodifusão', 'diplomatas'],
  E'São Gabriel Arcanjo,\nvós que fostes escolhido por Deus\npara anunciar o mistério da Encarnação à Virgem Maria,\nobtende-nos a graça de acolher a Palavra de Deus\ncom a prontidão da fé\ne a docilidade do coração.\nAmém.',
  E'São Gabriel Arcanjo é o mensageiro celeste por excelência. Seu nome hebraico significa "Força de Deus". É ele quem anuncia a Daniel a vinda do Messias (Dn 9), a Zacarias o nascimento de João Batista (Lc 1,11-20) e, sobretudo, à Virgem Maria a Encarnação do Verbo (Lc 1,26-38).\n\nVenerado como padroeiro das comunicações, radiodifusão e dos serviços postais (por Pio XII em 1951). Celebrado com Miguel e Rafael em 29 de setembro na reforma litúrgica.',
  'Arcanjo da Anunciação.',
  '{"origem": "manual", "categoria": "arcanjo", "fonte": "Sagrada Escritura"}'::jsonb
),
(
  'manual:sao-rafael-arcanjo',
  null, null, null, 'manual',
  'Archangel', 'arcanjo',
  'São Rafael Arcanjo',
  'sao-rafael-arcanjo',
  13,
  '29 de setembro',
  'São Rafael Arcanjo, rogai por nós',
  array['viajantes', 'enfermos', 'farmacêuticos', 'jovens', 'cegos'],
  E'São Rafael Arcanjo,\ncompanheiro fiel de Tobias,\nmédico enviado por Deus,\nacompanhai-me em minhas viagens,\ncurai as feridas do meu corpo e da minha alma\ne guiai-me pelo caminho seguro\nque conduz ao encontro do Pai.\nAmém.',
  E'São Rafael Arcanjo aparece no Livro de Tobias, onde se apresenta como "um dos sete anjos que estão diante do Senhor" (Tb 12,15). Seu nome hebraico significa "Deus cura". Acompanha o jovem Tobias na viagem, cura a cegueira de Tobit e liberta Sara do demônio Asmodeu.\n\nPadroeiro dos viajantes, enfermos e farmacêuticos. Comumente invocado em orações de cura e proteção de caminhos. Celebrado com Miguel e Gabriel em 29 de setembro.',
  'Arcanjo companheiro de Tobias. Cura e proteção de viagens.',
  '{"origem": "manual", "categoria": "arcanjo", "fonte": "Livro de Tobias"}'::jsonb
)
on conflict (gcatholic_uid) do update set
  nome = excluded.nome,
  slug = excluded.slug,
  popularidade_rank = excluded.popularidade_rank,
  titulo = excluded.titulo,
  tipo_culto = excluded.tipo_culto,
  festa_texto = excluded.festa_texto,
  invocacao = excluded.invocacao,
  patronatos = excluded.patronatos,
  oracao_curta = excluded.oracao_curta,
  biografia_curta = excluded.biografia_curta,
  descricao = excluded.descricao,
  detalhes = excluded.detalhes,
  updated_at = now();

commit;
