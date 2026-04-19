-- ============================================================================
-- Sprint 2A.8 — Dogmas sobre as Últimas Coisas (Escatologia): deepdives + quiz
-- ============================================================================
-- 7 subtópicos: morte, céu, inferno, purgatório, fim do mundo / segunda vinda,
-- ressurreição dos mortos, juízo universal.
-- ============================================================================


-- 1. A Morte e Sua Origem
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  'd280e900-fbd4-4a54-9544-c79facc9b28e',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "A morte corporal é consequência do pecado original, não parte original do plano de Deus. Adão e Eva, no estado de justiça original, tinham o dom preternatural da imortalidade corporal: não por natureza, mas por dom divino. Ao perderem a graça, perderam também esse dom, sujeitando a humanidade à morte.\n\nRomanos 5,12 é texto fundamental: Por um só homem entrou o pecado no mundo, e pelo pecado a morte; e assim a morte passou a todos os homens, porque todos pecaram. Sabedoria 2,23-24: Deus criou o homem para a incorruptibilidade... mas por inveja do diabo entrou a morte no mundo.\n\nO Concílio de Trento (Sessão V, 1546, cân. 1 sobre o Pecado Original) definiu: Se alguém disser que Adão, por sua transgressão, não incorreu na ira e indignação de Deus, e consequentemente na morte... e que Adão transmitiu a seus descendentes somente a morte corporal e não o pecado (que é morte da alma), seja anátema. Pelagianos negavam esta ligação morte-pecado; a Igreja afirma-a solenemente."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Santo Agostinho, em De Civitate Dei (Livro XIII) e nos tratados anti-pelagianos, argumenta: a morte é castigo do pecado original, não condição natural. O homem não-caído poderia passar deste mundo à vida celestial sem morrer. A morte entrou no mundo por Adão; a vida eterna, por Cristo.\n\nSanto Atanásio, no De Incarnatione, desenvolve: Cristo venceu a morte morrendo. A morte física continua (no estado atual), mas perdeu seu aguilhão (1 Cor 15,55): não é mais separação definitiva, mas porta para a vida eterna. O cristão não é estoico que aceita a morte porque é inevitável; é pascal que sabe a morte vencida.\n\nSão João Crisóstomo, nas Homilias Pascais, medita: Cristo ressuscitou, e a morte foi derrubada; Cristo ressuscitou, e a vida reina. Essa é a alegria cristã diante da morte."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O Concílio de Trento (Sessão V, 1546) definiu o nexo pecado-morte contra os pelagianos. O Catecismo da Igreja Católica (§§ 1006-1019) ensina: A morte é consequência do pecado. Intérprete autêntico das afirmações da Sagrada Escritura e da Tradição, o Magistério da Igreja ensina que a morte entrou no mundo por causa do pecado do homem.\n\nCIC § 1008: A morte é conseqüência do pecado. Mesmo que o homem possuísse uma natureza mortal, Deus o destinava a não morrer. § 1010: Graças a Cristo, a morte cristã tem significado positivo... Se é verdade que Deus nos chamou, crendo em seu Filho, a receber dele... a sua plenitude, então também no momento da morte o cristão pode encontrar-se com o Senhor.\n\nVaticano II, Gaudium et Spes 18: É diante da morte que o enigma da condição humana atinge o seu ponto culminante... Não apenas é atormentado pela dor e pela dissolução progressiva do corpo, mas mais ainda pelo medo do aniquilamento perpétuo. Instintivamente repugna-lhe e revolta-se contra a sua destruição total... A fé cristã ensina que a morte corporal... será vencida quando a salvação, perdida pelo homem culpado, for restaurada pelo poder do Redentor."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "O cristão deve se preparar para a morte enquanto vive. Não morbidamente, mas seriamente. A oração Memento mori (lembra-te que vais morrer) dos monges medievais não era pessimismo: era realismo sábio. Quem se prepara bem para a morte, vive bem.\n\nOs quatro Novíssimos (morte, juízo, céu, inferno) são tema tradicional de meditação espiritual. Santo Afonso, no Preparação para a Morte, recomenda meditação frequente. Perder de vista a própria mortalidade leva à superficialidade.\n\nNa velhice e em doenças, pedir a Unção dos Enfermos. Confessar-se em perigo de morte. Preparar as exéquias cristãs (Missa de corpo presente, cremação só em casos específicos, túmulo em cemitério consagrado se possível). Cada cristão deve ter feito testamento espiritual — indicações para seus funerais, orações pelas suas intenções, agradecimentos, perdões pedidos e dados. Morrer cristãmente é arte que se aprende vivendo cristãmente."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Romanos 5,12; 6,23", "url": null, "page": null },
    { "kind": "scripture", "label": "Sabedoria 2,23-24", "url": null, "page": null },
    { "kind": "scripture", "label": "1 Coríntios 15,54-57", "url": null, "page": null },
    { "kind": "council", "label": "Concílio de Trento, Sessão V (1546) cân.1", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1006-1019", "url": null, "page": null },
    { "kind": "council", "label": "Vaticano II, Gaudium et Spes 18", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, De Civitate Dei, XIII", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 2. O Céu (Paraíso)
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  '3025d311-515b-4a9a-9307-3ac73ad5b656',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "O Céu é o estado de perfeita bem-aventurança que consiste na visão intuitiva e facial de Deus (visio beatifica). Não é lugar físico cósmico; é estado de união plena com Deus-Trindade, em que o bem-aventurado conhece Deus como Ele é (1 Jo 3,2), e por isso é plenamente feliz.\n\nAs almas dos justos que morrem em estado de graça, livres de toda culpa e pena temporal devidas pelo pecado, entram imediatamente na visão beatífica após a morte. Esta é doutrina definida pelo Papa Bento XII na Constituição Benedictus Deus (1336), contra a opinião de João XXII (que antes pensava que as almas só veriam Deus após o Juízo Final — opinião posteriormente corrigida por ele mesmo).\n\nO Concílio de Florença (1439) reiterou a doutrina no Decreto de União com os Gregos: as almas dos que nada têm a purgar, ou já foram purificadas, são recebidas imediatamente no céu e contemplam claramente a própria Trindade Divina, uns com mais perfeição que outros, segundo a diversidade dos méritos."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Santo Agostinho, nas Confissões e nas últimas meditações antes de sua morte, desenvolve a teologia da visão beatífica: Tarde te amei, beleza tão antiga e tão nova... Tu estavas dentro de mim, e eu fora. O Céu é o repouso final da busca de Deus.\n\nSão Tomás de Aquino (Suma I, q.12; Suma Contra Gentiles III) sistematizou: a visão beatífica é visão intuitiva (não mediada por imagens), direta (o próprio Ser de Deus é objeto do entendimento bem-aventurado), sobrenatural (exige a lumen gloriae, luz da glória — dom divino adicional).\n\nDante Alighieri, no Paraíso da Divina Comédia, traduziu poeticamente a teologia escolástica: os bem-aventurados são unidos em amor, cada qual em sua medida, diferentes mas todos inteiramente felizes. Santa Catarina de Gênova, no Tratado do Purgatório, e Santa Teresa de Jesus, no Castelo Interior, também descreveram experiências místicas que tocam já agora o Céu."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "Benedictus Deus (Bento XII, 1336): Definimos... que as almas dos santos que morreram, antes da Paixão de Cristo e depois... que nada tinham para purificar quando morreram, ou se tivessem alguma coisa para purificar já foram purificadas depois da morte... todas essas almas, logo depois de sua morte e da referida purificação (para aqueles que tinham necessidade dela), ainda antes da ressurreição de seus corpos e do Juízo Final, estiveram, estão e estarão no céu... contemplando a essência divina em visão intuitiva e facial, sem nenhuma criatura mediadora.\n\nConcílio de Florença (1439), Decreto Laetentur Caeli: doutrina reiterada na união com os gregos.\n\nO Catecismo da Igreja Católica (§§ 1023-1029) expõe: Os que morrem na graça e na amizade de Deus e estão perfeitamente purificados vivem para sempre com Cristo. São para sempre semelhantes a Deus, porque o vêem tal como é (1 Jo 3,2), face a face. § 1024: Esta vida perfeita com a Santíssima Trindade, esta comunhão de vida e de amor com Ela, com a Virgem Maria, os anjos e todos os bem-aventurados, chama-se céu."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "O Céu é o sentido da vida cristã. Todo esforço, toda oração, todo sacramento, toda obra de caridade ordena-se a este fim último: ver Deus eternamente. Perder de vista esse fim é perder o propósito da vida.\n\nA vida aqui é peregrinação (homo viator). Não nos instalamos definitivamente no tempo. Somos cidadãos do Céu; a pátria terrena é provisória. Essa consciência liberta do apego excessivo a bens, honras, prazeres. Como ensinava São Paulo: A nossa pátria está nos céus, de onde esperamos como Salvador o Senhor Jesus Cristo (Fl 3,20).\n\nLedia espiritual proveitosa: as aparições de Lourdes e Fátima, onde a Virgem mostrou o Céu aos videntes. As experiências de Santa Bernadette, Santa Jacinta, Lúcia. A leitura do Catecismo e de teólogos como Balthasar (Espero Apokatastasis? — boa questão), Joseph Ratzinger (Escatologia). Fazer orações pelos que estão no Céu, a eles, com eles — a comunhão dos santos. Acompanhar a Missa pensando: este altar participa do altar eterno onde todos os bem-aventurados já celebram."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "1 João 3,2 (o veremos como Ele é)", "url": null, "page": null },
    { "kind": "scripture", "label": "1 Coríntios 13,12 (veremos face a face)", "url": null, "page": null },
    { "kind": "scripture", "label": "Apocalipse 21,1-4; 22,3-5", "url": null, "page": null },
    { "kind": "papal", "label": "Bento XII, Benedictus Deus (1336)", "url": null, "page": null },
    { "kind": "council", "label": "Concílio de Florença (1439), Laetentur Caeli", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1023-1029", "url": null, "page": null },
    { "kind": "father", "label": "São Tomás de Aquino, Suma I, q.12", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 3. O Inferno
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  'ea48a170-b258-40cb-bbcd-6ab782277519',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "O Inferno é estado de separação eterna de Deus, destino das almas que morrem em pecado mortal sem arrependimento. Sua existência é dogma de fé católica. Cristo mesmo fala do inferno com clareza em numerosas passagens: o fogo eterno (Mt 25,41), o lugar onde haverá choro e ranger de dentes (Mt 8,12; 13,42.50), onde o verme não morre e o fogo não se apaga (Mc 9,48).\n\nContra o universalismo (doutrina segundo a qual todos seriam salvos ao final, seja imediatamente, seja após purificação infinita), a Igreja Católica afirma: há pessoas que se condenam eternamente por rejeição livre e definitiva do amor de Deus. Deus não quer a condenação de ninguém (1 Tm 2,4), mas respeita a liberdade humana: quem persiste obstinadamente em recusar a Deus escolhe sua sorte.\n\nO principal sofrimento do inferno é a pena de dano (poena damni): separação de Deus, privação definitiva da visão beatífica. Esta pena essencial é acompanhada de penas sensíveis (poenae sensus), descritas por Cristo com imagens de fogo. A teologia debate se o fogo é material, metafórico ou misterioso — mas o fato é definido."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Orígenes propôs a apokatástasis (restauração final de todos, inclusive dos demônios, após purificação infinita). Essa doutrina foi condenada pelos Padres — São Justiniano em 543, e o II Concílio de Constantinopla (553) implicitamente.\n\nSanto Agostinho, em De Civitate Dei (Livro XXI), defende vigorosamente a realidade e eternidade do inferno contra os misericordiosos que queriam mitigá-lo. Seu argumento: Deus respeita a liberdade humana; o pecador obstinado escolhe livremente separar-se de Deus eternamente. Negar o inferno é negar a gravidade do pecado e a seriedade da liberdade.\n\nSão Tomás de Aquino (Suma Supl., q.97-99) elabora a teologia: a pena essencial é a perda da visão beatífica (pena de dano); as penas sensíveis são reais mas seu modo específico é mistério. Santa Teresa de Jesus, em sua Vida, narra visão do inferno que lhe foi concedida — experiência terrível que transformou seu celo por almas. Nossa Senhora em Fátima (1917) mostrou o inferno aos três pastorinhos."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O IV Concílio de Latrão (1215) definiu: Aqueles (os que persistirem no mal) irão ao castigo eterno, e estes (os bons) à vida eterna. O Concílio de Florença (1439) reiterou: As almas dos que falecem em pecado mortal atual ou apenas em original descem ao inferno, para serem castigados com penas desiguais.\n\nO Catecismo da Igreja Católica (§§ 1033-1037) expõe: Morrer em pecado mortal, sem o ter arrependido nem acolhido o amor misericordioso de Deus, significa permanecer separado dele para sempre, por efeito de nossa livre escolha. E é este estado de auto-exclusão definitiva da comunhão com Deus e com os bem-aventurados que se designa pela palavra inferno.\n\nCIC § 1035: A doutrina da Igreja afirma a existência do inferno e a sua eternidade. As almas dos que morrem em estado de pecado mortal descem imediatamente após a morte aos infernos, onde sofrem as penas do inferno, o fogo eterno. A pena principal do inferno consiste na separação eterna de Deus, único em quem o homem pode ter a vida e a felicidade para as quais foi criado."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "A doutrina do inferno é misericordiosa, não cruel. Avisar que existe o inferno é como avisar que existe precipício diante dos olhos: quem ama alerta; quem odeia ou é negligente cala. A pregação do inferno por Cristo é ato de amor.\n\nO temor santo do inferno é legítimo e útil. Não é o motivo mais elevado (amar a Deus por si mesmo é superior), mas é motivo eficaz para evitar o pecado. Santo Afonso, São Francisco de Sales, Santo Inácio — todos recomendam meditação sobre as penas eternas como remédio contra tentações.\n\nIsso não gera desespero: Deus é infinitamente misericordioso. Todo pecador pode converter-se enquanto vive; mesmo o último instante de contrição sincera pode salvar. Mas não podemos presumir, nem pensar que o Céu é destino automático de todos. Deus nos deu liberdade real; escolher obstinadamente o mal leva à perdição real. Rezar pela salvação dos moribundos, em especial dos pecadores públicos — obra de misericórdia espiritual suprema."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Mateus 25,41.46 (fogo eterno)", "url": null, "page": null },
    { "kind": "scripture", "label": "Marcos 9,43-48; Lucas 16,19-31", "url": null, "page": null },
    { "kind": "scripture", "label": "Apocalipse 14,11; 20,10-15", "url": null, "page": null },
    { "kind": "council", "label": "IV Latrão (1215); Florença (1439)", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1033-1037", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, De Civitate Dei, XXI", "url": null, "page": null },
    { "kind": "father", "label": "São Tomás de Aquino, Suma Suplementar, q.97-99", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 4. O Purgatório
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  'fa38c8e2-fb14-43e9-b597-71cebcaf897b',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "O Purgatório é estado de purificação após a morte, reservado às almas dos justos que morrem em graça mas ainda têm alguma purificação a fazer: pecados veniais não perdoados, ou pena temporal devida por pecados já perdoados quanto à culpa. É estado transitório, não eterno: todas as almas do Purgatório acabarão no Céu.\n\n2 Macabeus 12,44-46 é o texto bíblico clássico: Judas Macabeu mandou oferecer sacrifícios pelos soldados mortos em pecado, crendo que essa oração podia libertá-los de seus pecados. Santo pensamento orar pelos mortos, para que sejam libertos de seus pecados. Essa prática pressupõe estado intermediário — pois no Céu não precisam de orações, no Inferno não adiantam.\n\nContra os reformadores (que negaram o Purgatório por rejeitar 2 Macabeus do cânon e por interpretações individuais), o Concílio de Trento (Sessão XXV, 1563) definiu solenemente a existência do Purgatório e a utilidade das orações, sufrágios, especialmente da Santa Missa pelos defuntos. Concílios anteriores (Lyon II, 1274; Florença, 1439) já tinham definido."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Desde os primeiros séculos, a Igreja pratica orações pelos defuntos. Tertuliano (séc. III), no De Corona Militis: Oferecemos oblações pelos mortos. Santo Agostinho, nas Confissões (IX,13), pede orações por sua mãe Mônica falecida: Lembra-te, Senhor, de tua serva Mônica... perdoa-lhe suas dívidas.\n\nSanto Agostinho, em diversas obras (Enquiridion, Cidade de Deus XXI), desenvolve a teologia do fogo purificador: haverá uma certa purificação após a morte para alguns crentes que, apesar de não terem apostatado, necessitam ser limpos das imperfeições de sua vida terrena.\n\nSanta Catarina de Gênova, no Tratado do Purgatório (séc. XV), descreve místicamente: as almas do Purgatório experienciam simultaneamente o maior sofrimento (pela consciência de suas imperfeições e pelo atraso em ver Deus) e a maior alegria (pela certeza da salvação e pela pureza crescente que as aproxima da visão beatífica). Elas não trocariam sua sorte por nada, exceto se Deus quisesse aceitá-las desde já.\n\nSão Tomás (Suma Supl., q.69-74) sistematizou: o purgatório existe para que a alma, chegando a Deus, chegue limpa; nenhuma imperfeição pode entrar na glória celestial."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O II Concílio de Lyon (1274), na Profissão de Fé do Imperador Miguel Paleólogo: Se, verdadeiramente penitentes, morrem na caridade de Deus, antes de terem satisfeito por seus pecados de comissão e omissão com frutos dignos de penitência, suas almas são purificadas após a morte por penas purificadoras.\n\nConcílio de Florença (1439), Decreto Laetentur Caeli, reitera. Concílio de Trento (Sessão XXV, 1563), Decreto sobre o Purgatório: A Igreja Católica, instruída pelo Espírito Santo, conforme as Sagradas Escrituras e a antiga tradição dos Padres, nos sagrados concílios, e por último neste ecumênico, ensinou que há purgatório e que as almas ali retidas são ajudadas pelos sufrágios dos fiéis, mormente pelo aceitável sacrifício do altar.\n\nO Catecismo da Igreja Católica (§§ 1030-1032): Aqueles que morrem na graça e amizade de Deus, mas imperfeitamente purificados, embora garantidos de sua salvação eterna, sofrem após a morte uma purificação, a fim de obter a santidade necessária para entrar na alegria do céu. A Igreja chama Purgatório essa purificação final dos eleitos. Bento XVI, em Spe Salvi (2007), oferece profunda meditação sobre o Purgatório como encontro com o fogo do amor de Cristo, que consome o que ainda é imperfeito em nós."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "A doutrina do Purgatório fundamenta a oração pelos defuntos. Mandar celebrar Missas pelos familiares falecidos é o maior ato de caridade — o Santo Sacrifício aplicado por uma alma é infinitamente poderoso. Oferecer rosários, jejuns, sacrifícios pelos defuntos também ajuda. Não esquecer os pais, avós, antepassados — eles podem estar precisando de nossas orações.\n\nO Dia de Finados (2 de novembro) e todo o mês de novembro são consagrados aos defuntos. Visitar cemitérios, rezar pelos que lá repousam, ganhar indulgências plenárias aplicáveis às almas do purgatório — tudo isso é tradição católica viva. As Missas de 7° dia, 30° dia e aniversário de morte são oportunidades importantes.\n\nPara o próprio cristão, é motivo de conversão: quanto mais me purifico agora (pela confissão frequente, penitência, obras boas, indulgências), menos precisarei me purificar depois. Os santos procuram chegar ao Céu direto. A Virgem Maria, concebida sem pecado, foi diretamente à glória. Nós devemos almejar o mesmo — não por orgulho, mas por amor: chegar puros aos braços do Pai. Vida cristã intensa = purgatório abreviado."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "2 Macabeus 12,44-46", "url": null, "page": null },
    { "kind": "scripture", "label": "1 Coríntios 3,13-15 (fogo que prova as obras)", "url": null, "page": null },
    { "kind": "scripture", "label": "Mateus 12,32 (pecado não perdoado neste mundo nem no outro)", "url": null, "page": null },
    { "kind": "council", "label": "Lyon II (1274); Florença (1439); Trento Sessão XXV (1563)", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1030-1032", "url": null, "page": null },
    { "kind": "papal", "label": "Bento XVI, Spe Salvi (2007)", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, Enquiridion; Confissões IX,13", "url": null, "page": null },
    { "kind": "father", "label": "Santa Catarina de Gênova, Tratado do Purgatório", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 5. O Fim do Mundo e a Segunda Vinda de Cristo
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  '2804e9be-dabe-43e5-8a37-7b473fe2d99c',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "No fim dos tempos, Cristo voltará visivelmente, em glória e majestade, para julgar os vivos e os mortos. Esta verdade é proclamada no Credo (et iterum venturus est cum gloria). Não é Segunda Encarnação — é manifestação gloriosa do mesmo Cristo que já veio humildemente.\n\nOs sinais precursores são anunciados em Mt 24 (discurso escatológico): guerras, fomes, terremotos, perseguições, falsos cristos e falsos profetas, pregação universal do Evangelho, a grande tribulação, sinais no sol e na lua. Mas o dia exato, nem o Filho, nem os anjos sabem — só o Pai (Mc 13,32). Portanto, ninguém pode prever datas; quem tenta é falso profeta.\n\nHavera um Anticristo — figura específica que incorporará a oposição final contra Cristo. Mas o termo também se aplica a todo o espírito anti-cristão presente em cada época (1 Jo 2,18.22; 4,3). A Parusia (vinda) de Cristo será precedida pela conversão final de Israel (Rm 11,25-26)."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Santo Irineu de Lião (séc. II), em Adversus Haereses V, dedicou extenso tratado à escatologia. Defendeu a Parusia literal, a ressurreição dos corpos, o milênio (embora seu milênio era moderado, não o milenarismo crasso que foi depois condenado).\n\nSanto Agostinho, em De Civitate Dei (Livros XX-XXII), formulou a leitura escatológica clássica: o milênio de Ap 20 não é período temporal específico, mas todo o tempo da Igreja desde a Ressurreição até a Parusia. Os cristãos já reinam com Cristo agora por graça; a consumação será no fim.\n\nSão João Crisóstomo, São Jerônimo, São Tomás — todos insistem: a Parusia é certa quanto ao fato, incerta quanto ao tempo. Viver em vigilância como servos à espera do Senhor (Lc 12,35-37). Martinho Lutero erradamente previa o fim próximo; o Anticristo identificou com o Papa (erro grave). A Igreja Católica recusou datações."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O Símbolo Apostólico: Donde há de vir a julgar os vivos e os mortos. O Símbolo Niceno-Constantinopolitano: E novamente há de vir, em glória, julgar os vivos e os mortos; e o seu reino não terá fim.\n\nO Concílio IV de Latrão (1215): Cristo virá no fim dos tempos a julgar os vivos e os mortos. Essa é verdade de fé definida.\n\nO Catecismo da Igreja Católica (§§ 668-682, 1038-1041, 675-677) desenvolve. CIC § 668: Cristo é o Senhor da vida eterna. Pertence-lhe, como Redentor do mundo, o pleno direito de pronunciar definitivamente o juízo sobre as obras e os corações dos homens. § 675: Antes da vinda de Cristo, a Igreja deverá passar por uma prova final, que abalará a fé de numerosos crentes... A perseguição que acompanha sua peregrinação sobre a terra desvendará o mistério da iniquidade sob a forma de uma impostura religiosa.\n\nCIC § 677: A Igreja entrará na glória do Reino só por esta Páscoa final, em que seguirá seu Senhor na morte e na Ressurreição. O Reino realizar-se-á, não por um triunfo histórico da Igreja segundo uma ascensão progressiva, mas só por uma vitória de Deus sobre o desencadeamento final do mal."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "A espera da Parusia deve gerar vigilância sóbria, não especulação febril. Jesus advertiu contra falsos profetas que anunciam datas; quem calcula quando será o fim é imprudente. Viver cada dia como se fosse o último, mas cada projeto como se tivéssemos toda a vida.\n\nO Advento, ano litúrgico, é tempo de preparação para esta segunda vinda. Vem, Senhor Jesus! (Maranatha, Ap 22,20) era o grito da Igreja apostólica e deve continuar sendo. O Pai Nosso ensina-nos a pedir: Venha o teu Reino — pedido de que a Parusia se acelere.\n\nNão é pessimismo nem evasão. O cristão trabalha pela justiça, pela paz, pelo cuidado com a criação, pela evangelização — tudo o que ajuda a preparar o Reino. Mas sabe que a realização plena não virá de nós, mas da vinda de Cristo. Essa tensão entre já e ainda não é dinâmica saudável da vida cristã. Nem utopia ingênua, nem derrotismo cínico: vigilância e trabalho; oração e ação; esperança escatológica."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Mateus 24-25 (discurso escatológico)", "url": null, "page": null },
    { "kind": "scripture", "label": "1 Tessalonicenses 4-5; 2 Tessalonicenses 2", "url": null, "page": null },
    { "kind": "scripture", "label": "Apocalipse 19-22", "url": null, "page": null },
    { "kind": "council", "label": "IV Latrão (1215)", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 668-682; 1038-1041", "url": null, "page": null },
    { "kind": "father", "label": "Santo Irineu, Adversus Haereses V", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, De Civitate Dei, XX-XXII", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 6. A Ressurreição dos Mortos
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  '996a885b-0e40-49f7-a4cd-987521e00974',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "No fim dos tempos, todos os mortos ressuscitarão — justos e pecadores — com os seus próprios corpos, agora transformados. Esta é doutrina fundamental, confessada no Credo: Creio na ressurreição da carne (carnis resurrectionem) e na vida eterna.\n\nNão é imortalidade da alma apenas (como no platonismo); é ressurreição corporal. O corpo mesmo que vivemos agora ressuscitará — não um corpo novo desligado do atual, mas o mesmo corpo transformado, glorificado, incorruptível (para os justos) ou permanente em condições adequadas (para os condenados).\n\nO modelo é Cristo ressuscitado: seu Corpo tinha as mesmas feições reconhecíveis (Maria Madalena, Tomé, os de Emaús), mas com propriedades novas — atravessa paredes, aparece e desaparece, não está sujeito à corrupção. Assim serão os corpos dos ressuscitados: São Paulo descreve os quatro dotes dos corpos gloriosos em 1 Cor 15,42-44: incorruptibilidade, glória, vigor, espiritualidade (ou agilidade, sutileza, clareza, impassibilidade na tradição escolástica).\n\nContra os que negaram a ressurreição corporal (alguns gnósticos, maniqueus, alguns racionalistas modernos), a Igreja sempre afirmou-a com firmeza. Definida no IV Concílio de Latrão (1215), no Concílio de Florença (1439) e em todo o Magistério."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Os Padres defenderam vigorosamente a ressurreição contra gnósticos e platonistas que a reduziam a sobrevivência espiritual. Santo Ireneu (Contra as Heresias V), São Justino (Diálogo com Trifão), Atenágoras (De Resurrectione), Tertuliano (De Resurrectione Mortuorum) — todos dedicaram tratados específicos ao tema.\n\nSanto Agostinho, em De Civitate Dei (Livros XX-XXII), encerra sua magna obra com longa dissertação sobre os corpos ressuscitados. Debate questões curiosas: como ressuscitarão os abortados, os deformados, os canibalizados? Sua resposta: Deus, que criou tudo do nada, pode recriar o corpo no estado perfeito que convém à ressurreição, conservando a identidade pessoal.\n\nSão Tomás de Aquino (Suma Supl., q.75-86) sistematiza com precisão escolástica: a ressurreição é corporal, universal (todos, justos e injustos), simultânea (no mesmo momento), numérica (o mesmo corpo, não outro). Os quatro dotes dos corpos gloriosos e a condição dos corpos dos condenados."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O IV Concílio de Latrão (1215), no capítulo Firmiter: Todos ressuscitarão com seus corpos que agora têm, para receberem segundo suas obras — fossem boas ou más — os bons com Cristo a glória perpétua; os maus com o diabo o castigo perpétuo.\n\nO Concílio de Florença (1439), Decreto Laetentur Caeli e Decreto aos Armênios, reitera: Em dia do juízo final todos os homens comparecerão com seus próprios corpos.\n\nO Catecismo da Igreja Católica (§§ 988-1019) expõe amplamente: § 990: O termo carne designa o homem em sua condição de fraqueza e mortalidade. A ressurreição da carne significa que, depois da morte, não haverá só a vida da alma imortal, mas que também nossos corpos mortais tornarão a ter vida. § 997: O que é ressuscitar? Na morte, separação da alma e do corpo, o corpo do homem cai em corrupção, enquanto sua alma vai ao encontro de Deus... Deus, em sua onipotência, restituirá definitivamente a vida incorruptível a nossos corpos, reunindo-os a nossas almas, pela virtude da ressurreição de Jesus."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "A fé na ressurreição muda completamente a atitude diante do corpo. O corpo não é apenas veste temporária da alma; é parte constitutiva da pessoa, destinada à glorificação. Por isso a Igreja sempre cuidou dos corpos dos mortos — funerais, cemitérios, veneração das relíquias dos santos, oração diante dos túmulos.\n\nA cremação, embora permitida desde 1963, deve ser feita com respeito: cinzas em lugar sagrado, não dispersas ao vento nem guardadas em casa. A dignidade do corpo humano persiste mesmo após a morte, porque Deus o chamará novamente à vida.\n\nEsta doutrina também consola o luto. Não nos despedimos eternamente dos que amamos; voltaremos a vê-los em corpo e alma, pessoalmente, reconhecíveis. A esperança cristã é visão concreta da reunião futura com os que partiram no Senhor. O cemitério cristão é lugar de espera, não de desesperança. Santo Agostinho, meditando sobre a morte de sua mãe Mônica: Não lamentava muito profundamente os que se separavam de nós, mas confiávamo-los à misericórdia divina, esperando vê-los no gozo eterno.\n\nPraticamente: cuidar do próprio corpo com dignidade (não abusos, vícios, gluttonia), sabendo que ele é templo do Espírito (1 Cor 6,19) e será glorificado. Mortificar as paixões desordenadas, mas não desprezar o corpo."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "1 Coríntios 15 (capítulo pascal)", "url": null, "page": null },
    { "kind": "scripture", "label": "Daniel 12,2; Ezequiel 37,1-14", "url": null, "page": null },
    { "kind": "scripture", "label": "João 5,28-29; Mateus 22,23-33", "url": null, "page": null },
    { "kind": "council", "label": "IV Latrão (1215), Firmiter", "url": null, "page": null },
    { "kind": "council", "label": "Florença (1439), Decreto aos Armênios", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 988-1019", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, De Civitate Dei, XX-XXII", "url": null, "page": null }
  ]$json$::jsonb,
  'published',
  now()
)
on conflict (content_type, content_ref) do update
  set sections = excluded.sections, sources = excluded.sources,
      status = 'published',
      published_at = coalesce(public.content_deepdive.published_at, now()),
      updated_at = now();


-- 7. O Juízo Universal
insert into public.content_deepdive
  (content_type, content_ref, sections, sources, status, published_at)
values (
  'dogmas',
  '77381ae7-9132-427b-a28b-aa37ba23e711',
  $json$[
    {
      "slug": "contexto_historico",
      "title": "Contexto histórico",
      "body": "Há dois juízos. O juízo particular ocorre imediatamente após a morte de cada pessoa: sua sorte eterna é decidida (Céu, Purgatório ou Inferno). O juízo universal (ou Final) ocorrerá na Parusia, quando Cristo voltar em glória: manifestará publicamente a justiça de Deus sobre toda a história humana, confirmará as sentenças particulares, glorificará os corpos dos bem-aventurados.\n\nMt 25,31-46 (parábola das ovelhas e bodes) é o texto escatológico central. Cristo descreve-se como Juiz que separa bons e maus conforme as obras de misericórdia: Tive fome e me destes de comer... o que fizestes a um destes pequeninos, meus irmãos, a mim o fizestes. A justiça divina não olha apenas atos religiosos; olha o amor concreto ao próximo.\n\nO juízo não é surpresa: cada pessoa será confrontada com suas próprias obras. Cristo mesmo diz: Pelas tuas palavras serás justificado; pelas tuas palavras serás condenado (Mt 12,37). Os livros serão abertos (Ap 20,12) — a consciência de cada um verá toda sua história exposta."
    },
    {
      "slug": "padres_da_igreja",
      "title": "Padres da Igreja",
      "body": "Santo Agostinho, em De Civitate Dei (Livro XX), dedica capítulos ao juízo final: sua realidade, sua publicidade, sua proporcionalidade. Argumenta contra os que achavam injusto o juízo: Deus julga com perfeita justiça, levando em conta todos os aspectos — intenção, circunstâncias, consequências.\n\nSão João Crisóstomo, nas Homilias sobre Mateus (especialmente sobre Mt 25), prega com vigor a necessidade da caridade efetiva. Quem se contenta com piedade interior sem misericórdia para com os pobres, sofrerá o juízo.\n\nSão Tomás (Suma Supl., q.87-90) analisa: o juízo final é simultaneamente manifestação da justiça (os maus veem a justa condenação) e da misericórdia (os bons veem a imensa bondade de Deus recompensando além do que merecem). A ressurreição dos corpos é condição: pois os atos foram praticados com o corpo, e com o corpo serão retribuídos."
    },
    {
      "slug": "magisterio",
      "title": "Magistério da Igreja",
      "body": "O Símbolo Apostólico: Donde há de vir a julgar os vivos e os mortos. O Símbolo Atanasiano (Quicumque): No seu advento, todos os homens hão de ressuscitar com seus corpos, e darão conta de seus próprios atos.\n\nO IV Concílio de Latrão (1215) definiu o juízo geral no capítulo Firmiter.\n\nO Catecismo da Igreja Católica (§§ 1038-1041) expõe. § 1038: A ressurreição de todos os mortos, tanto dos justos como dos injustos (At 24,15), precederá o Juízo Final. Será a hora em que todos os que estão nos túmulos ouvirão a voz do Filho do homem, e sairão os que fizeram o bem, para a ressurreição da vida; os que praticaram o mal, para a ressurreição do juízo (Jo 5,28-29).\n\nCIC § 1039: Diante de Cristo, que é a Verdade, será definitivamente revelada a verdade da relação de cada homem com Deus. O juízo final revelará, até em suas últimas conseqüências, o que cada um realizou de bom ou omitiu de fazer durante sua vida terrena. § 1040: O Juízo Final acontecerá na vinda gloriosa de Cristo. Só o Pai sabe o dia e a hora, só ele decide de seu advento. Então, por intermédio de seu Filho Jesus Cristo, Ele profira sua palavra definitiva sobre toda a história."
    },
    {
      "slug": "aplicacao",
      "title": "Aplicação na vida cristã",
      "body": "Viver no horizonte do juízo final gera seriedade existencial. Nenhum ato é insignificante: tudo terá peso, tudo será revelado. Cristo advertiu: Toda palavra inútil os homens terão de dar conta no dia do juízo (Mt 12,36). Essa consciência disciplina a língua, a atenção, o coração.\n\nMas não é terror paralisante: é incentivo à santidade. O cristão que ama a Cristo deseja o juízo, pois nele verá face a face aquele a quem ama. Como os santos: aguardando com alegria o dia da vinda do Senhor.\n\nPraticamente: meditar regularmente sobre os Novíssimos (morte, juízo, céu, inferno); fazer exame de consciência diário; confessar-se com frequência; cultivar obras de misericórdia corporal e espiritual (Mt 25). Dar esmola ao pobre, visitar o enfermo, acolher o estrangeiro, ensinar quem não sabe — cada ato de amor concreto é tesouro acumulado para o dia do juízo. Seguindo Santa Teresinha do Menino Jesus: quero passar o meu Céu fazendo bem na terra."
    }
  ]$json$::jsonb,
  $json$[
    { "kind": "scripture", "label": "Mateus 25,31-46 (ovelhas e bodes)", "url": null, "page": null },
    { "kind": "scripture", "label": "João 5,28-29; Apocalipse 20,12-15", "url": null, "page": null },
    { "kind": "scripture", "label": "Romanos 2,5-16; 14,10", "url": null, "page": null },
    { "kind": "council", "label": "IV Latrão (1215), Firmiter", "url": null, "page": null },
    { "kind": "catechism", "label": "Catecismo da Igreja Católica, §§ 1038-1041", "url": null, "page": null },
    { "kind": "father", "label": "Santo Agostinho, De Civitate Dei, XX", "url": null, "page": null },
    { "kind": "father", "label": "São Tomás de Aquino, Suma Suplementar, q.87-90", "url": null, "page": null }
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
    'dogmas',
    'topic:dogmas-sobre-as-ultimas-coisas',
    'Prova: Dogmas sobre as Últimas Coisas',
    'Cobre a escatologia católica: morte, céu, inferno, purgatório, fim do mundo, ressurreição dos mortos e juízo universal.',
    70,
    35,
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
    'single',
    'A morte corporal é, segundo a fé católica:',
    $json$[{"id":"a","label":"Condição natural do homem desde a criação"},{"id":"b","label":"Consequência do pecado original — não parte do plano original de Deus"},{"id":"c","label":"Fim absoluto da existência humana"},{"id":"d","label":"Mera ilusão — o corpo não existe realmente"}]$json$,
    $json$["b"]$json$,
    'A morte entrou no mundo pelo pecado (Rm 5,12; Sb 2,23-24). Adão e Eva no estado de justiça original tinham o dom preternatural da imortalidade. Definido por Trento, Sessão V.',
    1
  ),
  (
    'single',
    'Qual Papa definiu em Benedictus Deus (1336) que as almas dos justos, plenamente purificadas, vão IMEDIATAMENTE à visão beatífica após a morte?',
    $json$[{"id":"a","label":"João XXII"},{"id":"b","label":"Bento XII"},{"id":"c","label":"Pio IX"},{"id":"d","label":"Bento XVI"}]$json$,
    $json$["b"]$json$,
    'Bento XII, em Benedictus Deus (1336), definiu solenemente contra a opinião anterior que as almas dos justos (sem necessidade de purificação ou já purificadas) veem Deus face a face imediatamente após a morte — antes mesmo da ressurreição corporal.',
    2
  ),
  (
    'truefalse',
    'O Inferno é estado de separação eterna de Deus, e sua eternidade é dogma de fé católica.',
    $json$[{"id":"v","label":"Verdadeiro"},{"id":"f","label":"Falso"}]$json$,
    $json$["v"]$json$,
    'Verdadeiro. IV Latrão (1215), Florença (1439), CIC §§ 1033-1037. Contra o universalismo (apokatástasis de Orígenes, condenado). A pena principal é a pena de dano: privação eterna da visão beatífica.',
    3
  ),
  (
    'multi',
    'Quais afirmações sobre o Purgatório são verdadeiras?',
    $json$[{"id":"a","label":"É estado de purificação após a morte — não eterno"},{"id":"b","label":"Todas as almas do Purgatório acabarão no Céu"},{"id":"c","label":"As orações e Missas dos vivos as ajudam"},{"id":"d","label":"É mesma realidade que o Inferno"}]$json$,
    $json$["a","b","c"]$json$,
    'Purgatório é purificação temporária das almas dos justos que morrem em graça mas com pena temporal a pagar. Todas acabam no Céu. As orações e sufrágios dos vivos (especialmente Missa) aceleram sua purificação. Definido por Lyon II, Florença, Trento Sessão XXV.',
    4
  ),
  (
    'single',
    'Qual texto escatológico central descreve Cristo como Juiz que separa ovelhas e bodes pelas obras de misericórdia?',
    $json$[{"id":"a","label":"Romanos 8"},{"id":"b","label":"Mateus 25,31-46"},{"id":"c","label":"Apocalipse 4-5"},{"id":"d","label":"João 15"}]$json$,
    $json$["b"]$json$,
    'Mt 25,31-46 — parábola do Juízo Final com ovelhas e bodes. Critério central: obras concretas de misericórdia (dar de comer ao faminto, acolher o estrangeiro, visitar o enfermo, etc.). O que fizerdes a um destes pequeninos, a mim o fizestes.',
    5
  ),
  (
    'single',
    'A ressurreição dos mortos no último dia será:',
    $json$[{"id":"a","label":"Apenas espiritual (a alma voltará a ter vida)"},{"id":"b","label":"Universal (todos ressuscitarão, justos e pecadores) e corporal (com os próprios corpos transformados)"},{"id":"c","label":"Somente para os justos, que ganharão corpos novos"},{"id":"d","label":"Apenas metáfora para a vida eterna"}]$json$,
    $json$["b"]$json$,
    'Ressurreição universal (Jo 5,28-29: todos sairão dos túmulos) e corporal (os próprios corpos, agora transformados). Os justos com corpos gloriosos (1 Cor 15,42-44); os condenados com corpos permanentes para as penas. IV Latrão (1215).',
    6
  ),
  (
    'truefalse',
    'O dia e a hora da Segunda Vinda de Cristo são conhecidos apenas pelo Pai — nem o Filho segundo sua natureza humana, nem os anjos, nem nenhum homem sabem.',
    $json$[{"id":"v","label":"Verdadeiro"},{"id":"f","label":"Falso"}]$json$,
    $json$["v"]$json$,
    'Verdadeiro. Mc 13,32: Quanto àquele dia e àquela hora, ninguém sabe, nem os anjos do céu, nem o Filho, senão somente o Pai. Profetas e sectários que anunciam datas são falsos profetas.',
    7
  )
) as data(kind, prompt, options, correct, explanation, sort_order)
on conflict do nothing;
