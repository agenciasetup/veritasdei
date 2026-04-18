-- Seed structure: topics + subtopics for the reformed prayer library.
-- Items (the prayers themselves) come in follow-up seeds.

begin;

-- Hide legacy topics; keep them in DB for admin recovery.
update public.content_topics t
set visible = false
where t.group_id = (select id from public.content_groups where slug = 'oracoes')
  and t.slug in ('principais','profissoes-de-fe','atos-de-virtude','devocoes');

-- Refresh group metadata.
update public.content_groups
set
  title = 'Orações',
  subtitle = 'Para cada momento da vida cristã',
  description = 'Biblioteca de orações da tradição católica, organizadas por momento do dia, pela Missa, pelos essenciais e por ocasiões específicas.',
  icon = 'BookOpenText',
  visible = true
where slug = 'oracoes';

-- Topics + subtopics in a PL/pgSQL block.
do $seed$
declare
  v_group_id uuid;
  v_t_essenciais uuid;
  v_t_dia uuid;
  v_t_missa uuid;
  v_t_ocasioes uuid;
begin
  select id into v_group_id from public.content_groups where slug = 'oracoes';

  -- Topics
  insert into public.content_topics (group_id, slug, title, subtitle, icon, sort_order, visible)
  values (v_group_id, 'essenciais', 'Essenciais', 'Todo católico deve saber', 'Heart', 10, true)
  on conflict (group_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, icon = excluded.icon,
    sort_order = excluded.sort_order, visible = true
  returning id into v_t_essenciais;

  insert into public.content_topics (group_id, slug, title, subtitle, icon, sort_order, visible)
  values (v_group_id, 'dia-a-dia', 'Dia a dia', 'Manhã, durante o dia e noite', 'Sunrise', 20, true)
  on conflict (group_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, icon = excluded.icon,
    sort_order = excluded.sort_order, visible = true
  returning id into v_t_dia;

  insert into public.content_topics (group_id, slug, title, subtitle, icon, sort_order, visible)
  values (v_group_id, 'missa', 'Missa', 'Ordinário e orações da celebração', 'Church', 30, true)
  on conflict (group_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, icon = excluded.icon,
    sort_order = excluded.sort_order, visible = true
  returning id into v_t_missa;

  insert into public.content_topics (group_id, slug, title, subtitle, icon, sort_order, visible)
  values (v_group_id, 'ocasioes', 'Ocasiões', 'Proteção, estudo, viagem e mais', 'Compass', 40, true)
  on conflict (group_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, icon = excluded.icon,
    sort_order = excluded.sort_order, visible = true
  returning id into v_t_ocasioes;

  -- Subtopics — essenciais
  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_essenciais, 'capitales', 'Orações essenciais', 'As que todo católico precisa saber de cor', 10, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;

  -- Subtopics — dia-a-dia
  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_dia, 'manha', 'Manhã', 'Ao acordar e oferecer o dia', 10, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;

  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_dia, 'durante-o-dia', 'Durante o dia', 'Meio-dia, trabalho, jaculatórias', 20, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;

  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_dia, 'noite', 'Noite', 'Antes de dormir', 30, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;

  -- Subtopics — missa
  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_missa, 'ordinario', 'Ordinário da Missa', 'As partes fixas da celebração', 10, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;

  -- Subtopics — ocasioes
  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_ocasioes, 'protecao', 'Proteção espiritual', 'Contra o mal e tentação', 10, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;

  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_ocasioes, 'estudo', 'Antes do estudo', 'Para discernir e aprender', 20, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;

  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_ocasioes, 'sofrimento', 'Sofrimento e confiança', 'Nos momentos difíceis', 30, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;

  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_ocasioes, 'viagem', 'Viagem', 'Por caminhos seguros', 40, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;

  insert into public.content_subtopics (topic_id, slug, title, subtitle, sort_order, visible)
  values (v_t_ocasioes, 'defuntos', 'Pelos defuntos', 'Sufrágio das almas', 50, true)
  on conflict (topic_id, slug) do update set
    title = excluded.title, subtitle = excluded.subtitle, sort_order = excluded.sort_order, visible = true;
end $seed$;

commit;
