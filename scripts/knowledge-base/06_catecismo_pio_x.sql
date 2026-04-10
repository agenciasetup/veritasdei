-- Catecismo de São Pio X — Inserção na base de conhecimento
-- Complementa o RAG com ensino catequético estruturado

INSERT INTO ai_knowledge_base (category, topic, core_teaching, bible_references, summary, keywords)
VALUES
  ('catecismo_pio_x', 'Da Doutrina Cristã',
   'A doutrina cristã é a doutrina que Jesus Cristo nos ensinou para mostrar o caminho da salvação. As partes principais são: o Credo, o Pai-Nosso, os Mandamentos e os Sacramentos.',
   ARRAY['Mt 28,19-20', 'Jo 14,6', 'At 2,42'],
   'Fundamentos da doutrina cristã segundo o Catecismo de São Pio X: Credo (o que crer), Pai-Nosso (como rezar), Mandamentos (como viver), Sacramentos (meios de graça).',
   ARRAY['doutrina', 'cristão', 'catecismo', 'pio x', 'fé', 'credo', 'mandamentos', 'sacramentos']),

  ('catecismo_pio_x', 'De Deus e da Santíssima Trindade',
   'Deus é o Ser perfeitíssimo, Criador e Senhor do céu e da terra. Em Deus há três Pessoas distintas: Pai, Filho e Espírito Santo — um só Deus em três Pessoas, a Santíssima Trindade.',
   ARRAY['Ex 3,14', 'Mt 28,19', 'Jo 1,1-3', '2 Cor 13,13', 'Is 6,3'],
   'São Pio X ensina sobre a existência de Deus, suas perfeições infinitas e o mistério da Santíssima Trindade: três Pessoas divinas em uma só natureza.',
   ARRAY['deus', 'trindade', 'pai', 'filho', 'espírito santo', 'criador', 'perfeição']),

  ('catecismo_pio_x', 'Da Encarnação e Redenção',
   'O Filho de Deus se fez homem para nos salvar. Jesus Cristo é verdadeiro Deus e verdadeiro homem, com duas naturezas (divina e humana) em uma só Pessoa divina.',
   ARRAY['Jo 1,14', 'Fl 2,6-8', 'Lc 1,35', 'Hb 2,14-17', '1 Tm 2,5'],
   'A segunda Pessoa da Trindade assumiu a natureza humana no seio de Maria Virgem, unindo em si a natureza divina e humana para remir o gênero humano.',
   ARRAY['encarnação', 'jesus', 'cristo', 'redenção', 'salvação', 'duas naturezas', 'maria']),

  ('catecismo_pio_x', 'Da Igreja Católica',
   'A Igreja Católica é a sociedade dos batizados que professam a mesma fé, participam dos mesmos Sacramentos e obedecem aos legítimos Pastores. Jesus Cristo a fundou e o Papa é seu vigário na terra.',
   ARRAY['Mt 16,18', 'Mt 28,18-20', 'Lc 10,16', 'Jo 21,15-17', 'Ef 4,4-6'],
   'São Pio X ensina que a Igreja Católica é infalível no ensino da fé e dos costumes, fundada por Cristo sobre Pedro, governada pelo Papa como vigário de Cristo.',
   ARRAY['igreja', 'católica', 'papa', 'pedro', 'infalibilidade', 'magistério', 'fundação']),

  ('catecismo_pio_x', 'Dos Sacramentos',
   'Os Sacramentos são sete sinais sensíveis e eficazes da graça, instituídos por Jesus Cristo: Batismo, Crisma, Eucaristia, Penitência, Unção dos Enfermos, Ordem e Matrimônio.',
   ARRAY['Mt 28,19', 'At 8,17', 'Lc 22,19-20', 'Jo 20,22-23', 'Tg 5,14', 'Hb 5,6', 'Mt 19,6'],
   'O Catecismo de São Pio X expõe os sete Sacramentos como meios eficazes de santificação, cada um instituído por Cristo para comunicar graças específicas.',
   ARRAY['sacramentos', 'batismo', 'eucaristia', 'confissão', 'crisma', 'ordem', 'matrimônio', 'unção']),

  ('catecismo_pio_x', 'Da Eucaristia e Transubstanciação',
   'A Eucaristia contém verdadeira, real e substancialmente o Corpo, o Sangue, a Alma e a Divindade de Jesus Cristo sob as espécies do pão e do vinho. A mudança chama-se Transubstanciação.',
   ARRAY['Jo 6,51-56', 'Lc 22,19-20', '1 Cor 11,23-29', 'Mt 26,26-28'],
   'São Pio X ensina a presença real de Cristo na Eucaristia pela Transubstanciação: após a Consagração, já não há pão nem vinho, mas o próprio Cristo.',
   ARRAY['eucaristia', 'transubstanciação', 'presença real', 'corpo de cristo', 'missa', 'comunhão']),

  ('catecismo_pio_x', 'Da Oração',
   'Oração é uma elevação da alma a Deus para adorá-Lo, agradecer-Lhe, pedir-Lhe perdão e implorar graças. O Pai-Nosso é a mais excelente de todas as orações por ter sido composta por Jesus Cristo.',
   ARRAY['Mt 6,9-13', 'Lc 11,1-4', 'Lc 18,1', 'Fl 4,6', '1 Ts 5,17'],
   'O Catecismo de São Pio X ensina a necessidade e as disposições da oração: humildade, confiança, perseverança e resignação à vontade de Deus.',
   ARRAY['oração', 'pai nosso', 'ave maria', 'rezar', 'humildade', 'confiança', 'perseverança']),

  ('catecismo_pio_x', 'Dos Mandamentos da Lei de Deus',
   'Os Dez Mandamentos foram dados por Deus a Moisés e confirmados por Jesus Cristo. Resumem-se em amar a Deus sobre todas as coisas e ao próximo como a si mesmo.',
   ARRAY['Ex 20,1-17', 'Mt 22,37-40', 'Mt 19,17', 'Rm 13,9-10', 'Jo 14,15'],
   'São Pio X expõe os Dez Mandamentos como lei divina imutável que todos são obrigados a observar com o auxílio da graça de Deus.',
   ARRAY['mandamentos', 'lei de deus', 'moisés', 'decálogo', 'moral', 'obediência']),

  ('catecismo_pio_x', 'Das Virtudes e dos Pecados',
   'Virtude é disposição habitual da alma para o bem. As virtudes teologais são Fé, Esperança e Caridade. Os pecados capitais são sete: soberba, avareza, luxúria, ira, gula, inveja e preguiça.',
   ARRAY['1 Cor 13,13', 'Gl 5,22-23', 'Pr 6,16-19', '1 Jo 2,16', 'Gl 5,19-21'],
   'O Catecismo de São Pio X apresenta as virtudes teologais e cardeais como caminho de santidade, e os pecados capitais como fontes de todos os vícios.',
   ARRAY['virtudes', 'pecados', 'fé', 'esperança', 'caridade', 'pecados capitais', 'soberba', 'avareza']),

  ('catecismo_pio_x', 'Dos Novíssimos do Homem',
   'Os Novíssimos são as últimas coisas: Morte, Juízo, Inferno e Paraíso. Pensar neles ajuda a evitar o pecado, conforme a Escritura: "Lembra-te dos teus Novíssimos e jamais pecarás."',
   ARRAY['Eclo 7,40', 'Hb 9,27', 'Mt 25,31-46', 'Ap 20,11-15', 'Jo 14,2-3'],
   'São Pio X ensina sobre os Novíssimos: a certeza da morte, o juízo particular e final, a realidade do inferno e a bem-aventurança do Paraíso.',
   ARRAY['novíssimos', 'morte', 'juízo', 'inferno', 'paraíso', 'escatologia', 'vida eterna'])
ON CONFLICT DO NOTHING;
