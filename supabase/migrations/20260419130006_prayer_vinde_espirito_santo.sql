-- Seed: Vinde, Espírito Santo (Dia a dia / durante-o-dia)

begin;

delete from public.content_items where slug = 'vinde-espirito-santo';

insert into public.content_items (
  subtopic_id, kind, slug, title, latin_title, body, latin_body,
  reference, keywords, meta_description, scripture_refs,
  icon_name, sort_order, visible
)
select
  s.id,
  'prayer',
  'vinde-espirito-santo',
  'Vinde, Espírito Santo',
  'Veni, Sancte Spiritus',
  E'Oração ao Paráclito para iluminação antes de estudos, decisões, trabalho intelectual ou conversas importantes. Baseada na antífona "Veni Sancte Spiritus" (Pentecostes).\n\n## Versículo e responso\n\n```verse\nV. Enviai, Senhor, o vosso Espírito e tudo será criado.\nR. E renovareis a face da terra.\n```\n\n## Oração\n\n```verse\nVinde, Espírito Santo,\nenchei os corações dos vossos fiéis\ne acendei neles o fogo do vosso amor.\n\nEnviai, Senhor, o vosso Espírito\ne tudo será criado;\ne renovareis a face da terra.\n\nOremos.\n\nÓ Deus, que instruístes os corações dos fiéis\ncom a luz do Espírito Santo,\nfazei que apreciemos retamente todas as coisas\nsegundo o mesmo Espírito\ne gozemos sempre de sua consolação.\nPor Cristo, nosso Senhor.\nAmém.\n```',
  E'V. Emítte Spíritum tuum, et creabúntur.\nR. Et renovábis fáciem terræ.\n\nVeni, Sancte Spíritus,\nreple tuórum corda fidélium,\net tui amóris in eis ignem accénde.\n\nEmítte Spíritum tuum, et creabúntur;\net renovábis fáciem terræ.\n\nOrémus. Deus, qui corda fidélium\nSancti Spíritus illustratióne docuísti,\nda nobis in eódem Spíritu recta sápere,\net de eius semper consolatióne gaudére.\nPer Christum Dóminum nostrum.\nAmen.',
  'Vinde, Espírito Santo · Veni, Sancte Spiritus',
  array['espírito santo','paráclito','veni sancte spiritus','estudo','decisão','iluminação','pentecostes'],
  'Vinde, Espírito Santo (Veni Sancte Spiritus): oração ao Paráclito para iluminação antes de estudos, decisões e trabalho intelectual. Português e latim.',
  array['Jo 14:26','Rm 8:26'],
  'Flame',
  30,
  true
from public.content_subtopics s
join public.content_topics t on t.id = s.topic_id
join public.content_groups g on g.id = t.group_id
where g.slug = 'oracoes' and t.slug = 'dia-a-dia' and s.slug = 'durante-o-dia';

commit;
