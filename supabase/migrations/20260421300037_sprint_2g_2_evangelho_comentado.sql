-- ============================================================================
-- Sprint 2G.2 — Liturgia: Evangelho comentado com comentário patrístico
-- ============================================================================
-- ÚLTIMO SPRINT da Fase 2. Fecha Bloco G e toda a Fase 2 do plano original.
-- ============================================================================


insert into public.content_topics (id, group_id, slug, title, subtitle, description, sort_order, visible)
values (
  '9b000008-0000-4001-8001-000000000201',
  '9b000008-0000-4001-8001-000000000001',
  'evangelho-comentado',
  'Evangelho Comentado',
  'Lectio Divina e comentário patrístico',
  'A tradição de ler o Evangelho do dia com comentários dos Padres da Igreja e santos. Aprofunda a liturgia dominical e diária, conectando o fiel à leitura crente da Palavra pelos primeiros séculos.',
  2, true
)
on conflict (id) do update
  set title = excluded.title, description = excluded.description, visible = true;


insert into public.content_subtopics (id, topic_id, slug, title, subtitle, description, sort_order, visible)
values (
  '9b000008-0000-4001-8001-000000000211',
  '9b000008-0000-4001-8001-000000000201',
  'lectio-divina',
  'Lectio Divina e Evangelho do Dia',
  'Leitura orante',
  'Método milenar de leitura da Escritura em quatro passos: lectio (ler), meditatio (meditar), oratio (orar), contemplatio (contemplar).',
  1, true
)
on conflict (id) do update
  set title = excluded.title, description = excluded.description, visible = true;


insert into public.content_items (id, subtopic_id, kind, title, body, sort_order, visible)
values (
  '9b000008-0000-4001-8001-000000000212',
  '9b000008-0000-4001-8001-000000000211',
  'text',
  'Evangelho comentado',
  'A Igreja, há séculos, lê a Escritura não individualmente, mas em comunhão com os Padres e santos que a leram antes. Cada texto evangélico tem recebido comentários de Crisóstomo, Agostinho, Jerônimo, Gregório Magno, Tomás de Aquino, Bento XVI e tantos outros. Ler o Evangelho do dia com esses comentários é receber a Tradição viva.',
  1, true
)
on conflict (id) do update
  set title = excluded.title, body = excluded.body, visible = true;


insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'liturgia-calendario',
  '9b000008-0000-4001-8001-000000000211',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Lectio Divina — método antigo",
      "body": "A Lectio Divina (leitura divina) é método monástico de origem antiga, sistematizado por Guido II, o Cartuxo (séc. XII) em sua obra Scala Claustralium (Escada dos Monges). Tem quatro passos:\n\n1. LECTIO (leitura): ler atentamente o texto, saboreando as palavras. Ler várias vezes lentamente.\n2. MEDITATIO (meditação): refletir sobre o sentido. O que a palavra diz? O que diz a mim?\n3. ORATIO (oração): responder a Deus — louvor, pedido, contrição, ação de graças surgida da leitura.\n4. CONTEMPLATIO (contemplação): repousar silenciosamente na Palavra, sem mais raciocinar. Gostar de estar com Deus.\n\nA Lectio Divina foi tradicionalmente praticada pelos monges beneditinos, cistercienses, cartuxos. Vaticano II, em Dei Verbum 25, a recomendou aos leigos também. Hoje, muitas paróquias organizam grupos de Lectio Divina semanais, especialmente sobre o Evangelho dominical.\n\nLer o Evangelho do dia com comentários dos Padres é forma avançada. A Catena Aurea de São Tomás de Aquino (Corrente de Ouro) compila comentários patrísticos sobre os quatro Evangelhos versículo por versículo — obra preciosíssima. Versão moderna: Bíblia de Estudo Católica, com notas patrísticas."
    },
    {
      "slug": "aplicacao",
      "title": "Como praticar",
      "body": "Escolher momento fixo do dia (manhã ou noite); abrir o Evangelho do dia (ou dominical); ter Bíblia e um livro de comentários patrísticos (se disponível); 15-20 minutos.\n\nRecursos digitais: muitos sites oferecem o Evangelho do dia com comentário: Evangelizo (francês/português), Catena (site multi-idioma, baseado na Catena Aurea), A Palavra do Dia, Magnificat. Alguns apps católicos (Laudate, iBrevário, VeritasDei) também incluem.\n\nComentários patrísticos mais frequentemente citados: Santo Agostinho (gigantesco, sobre João especialmente — Tratados sobre o Evangelho de João); São João Crisóstomo (Homilias sobre Mateus, sobre João, sobre as Cartas Paulinas); São Jerônimo (Comentários sobre Mateus e as Cartas); São Gregório Magno (Homilias sobre os Evangelhos — 40 sermões dominicais); Beda Venerável; São Tomás de Aquino (Comentários sobre João, Mateus). Bento XVI escreveu Jesus de Nazaré (3 volumes) — comentário moderno patrístico-bíblico excepcional.\n\nFrutos: a Lectio Divina praticada regularmente (mesmo 20 min por dia) forma o cristão leigo maduro. Melhor que muitos cursos. Familiariza com a voz de Cristo nas Escrituras. Prepara para a Missa dominical (se feita com as leituras do domingo). Sustenta a vida espiritual em tempos de aridez.\n\nDica pastoral: começar com poucos versículos (5-10) por dia. Não apressar para ler muito. Ler pouco e meditar bem é mais proveitoso que ler muito superficialmente. A Bíblia não é livro para devorar de capa a capa como romance; é alimento para mastigar lentamente como banquete."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Mateus 4,4 (não só de pão viverá o homem, mas de toda palavra de Deus)", "url": null, "page": null },
    { "kind": "scripture", "label": "Salmo 119 (poema à Palavra de Deus)", "url": null, "page": null },
    { "kind": "council", "label": "Vaticano II, Dei Verbum 25", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 101-141, 2705-2708", "url": null, "page": null },
    { "kind": "other", "label": "Guido II, o Cartuxo, Scala Claustralium (séc. XII)", "url": null, "page": null },
    { "kind": "father", "label": "São Tomás de Aquino, Catena Aurea (comentários patrísticos sobre os 4 Evangelhos)", "url": null, "page": null },
    { "kind": "papal", "label": "Bento XVI, Jesus de Nazaré (3 vol.); Verbum Domini (2010)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


with q as (
  insert into public.study_quizzes
    (content_type, content_ref, title, description, passing_score, xp_bonus, reliquia_slug_on_master, status, published_at)
  values (
    'liturgia-calendario',
    'topic:evangelho-comentado',
    'Prova: Evangelho Comentado e Lectio Divina',
    'Verifica a compreensão do método da Lectio Divina e sua prática.',
    70,
    15,
    null,
    'published',
    now()
  )
  on conflict (content_type, content_ref) do update
    set title = excluded.title, description = excluded.description,
        passing_score = excluded.passing_score, xp_bonus = excluded.xp_bonus,
        status = 'published',
        published_at = coalesce(public.study_quizzes.published_at, now()),
        updated_at = now()
  returning id
)
insert into public.study_quiz_questions (quiz_id, kind, prompt, options, correct, explanation, sort_order)
select q.id, kind, prompt, options::jsonb, correct::jsonb, explanation, sort_order
from q,
(values
  (
    'multi',
    'Quais são os quatro passos da Lectio Divina clássica?',
    $json$[{"id":"a","label":"Lectio (leitura)"},{"id":"b","label":"Meditatio (meditação)"},{"id":"c","label":"Oratio (oração)"},{"id":"d","label":"Contemplatio (contemplação)"},{"id":"e","label":"Predicatio (pregar aos outros) — esse não é dos 4 passos"}]$json$,
    $json$["a","b","c","d"]$json$,
    'Os quatro passos clássicos da Lectio Divina (Guido II o Cartuxo, Scala Claustralium, séc. XII): Lectio, Meditatio, Oratio, Contemplatio. Predicatio/actio podem ser consequências naturais, mas não parte técnica do método.',
    1
  ),
  (
    'single',
    'Qual obra de São Tomás de Aquino compila comentários patrísticos sobre os quatro Evangelhos versículo por versículo?',
    $json$[{"id":"a","label":"Suma Teológica"},{"id":"b","label":"Catena Aurea (Corrente de Ouro)"},{"id":"c","label":"Suma Contra Gentiles"},{"id":"d","label":"Compendium Theologiae"}]$json$,
    $json$["b"]$json$,
    'Catena Aurea (Corrente de Ouro) de São Tomás: compilação massiva de comentários patrísticos (Agostinho, Crisóstomo, Jerônimo, Gregório, etc.) sobre os quatro Evangelhos, versículo por versículo. Obra preciosíssima para leitura patrística do Evangelho.',
    2
  ),
  (
    'single',
    'Qual documento do Vaticano II recomendou a Lectio Divina também aos leigos?',
    $json$[{"id":"a","label":"Sacrosanctum Concilium"},{"id":"b","label":"Dei Verbum, especialmente 25"},{"id":"c","label":"Lumen Gentium"},{"id":"d","label":"Gaudium et Spes"}]$json$,
    $json$["b"]$json$,
    'Dei Verbum 25 (Vaticano II, 1965) recomenda explicitamente a leitura assídua da Sagrada Escritura a todos os fiéis: Igualmente, o sagrado Sínodo urge de modo insistente e especial a todos os fiéis (...) a leitura frequente das divinas Escrituras.',
    3
  ),
  (
    'truefalse',
    'A prática regular da Lectio Divina (15-20 min por dia) forma o cristão leigo maduro mais eficazmente que muitos cursos — familiariza com a voz de Cristo e sustenta a vida espiritual.',
    $json$[{"id":"v","label":"Verdadeiro"},{"id":"f","label":"Falso"}]$json$,
    $json$["v"]$json$,
    'Verdadeiro. Dica pastoral consagrada: 15-20 min diários de Lectio Divina formam mais que cursos acadêmicos. Melhor ler pouco com atenção meditativa que muitos capítulos superficialmente. A Bíblia é banquete para saborear, não romance para devorar.',
    4
  )
) as data(kind, prompt, options, correct, explanation, sort_order)
on conflict do nothing;
