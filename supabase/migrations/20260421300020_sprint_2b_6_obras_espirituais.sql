-- ============================================================================
-- Sprint 2B.6 — Obras de Misericórdia Espirituais: deepdives + quiz
-- ============================================================================
-- 7 obras espirituais que cuidam da alma do próximo.
-- Fecha o pilar obras-misericordia (14 de 14 obras cobertas).
-- ============================================================================


-- 1. Dar bom conselho
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'obras-misericordia',
  'ca19b4b9-8d37-4ad3-a0d0-0f0e5aba2b47',
  $json$[
    {
      "slug": "contexto_biblico",
      "title": "Contexto bíblico",
      "body": "Dar bom conselho é orientar quem está perdido, confuso, em situação difícil. Tg 1,5: Se algum de vós tem falta de sabedoria, peça-a a Deus. Pr 15,22: Os projetos falham por falta de conselho; são bem-sucedidos pelos muitos conselheiros. A tradição bíblica valoriza imensamente o conselho sábio.\n\nO conselho (consilium) é um dos dons do Espírito Santo (Is 11,2) — graça especial para discernir o caminho reto em circunstâncias complexas. Santos conselheiros marcaram a história: São Filipe Néri (o confessor alegre de Roma), São João Bosco (educador dos jovens), Santo Padre Pio (direção espiritual por décadas).\n\nMas dar conselho não é ministério improvisado. Requer: experiência de vida, formação teológica ou pelo menos bom conhecimento da doutrina, empatia, discrição, humildade (reconhecer limites). Aconselhar sem preparo é imprudência; opinar como se fosse conselho, é maledicência."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação concreta",
      "body": "Práticas para aconselhar bem: (1) Ouvir primeiro, muito mais que falar. A maioria só precisa ser ouvida e, ao falar, já se aclara. (2) Não dar conselhos sem ser chamado (conselho não pedido é maledicência). (3) Nunca aconselhar em matéria grave sem refletir, rezar, consultar. (4) Dirigir a pessoa a quem tem mais competência (padre, médico, psicólogo, advogado).\n\nNão confundir com direção espiritual formal: essa é ministério que exige preparação específica (padres, religiosos, leigos com formação). O conselho ordinário entre amigos é mais modesto: orientar, sugerir, partilhar experiência.\n\nO que evitar: dar conselho contrário à doutrina católica (mesmo que o aflito peça); aconselhar abandono de deveres de estado; dar conselhos reacionários (sempre rigorista) ou permissivistas (sempre leniente); aconselhar com base no que eu faria (e não no que serve ao outro).\n\nConselho aos jovens: pais, padrinhos, avós têm responsabilidade especial. Não impor, mas orientar. Não calar diante de escolhas graves (casamento, vocação, profissão) — oferecer perspectiva com respeito. Santo Padre Jerzy Popieluszko aconselhou jovens poloneses a resistir ao comunismo; foi martirizado, mas sua palavra transformou gerações.\n\nOração do conselheiro: Espírito Santo, dai-me o dom do conselho. Que minhas palavras sejam luz, não peso; verdade, não manipulação; caridade, não juízo. Ajudai-me a discernir quando falar e quando calar; quando afirmar e quando perguntar."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Tiago 1,5; Provérbios 15,22; 11,14", "url": null, "page": null },
    { "kind": "scripture", "label": "Isaías 11,2 (dom do conselho)", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1831, 2447", "url": null, "page": null },
    { "kind": "other", "label": "São Filipe Néri; São João Bosco; São Pio de Pietrelcina (direção espiritual)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 2. Ensinar os ignorantes
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'obras-misericordia',
  '2ee7f5d5-8263-4cbd-bc3a-f2e488ec9698',
  $json$[
    {
      "slug": "contexto_biblico",
      "title": "Contexto bíblico",
      "body": "Mt 28,19-20: Ide, pois, fazei discípulos de todas as nações... ensinando-as a observar tudo o que vos tenho mandado. O mandato missionário é eminentemente ensinar. O discipulado cristão é aprendizagem: segui-me (Mt 4,19) é convite a tornar-se aluno do Mestre.\n\nA palavra catequese vem do grego katechein (ressoar, ecoar) — repetir, ensinar pela palavra até que ressoe na alma. Santo Agostinho escreveu De Catechizandis Rudibus (Sobre o Catequizar os Rudes) — manual para ensinar cristãos iniciantes. Ensinar a fé é obra nobilíssima e específica.\n\nA ignorância religiosa hoje é alarmante — muitos batizados não sabem rezar um Pai Nosso, não entendem o Credo, nunca leram o Evangelho. Ensinar não é humilhar; é restaurar uma dignidade. A pessoa instruída na fé vive melhor, decide melhor, é mais feliz."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação concreta",
      "body": "Catequese paroquial: voluntariar-se como catequista. A formação é oferecida gratuitamente pela Diocese. Preparar crianças para Primeira Comunhão, jovens para Crisma, adultos para o Catecumenato (RICA — Rito de Iniciação Cristã de Adultos). Os catequistas são tesouro da Igreja.\n\nFormação em família: pais, padrinhos, avós são os primeiros catequistas. Ensinar orações, explicar sinais da cruz e gestos litúrgicos, ler bíblia infantil com pequenos, levar à Missa explicando cada parte. Essa formação familiar é insubstituível.\n\nEducação católica: escolas confessionais precisam de professores católicos comprometidos — não só em religião, mas em todas as matérias. Ensinar com perspectiva cristã (mesmo matemática, história, literatura) é forma alta de obra de misericórdia.\n\nApostolado leigo: cursos de formação para jovens (Escola de Teologia para Leigos, Clube Ágora, movimentos como Comunhão e Libertação, Neocatecumenato, Regnum Christi). Cada um pode encontrar espaço.\n\nAlfabetização: ainda 7% dos brasileiros são analfabetos. Voluntários em programas como MOVA (Movimento de Alfabetização), EJA, Pastoral do Menor — ensinam a ler, e frequentemente levam Cristo junto com as letras.\n\nBooks católicos: emprestar, presentear. Um bom livro pode mudar vidas. Livros acessíveis a começar: Imitação de Cristo (Tomás de Kempis), Vida interior (Josemaría Escrivá: Caminho), Catecismo da Igreja Católica, vidas de santos. Convidar amigos para Bible study semanal é grande obra.\n\nHoje: redes sociais podem ser apostolado se usadas bem. Canais de formação católica (Canção Nova, Milícia da Imaculada, TV Aparecida, podcasts católicos) chegam a milhões. Compartilhar bom conteúdo, comentar respeitosamente, responder dúvidas."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Mateus 28,19-20 (mandato missionário)", "url": null, "page": null },
    { "kind": "scripture", "label": "Daniel 12,3 (os que ensinam brilharão como estrelas)", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 4-25, 2447, 2685", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, De Catechizandis Rudibus", "url": null, "page": null },
    { "kind": "other", "label": "Diretório Geral para a Catequese (Congregação para o Clero)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 3. Corrigir os que erram
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'obras-misericordia',
  'edb1f54d-b1e1-499a-ac08-2bc9cba93bbe',
  $json$[
    {
      "slug": "contexto_biblico",
      "title": "Contexto bíblico",
      "body": "Mt 18,15: Se teu irmão pecar, vai e repreende-o a sós. Se te ouvir, terás ganho teu irmão. Cristo dá o protocolo da correção fraterna: primeiro individual, depois com testemunhas, por fim com a Igreja. A correção pressupõe amor — quem corrige por ódio, não ama; quem não corrige por comodismo, abandona o irmão.\n\nEz 3,17-18 é sério: Filho do homem, eu te constituí guarda da casa de Israel... quando eu disser ao ímpio Morrerás!, e tu não o avisares, nem falares para afastar o ímpio de seu mau caminho, ele morrerá por causa de sua iniquidade, mas reclamarei seu sangue de tua mão. Ver o pecado alheio e calar por conveniência é covardia moral.\n\nLv 19,17: Deves repreender teu próximo, para que não te tornes cúmplice de seu pecado. Tg 5,20: Quem converte um pecador do erro de seu caminho salvará uma alma da morte e cobrirá multidão de pecados. Corrigir é salvar."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação concreta",
      "body": "Princípios da correção fraterna: (1) Amor: corrigir só quem se ama, para o bem dele; (2) Humildade: reconhecer que eu também erro; (3) Oportunidade: escolher o momento — não na raiva, não em público (humilha), não com terceiros pouco envolvidos; (4) Clareza: ser direto mas não ofensivo; (5) Paciência: primeira correção raramente surte efeito imediato; pode ser preciso insistir com caridade.\n\nCorrigir filhos: é dever grave dos pais. Não deixar passar pecados (mentir, desrespeitar, cruzar limites morais). Castigo justo e proporcional. Mais importante: explicar o por quê. Mais importante ainda: o exemplo. Filhos que veem pais íntegros aprendem mais que filhos repreendidos por pais hipócritas.\n\nCorrigir amigos: conquistar primeiro o direito de corrigir pela amizade sincera. Se você só critica, é crítico; se você ama e corrige dentro do amor, é amigo verdadeiro. Santo Agostinho com Alípio foi assim.\n\nCorrigir figuras públicas: hoje há pecados públicos que precisam de correção pública (declarações antifé de políticos católicos, por exemplo). Mas a regra geral é começar pelo mais próximo. Quem não corrige o marido que bebe demais não deveria preocupar-se com a sociedade.\n\nCorrigir em questões de fé e moral graves: se um amigo está num relacionamento adúltero, envolvido em drogas, afastado dos sacramentos por escolha — falar é caridade. Calar por medo de ofender é cumplicidade passiva.\n\nO que evitar: correção vingativa, correção em público (a menos que o erro seja público), correção com sarcasmo, correção pelas redes sociais (meio péssimo para isso), correção por quem não tem autoridade (ex: mercado, padre, vizinho que quase não conhece). A correção é ato de intimidade fraterna, não de denúncia pública."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Mateus 18,15-17; Levítico 19,17", "url": null, "page": null },
    { "kind": "scripture", "label": "Ezequiel 3,17-19; Tiago 5,19-20", "url": null, "page": null },
    { "kind": "scripture", "label": "2 Timóteo 4,2 (corrige, repreende, exorta)", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1829, 2447", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, Carta a Alípio (correção fraterna)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 4. Consolar os aflitos
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'obras-misericordia',
  '60c78d90-8430-40a8-b93b-ce8751184815',
  $json$[
    {
      "slug": "contexto_biblico",
      "title": "Contexto bíblico",
      "body": "2 Cor 1,3-4: Bendito seja Deus e Pai de Nosso Senhor Jesus Cristo, Pai de misericórdias e Deus de toda consolação. Ele nos consola em todas as nossas tribulações, para que possamos consolar os aflitos. Somos consolados para consolar. A consolação é ministério circular.\n\nMt 5,4: Bem-aventurados os que choram, porque serão consolados. Cristo mesmo chorou ante o túmulo de Lázaro (Jo 11,35) e por Jerusalém (Lc 19,41). Deus não despreza as lágrimas humanas: secá-las é missão cristã.\n\nO Consolador por excelência é o Espírito Santo (Parakletos — Aquele que está ao lado) prometido por Cristo (Jo 14,16.26; 15,26; 16,7). Nossa consolação é veículo do Espírito. Quando consolamos um aflito com palavras sinceras ou com silêncio respeitoso, o Espírito Santo está ali agindo."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação concreta",
      "body": "Estar presente: consolar primeiro é presença. Sentar-se ao lado, não ter pressa, ouvir muito, falar pouco. O enlutado, o deprimido, o rejeitado, o doente em fase terminal — todos precisam sobretudo de presença. Palavras virão na hora certa.\n\nNão oferecer explicações fáceis: Deus sabe o que faz, Não chore, Vai passar — essas frases são mais irritantes que consoladoras. Elas reduzem a dor real ao trivial. Frequentemente, a melhor palavra é Estou aqui, Sinto muito, Que posso fazer por você?.\n\nReconhecer o sofrimento: validar a dor antes de tentar consolar. Sim, é muito difícil; é normal sofrer assim. Só depois, com calma e no momento certo, oferecer perspectiva de fé — sem impor.\n\nAjuda prática: o luto desorganiza a vida. Levar refeições prontas, cuidar das crianças por uma tarde, ajudar com papeladas, fazer compras. Esses gestos concretos são consolação real, mais que discursos.\n\nFé e consolação: no momento certo, lembrar que Cristo sofreu, conhece nossa dor, nos aguarda na eternidade. A esperança da ressurreição (1 Ts 4,13: não vos entristeceis como os outros, que não têm esperança) é específica cristã — mas oferecê-la sem cuidado pode parecer frieza.\n\nConsolar deprimidos: depressão clínica é doença. A consolação cristã acompanha o tratamento médico, não o substitui. Animar a pessoa a buscar ajuda profissional; oferecer companhia na caminhada; rezar discretamente por ela.\n\nSantos consoladores: Santa Madre Teresa de Calcutá (consolou milhares de moribundos); Padre Pio (consolou pecadores pela confissão); São João Paulo II após o atentado (perdoou o agressor). O consolador cristão reflete a face do Deus de toda consolação."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "2 Coríntios 1,3-7; Mateus 5,4", "url": null, "page": null },
    { "kind": "scripture", "label": "João 11,35; 14,16 (Parakletos)", "url": null, "page": null },
    { "kind": "scripture", "label": "1 Tessalonicenses 4,13-18", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1829, 2447", "url": null, "page": null },
    { "kind": "other", "label": "Madre Teresa, pastoral das moribundos em Calcutá", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 5. Perdoar as injúrias
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'obras-misericordia',
  '674092a4-33f4-41b3-afa1-1fdd2fe07d34',
  $json$[
    {
      "slug": "contexto_biblico",
      "title": "Contexto bíblico",
      "body": "Mt 6,14-15: Se perdoardes aos homens as suas faltas, também vosso Pai celestial vos perdoará as vossas. Se, porém, não perdoardes aos homens as suas faltas, tampouco vosso Pai vos perdoará. O Pai Nosso ensina: perdoai-nos as nossas ofensas como nós perdoamos aos que nos têm ofendido. É condição: Deus não perdoa quem não perdoa.\n\nMt 18,21-22: Pedro pergunta quantas vezes deve perdoar — até sete? Jesus responde: Não te digo até sete vezes, mas até setenta vezes sete. Perdão ilimitado. A parábola do servo mau (Mt 18,23-35) ilustra: quem não perdoa dívidas pequenas aos outros depois de ter sido perdoado da dívida imensa com Deus é condenado.\n\nSt 6,37: Perdoai e sereis perdoados. O perdão cristão é radical: amar os inimigos (Mt 5,44), orar pelos perseguidores, bem-dizer os que amaldiçoam. Essa é marca específica do cristianismo — nenhuma outra religião leva o perdão a tal extremo."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação concreta",
      "body": "Perdoar não é esquecer: é decidir não cobrar. A memória permanece, a dor pode persistir, mas a vontade solta o outro da dívida. Perdão é ato da vontade, não sentimento. Mesmo quem ainda se sente magoado pode perdoar pela vontade livre.\n\nPerdoar não é necessariamente reconciliar: em casos de abuso, violência, traição grave — perdoar libera meu coração do rancor, mas a prudência pode exigir distância para evitar nova lesão. Perdoar sim; voltar à intimidade, só se houver condições seguras.\n\nPerdoar leva tempo: ofensas graves (abuso infantil, traição conjugal, assassinato de familiar) pedem processo longo. Um ato único de vontade inicia; os sentimentos acompanham gradualmente. Rezar pelo ofensor, mesmo sem sentir nada, é caminho eficaz.\n\nSanta Gianna Molla (1922-1962): mãe que recusou aborto para salvar a filha — e deu a vida por essa decisão. Antes, perdoou o médico que lhe recomendou o aborto. São Maximiliano Kolbe: perdoou os carcereiros nazis enquanto era assassinado. São João Paulo II: perdoou Ali Agca, o turco que tentou matá-lo em 1981.\n\nNa vida ordinária: perdoar marido/esposa pelas pequenas ofensas cotidianas (e há muitas); perdoar pais por suas falhas na educação; perdoar filhos quando desobedecem; perdoar vizinhos, colegas, amigos. O perdão quotidiano é a massa da vida cristã.\n\nSinais de falta de perdão: ruminar mentalmente as ofensas; falar mal do ofensor repetidamente; planejar ou desejar vingança, ainda que indiretamente; evitar o outro por rancor (não por prudência); recusar-se a rezar pelo ofensor.\n\nGraça do perdão: pedir explicitamente. Pai, dai-me a graça de perdoar a X. Não consigo sozinho. Convertei meu coração. Deus infalivelmente responde a essa oração sincera. O perdão é dom; também é ato da nossa vontade. Cooperamos com a graça."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Mateus 6,12-15; 18,21-35", "url": null, "page": null },
    { "kind": "scripture", "label": "Lucas 23,34 (perdoai-lhes, pois não sabem); Mateus 5,43-48", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 2838-2845", "url": null, "page": null },
    { "kind": "other", "label": "João Paulo II e Ali Agca (perdão público em 1983)", "url": null, "page": null },
    { "kind": "other", "label": "Imaculée Ilibagiza (perdão após o genocídio em Ruanda)", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 6. Suportar com paciência as fraquezas do próximo
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'obras-misericordia',
  '49186fca-aec1-417a-b3c8-15b2083f5c6e',
  $json$[
    {
      "slug": "contexto_biblico",
      "title": "Contexto bíblico",
      "body": "Gl 6,2: Carregai as vossas cargas uns dos outros, e assim cumprireis a lei de Cristo. A vida em comunidade — família, trabalho, igreja — inevitavelmente expõe-nos às fraquezas dos outros. Manias, defeitos de caráter, hábitos irritantes, limitações que não vão mudar. A caridade cristã suporta tudo isso com paciência.\n\n1 Cor 13,7: A caridade tudo desculpa, tudo crê, tudo espera, tudo suporta. Tudo suporta — até as piores chagas do outro, não por conivência (o que seria cumplicidade), mas por compreensão: todos somos pecadores em caminho.\n\nEf 4,2: Com toda humildade e mansidão, com paciência, suportando-vos uns aos outros em caridade. Paciência em grego é makrothymia — fôlego longo, ânimo extenso. É virtude de quem joga o longo jogo da santidade, não apenas busca conforto imediato."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação concreta",
      "body": "Na família: esposos suportando pequenas manias do cônjuge (o ronco, a bagunça, a procrastinação crônica); pais suportando adolescentes rebeldes; filhos adultos suportando pais envelhecidos que se tornam mais difíceis. A santidade doméstica é 90% essa paciência contínua.\n\nNo trabalho: colegas chatos, chefes difíceis, subordinados limitados. Não é obrigação amar as personalidades; é obrigação suportar com caridade. Fazer bem o serviço apesar do ambiente. Santo Afonso: O paraíso se ganha suportando — meia verdade, mas verdade profunda.\n\nNa comunidade paroquial: sempre há aquele que atrapalha, o que fala demais, o que quer protagonismo, o detalhista irritante. Suportar em caridade, evitar fofoca, resolver só o essencial.\n\nDiferença entre suportar e ser cúmplice: suportar ronco do cônjuge = caridade; suportar vício destrutivo sem intervenção = cumplicidade. Em casos graves (alcoolismo, violência, abuso), a caridade EXIGE ação, não passividade. Suportar é para as fraquezas comuns, não para os pecados graves.\n\nPaciência com os próprios defeitos: suportar-se a si mesmo com humildade. Santa Teresinha: Ser perfeitamente humilde é suportar-se a si mesma com suas imperfeições como se suporta a outros. Não basear a autoestima no desempenho: basear na filiação divina. Deus me ama como sou, no processo de tornar-me melhor.\n\nOração para paciência: Espírito Santo, ensinai-me a fazer pausas antes de reagir. A respirar antes de falar. A suportar o que não posso mudar. A ter a sabedoria de mudar o que posso e distinguir um do outro (oração da serenidade)."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Gálatas 6,1-2; Efésios 4,1-3", "url": null, "page": null },
    { "kind": "scripture", "label": "1 Coríntios 13,1-7 (hino da caridade)", "url": null, "page": null },
    { "kind": "scripture", "label": "Colossenses 3,12-13", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 2447, 2219", "url": null, "page": null },
    { "kind": "other", "label": "Santa Teresinha do Menino Jesus — pequena via da paciência", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 7. Rezar a Deus pelos vivos e pelos mortos
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'obras-misericordia',
  'c56d82d2-dde1-4c80-b54b-f677661e35e9',
  $json$[
    {
      "slug": "contexto_biblico",
      "title": "Contexto bíblico",
      "body": "Rezar pelos outros é obra de misericórdia coroante — abrange todas as outras. 1 Tm 2,1-4: Recomendo, pois, antes de tudo, que se façam deprecações, orações, súplicas, ações de graças em favor de todos os homens, pelos reis e por todos os que exercem autoridade, para que levemos vida tranquila e serena, em toda piedade e dignidade. Essa é coisa boa e agradável diante de Deus, nosso Salvador.\n\n2 Mac 12,44-46 fundamenta a oração pelos mortos: Santo pensamento orar pelos defuntos, para que sejam libertos de seus pecados. Já no Antigo Testamento encontramos intercessão pelos falecidos. No NT, Paulo ora pelo Onésimo falecido (2 Tm 1,16-18). Tradição milenar.\n\nTg 5,16: Orai uns pelos outros, para que sejais curados. Muito pode a oração perseverante do justo. A intercessão não é luxo espiritual; é serviço ao corpo místico de Cristo. Cada oração pelos outros constrói o Reino."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação concreta",
      "body": "Rezar pelos familiares e amigos: diariamente. Rosário em família com lista de intenções; Pai Nosso incluindo nomes específicos; memento antes de dormir. Família que reza junta permanece junta.\n\nRezar pelos inimigos e aqueles que nos prejudicaram: Mt 5,44 — orai pelos que vos perseguem. Difícil, mas transformador. Quem reza pelo ofensor frequentemente descobre que o rancor se dissipa.\n\nRezar pelo Papa, pelos bispos, pelos sacerdotes: cada dia. O Cânone Romano da Missa já reza por eles, mas a oração privada do fiel apoia o sacerdócio ministerial. São João Maria Vianney: todo bom padre é dom de Deus; todo mau padre é castigo pelos pecados do povo — e pela omissão em rezar por ele.\n\nRezar pelos pecadores em último momento: Nossa Senhora em Fátima pediu aos videntes: Rezai pelos pecadores, muitas almas vão para o inferno por não haver quem reze por elas. Oração das 15h (hora da misericórdia de Santa Faustina): por agonizantes.\n\nRezar pelos defuntos: Missa aplicada ao falecido é oferta máxima. Coroa da Divina Misericórdia em intenção deles. Visitas ao cemitério com orações. Mês de novembro especialmente (indulgências plenárias aplicáveis). Nunca esquecer pais, avós, antepassados falecidos.\n\nRezar pela Igreja e pelo mundo: vocações sacerdotais e religiosas (Mt 9,37-38); fim dos abortos; paz em regiões de guerra; conversão dos povos (especialmente da Rússia, pedido específico de Fátima); cessação de perseguições a cristãos; governantes. As grandes intenções do mundo passam pelas orações ordinárias dos fiéis.\n\nTerço diário: prática concreta de intercessão ampla. Cada mistério pode ser oferecido por intenção específica. Quinze minutos-vinte minutos por dia moldam uma vida cristã consistente.\n\nOferta da Missa: cada Missa pode ser oferecida por intenção específica (CDC cân. 945-958). Oferenda modesta, efeito incomensurável. As Missas Gregorianas (30 Missas em 30 dias por uma alma específica): tradição poderosa. Em muitas paróquias e mosteiros se pode encomendar."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "1 Timóteo 2,1-4; Tiago 5,16", "url": null, "page": null },
    { "kind": "scripture", "label": "2 Macabeus 12,44-46 (orações pelos mortos)", "url": null, "page": null },
    { "kind": "scripture", "label": "Mateus 5,44; 9,37-38", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1032, 2447, 2634-2636, 2742-2745", "url": null, "page": null },
    { "kind": "other", "label": "Nossa Senhora de Fátima — oração pelos pecadores", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- ============================================================================
-- Quiz
-- ============================================================================
with q as (
  insert into public.study_quizzes
    (content_type, content_ref, title, description, passing_score, xp_bonus, reliquia_slug_on_master, status, published_at)
  values (
    'obras-misericordia',
    'topic:obras-espirituais',
    'Prova: Obras de Misericórdia Espirituais',
    'Cobre as 7 obras espirituais que cuidam da alma do próximo.',
    70,
    25,
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
    'Quais são obras de misericórdia espirituais?',
    $json$[{"id":"a","label":"Dar bom conselho"},{"id":"b","label":"Ensinar os ignorantes"},{"id":"c","label":"Visitar os enfermos (é CORPORAL)"},{"id":"d","label":"Perdoar as injúrias"},{"id":"e","label":"Rezar pelos vivos e pelos mortos"}]$json$,
    $json$["a","b","d","e"]$json$,
    'Obras espirituais: dar bom conselho, ensinar ignorantes, corrigir os que erram, consolar aflitos, perdoar injúrias, suportar com paciência as fraquezas, rezar pelos vivos e mortos. Visitar enfermos é CORPORAL.',
    1
  ),
  (
    'single',
    'Qual é o protocolo bíblico para correção fraterna (Mt 18,15-17)?',
    $json$[{"id":"a","label":"Primeiro em público, depois particular"},{"id":"b","label":"Primeiro a sós; se não ouvir, com testemunhas; se ainda não, levar à Igreja"},{"id":"c","label":"Sempre pelas redes sociais"},{"id":"d","label":"Nunca corrigir — só Deus julga"}]$json$,
    $json$["b"]$json$,
    'Mt 18,15-17: primeiro a sós (preserva dignidade do ofensor); se não ouvir, com duas ou três testemunhas; se ainda não, levar à Igreja. Protocolo progressivo que respeita a reputação e dá oportunidades de conversão.',
    2
  ),
  (
    'single',
    'Segundo Cristo (Mt 18,21-22), quantas vezes devemos perdoar?',
    $json$[{"id":"a","label":"Sete vezes"},{"id":"b","label":"Até setenta vezes sete (perdão ilimitado)"},{"id":"c","label":"Três vezes, como nos sacramentos"},{"id":"d","label":"Uma vez apenas"}]$json$,
    $json$["b"]$json$,
    'Cristo responde a Pedro: Até setenta vezes sete. Não é matemática precisa; é perdão ilimitado. A parábola do servo mau (Mt 18,23-35) mostra: quem foi perdoado da grande dívida com Deus não pode cobrar pequenas dívidas dos irmãos.',
    3
  ),
  (
    'truefalse',
    'Perdoar é decisão da vontade, não sentimento — pode-se perdoar mesmo ainda sentindo mágoa.',
    $json$[{"id":"v","label":"Verdadeiro"},{"id":"f","label":"Falso"}]$json$,
    $json$["v"]$json$,
    'Verdadeiro. Perdoar é ato da vontade: decidir não cobrar, entregar a Deus, orar pelo ofensor. Os sentimentos acompanham gradualmente. Muitos santos disseram que perdoaram antes de sentir, e os sentimentos seguiram depois. Também: perdoar não significa necessariamente reconciliar ou voltar à intimidade — em casos de abuso, a prudência pede distância.',
    4
  ),
  (
    'single',
    'A oração pelos defuntos tem base bíblica em:',
    $json$[{"id":"a","label":"2 Macabeus 12,44-46"},{"id":"b","label":"Gênesis 1,1"},{"id":"c","label":"Apocalipse 22,21"},{"id":"d","label":"Mateus 6,9-13"}]$json$,
    $json$["a"]$json$,
    '2 Mac 12,44-46: Judas Macabeu mandou oferecer sacrifícios pelos soldados mortos em pecado, crendo que essa oração podia libertá-los. Santo pensamento orar pelos mortos. Fundamento bíblico da doutrina do Purgatório e da oração pelos defuntos.',
    5
  ),
  (
    'single',
    'Qual santo tem diálogo com Ali Agca (seu agressor) como testemunho emblemático de perdão?',
    $json$[{"id":"a","label":"São Maximiliano Kolbe"},{"id":"b","label":"São João Paulo II"},{"id":"c","label":"São Francisco de Assis"},{"id":"d","label":"Santa Teresinha"}]$json$,
    $json$["b"]$json$,
    'São João Paulo II foi atingido por Ali Agca em 1981. Em 1983, foi visitá-lo na prisão e perdoou-o publicamente. Testemunho extraordinário de perdão cristão no séc. XX. Também são exemplos: Maximiliano Kolbe (perdoou carrascos nazistas), Imaculée Ilibagiza (perdão após genocídio em Ruanda).',
    6
  )
) as data(kind, prompt, options, correct, explanation, sort_order)
on conflict do nothing;
