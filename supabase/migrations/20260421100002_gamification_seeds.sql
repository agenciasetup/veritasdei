-- ============================================================================
-- Gamificação — Seeds de Relíquias
-- ============================================================================
-- 15 relíquias iniciais sem imagens (image_url NULL) — o admin sobe a arte
-- depois e atualiza image_url manualmente.
-- ============================================================================

insert into public.reliquias
  (slug, name, description, lore, category, rarity, unlock_type, unlock_value, unlock_ref, sort_order)
values
  ('primeiro-passo',
   'Primeiro Passo',
   'Você começou sua jornada de estudo.',
   'Quem dá o primeiro passo já percorreu metade do caminho — pois reconheceu que precisa caminhar.',
   'estudo', 'comum', 'level', 2, null, 10),

  ('iniciado-na-fe',
   'Iniciado na Fé',
   'Alcançou o nível 5 na jornada de estudo.',
   'Os primeiros passos já revelam quem busca com sinceridade.',
   'estudo', 'comum', 'level', 5, null, 20),

  ('devoto-iniciante',
   'Devoto Iniciante',
   '3 dias consecutivos de estudo.',
   'A constância é a forma mais simples de amor.',
   'streak', 'comum', 'streak', 3, null, 30),

  ('caminhante',
   'Caminhante',
   '7 dias consecutivos de estudo.',
   'Uma semana inteira caminhando — a estrada começa a ficar familiar.',
   'streak', 'rara', 'streak', 7, null, 40),

  ('conhecedor-dogmas',
   'Conhecedor dos Dogmas',
   'Completou todos os subtópicos de Dogmas.',
   'A fé busca entender — e entendendo, ama mais.',
   'estudo', 'rara', 'pillar_complete', null, 'dogmas', 50),

  ('devoto-sacramentos',
   'Devoto dos Sacramentos',
   'Completou todos os subtópicos de Sacramentos.',
   'Sinais visíveis da graça invisível — agora estudados em profundidade.',
   'estudo', 'rara', 'pillar_complete', null, 'sacramentos', 60),

  ('justo-mandamentos',
   'Justo nos Mandamentos',
   'Completou todos os subtópicos de Mandamentos.',
   'A lei de Deus não pesa — liberta.',
   'estudo', 'rara', 'pillar_complete', null, 'mandamentos', 70),

  ('ourives-da-oracao',
   'Ourives da Oração',
   'Completou todos os subtópicos de Orações.',
   'Quem aprende a rezar aprende a ser filho.',
   'estudo', 'rara', 'pillar_complete', null, 'oracoes', 80),

  ('fiel-aos-preceitos',
   'Fiel aos Preceitos',
   'Completou todos os subtópicos de Preceitos.',
   'A disciplina da Igreja é o andaime da santidade.',
   'estudo', 'rara', 'pillar_complete', null, 'preceitos', 90),

  ('virtuoso',
   'Virtuoso',
   'Completou todos os subtópicos de Virtudes.',
   'A virtude repetida se torna segunda natureza.',
   'estudo', 'rara', 'pillar_complete', null, 'virtudes-pecados', 100),

  ('misericordioso',
   'Misericordioso',
   'Completou todos os subtópicos de Obras de Misericórdia.',
   'Bem-aventurados os misericordiosos, porque alcançarão misericórdia.',
   'estudo', 'rara', 'pillar_complete', null, 'obras-misericordia', 110),

  ('peregrino-constante',
   'Peregrino Constante',
   '30 dias consecutivos de estudo.',
   'Um mês inteiro sem pular um dia — o corpo já sabe o caminho.',
   'streak', 'epica', 'streak', 30, null, 120),

  ('iluminado',
   'Iluminado',
   'Desbloqueou 12 conquistas.',
   'A luz se espalha por todo o edifício.',
   'estudo', 'epica', 'achievement_count', 12, null, 130),

  ('mestre-da-fe',
   'Mestre da Fé',
   'Completou todos os 7 pilares da fé católica.',
   'Não para se gloriar — mas pra servir. Aprendeu pra ensinar.',
   'estudo', 'lendaria', 'custom', null, 'all_pillars_complete', 140),

  ('contemplativo',
   'Contemplativo',
   '100 dias consecutivos de estudo.',
   'Cem dias. O hábito virou oração silenciosa.',
   'streak', 'lendaria', 'streak', 100, null, 150)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  lore = excluded.lore,
  category = excluded.category,
  rarity = excluded.rarity,
  unlock_type = excluded.unlock_type,
  unlock_value = excluded.unlock_value,
  unlock_ref = excluded.unlock_ref,
  sort_order = excluded.sort_order;
