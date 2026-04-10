-- São Tomás de Aquino — Base de conhecimento para RAG
-- Temas centrais da Suma Teológica para enriquecer respostas da IA

INSERT INTO ai_knowledge_base (category, topic, core_teaching, bible_references, summary, keywords)
VALUES
  ('sao_tomas', 'Existência de Deus — As Cinco Vias',
   'São Tomás de Aquino demonstra a existência de Deus por cinco vias: pelo movimento (motor imóvel), pela causalidade eficiente (causa primeira), pela contingência (ser necessário), pelos graus de perfeição (ser perfeitíssimo) e pela finalidade (inteligência ordenadora).',
   ARRAY['Rm 1,20', 'Sb 13,1-5', 'At 17,24-28', 'Sl 19,2'],
   'As Cinco Vias de São Tomás (S.Th. I, q.2, a.3) são argumentos filosóficos que partem da experiência sensível para demonstrar a existência de Deus como causa primeira e fim último.',
   ARRAY['cinco vias', 'existência de deus', 'prova', 'motor imóvel', 'causa primeira', 'tomás', 'aquino', 'suma']),

  ('sao_tomas', 'Natureza e Atributos de Deus',
   'Deus é ato puro, sem composição nem potencialidade. É simples, perfeito, bom, infinito, imutável, eterno, uno. Conhecemos Deus por analogia: podemos dizer o que Deus não é (via negativa) e o que é por excelência (via eminentiae).',
   ARRAY['Ex 3,14', 'Tg 1,17', 'Sl 102,27', 'Ml 3,6', '1 Tm 6,16'],
   'São Tomás (S.Th. I, qq.3-26) trata dos atributos divinos: simplicidade, perfeição, bondade, infinitude, imutabilidade, eternidade, unidade e o conhecimento de Deus.',
   ARRAY['atributos', 'simplicidade', 'perfeição', 'eternidade', 'imutabilidade', 'ato puro', 'analogia']),

  ('sao_tomas', 'Lei Natural e Lei Moral',
   'A lei natural é a participação da lei eterna na criatura racional. Seu primeiro preceito é: "O bem deve ser feito e procurado, e o mal deve ser evitado." É universal, imutável e cognoscível pela razão.',
   ARRAY['Rm 2,14-15', 'Sl 4,6', 'Jr 31,33', 'Rm 1,19-20'],
   'São Tomás (S.Th. I-II, qq.90-97) expõe a doutrina da lei natural como fundamento da moralidade: uma ordenação da razão ao bem comum, promulgada pela natureza racional do homem.',
   ARRAY['lei natural', 'lei moral', 'bem', 'mal', 'razão', 'moralidade', 'ética', 'lei eterna']),

  ('sao_tomas', 'As Virtudes Teologais e Cardeais',
   'As virtudes teologais (fé, esperança, caridade) têm Deus como objeto e são infundidas por Ele. As virtudes cardeais (prudência, justiça, fortaleza, temperança) são adquiridas pelo hábito e aperfeiçoadas pela graça.',
   ARRAY['1 Cor 13,13', 'Sb 8,7', 'Gl 5,22-23', '2 Pd 1,5-7'],
   'São Tomás (S.Th. I-II, qq.55-67 e II-II) expõe sistematicamente as virtudes como hábitos operativos bons que aperfeiçoam as potências da alma para o agir moral.',
   ARRAY['virtudes', 'fé', 'esperança', 'caridade', 'prudência', 'justiça', 'fortaleza', 'temperança']),

  ('sao_tomas', 'A Eucaristia como Sacramento',
   'Na Eucaristia, toda a substância do pão se converte no Corpo de Cristo e toda a substância do vinho no Sangue de Cristo (Transubstanciação). Os acidentes permanecem sem sujeito, sustentados por poder divino.',
   ARRAY['Jo 6,51-56', 'Mt 26,26-28', '1 Cor 11,23-29', 'Lc 22,19-20'],
   'São Tomás (S.Th. III, qq.73-83) oferece a exposição mais profunda da Eucaristia: presença real, transubstanciação, efeitos do sacramento e a Missa como sacrifício.',
   ARRAY['eucaristia', 'transubstanciação', 'presença real', 'sacramento', 'missa', 'sacrifício', 'corpo de cristo']),

  ('sao_tomas', 'Cristo: Encarnação e Redenção',
   'A Encarnação é a união hipostática: a Pessoa divina do Verbo assume a natureza humana sem confusão nem separação. Cristo é mediador entre Deus e os homens, sacerdote, profeta e rei.',
   ARRAY['Jo 1,14', 'Fl 2,6-8', 'Hb 4,15', '1 Tm 2,5', 'Cl 1,15-20'],
   'São Tomás (S.Th. III, qq.1-59) trata da Cristologia: a conveniência da Encarnação, a união hipostática, a graça de Cristo, sua paixão, morte e ressurreição como causa da nossa salvação.',
   ARRAY['encarnação', 'união hipostática', 'cristo', 'redenção', 'paixão', 'ressurreição', 'mediador']),

  ('sao_tomas', 'A Graça e a Justificação',
   'A graça é um dom sobrenatural pelo qual Deus nos faz participantes da natureza divina. A justificação é a passagem do estado de pecado ao estado de graça. Ninguém pode merecer a graça primeira.',
   ARRAY['2 Pd 1,4', 'Rm 3,24', 'Ef 2,8-9', 'Jo 15,5', 'Rm 5,1-2'],
   'São Tomás (S.Th. I-II, qq.109-114) ensina que a graça santificante é absolutamente necessária para a salvação e que o homem não pode, pelas suas forças naturais, merecer a primeira graça.',
   ARRAY['graça', 'justificação', 'salvação', 'mérito', 'graça santificante', 'natureza divina', 'sobrenatural']),

  ('sao_tomas', 'Pecado Original e Seus Efeitos',
   'O pecado original é transmitido por geração a todos os descendentes de Adão. Seus efeitos: perda da graça santificante, inclinação ao mal (concupiscência), sofrimento e morte. Só o Batismo o apaga.',
   ARRAY['Rm 5,12-19', 'Gn 3,1-24', 'Sl 51,7', '1 Cor 15,21-22', 'Rm 6,23'],
   'São Tomás (S.Th. I-II, qq.81-83) explica como o pecado de Adão afetou toda a humanidade: a natureza humana ficou ferida mas não totalmente corrompida, e o Batismo restaura a graça.',
   ARRAY['pecado original', 'adão', 'concupiscência', 'batismo', 'queda', 'natureza humana']),

  ('sao_tomas', 'Escatologia: Ressurreição e Vida Eterna',
   'Todos os homens ressuscitarão com seus próprios corpos. Os bem-aventurados gozarão da visão beatífica — a contemplação face a face da essência divina — que é a felicidade perfeita e eterna.',
   ARRAY['1 Cor 15,42-44', 'Jo 6,40', 'Mt 25,31-46', '1 Jo 3,2', 'Ap 21,1-4'],
   'São Tomás (Suplemento, qq.69-99) trata dos Novíssimos: a ressurreição dos corpos, o juízo final, as penas do inferno e a bem-aventurança celeste na visão de Deus.',
   ARRAY['ressurreição', 'vida eterna', 'visão beatífica', 'juízo final', 'inferno', 'paraíso', 'novíssimos'])
ON CONFLICT DO NOTHING;
